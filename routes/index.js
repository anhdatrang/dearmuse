const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Analytics = require('../models/Analytics');
const homeController = require('../controllers/homeController');
const portfolioController = require('../controllers/portfolioController');
const bookingController = require('../controllers/bookingController');
const contactController = require('../controllers/contactController');
const Service = require('../models/Service');

// Home
router.get('/', homeController.home);

// Portfolio
router.get('/portfolio', portfolioController.index);
router.get('/portfolio/:slug', portfolioController.detail);

// Services
router.get('/services', async (req, res) => {
  try {
    const services = await Service.findAll();
    res.render('services', { title: 'Dịch Vụ — Dear Musé', services });
  } catch (err) {
    res.render('services', { title: 'Dịch Vụ — Dear Musé', services: [] });
  }
});

// Pricing
router.get('/pricing', async (req, res) => {
  const services = await Service.findAll().catch(() => []);
  res.render('pricing', { title: 'Bảng Giá — Dear Musé', services });
});

// About
router.get('/about', (req, res) => {
  res.render('about', { title: 'Về Chúng Tôi — Dear Musé' });
});

// Contact
router.get('/contact', contactController.show);
router.post('/contact', [
  body('name').trim().notEmpty().withMessage('Vui lòng nhập tên.'),
  body('message').trim().notEmpty().withMessage('Vui lòng nhập nội dung.'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Email không hợp lệ.'),
], contactController.submit);

// Booking
router.get('/booking', bookingController.show);
router.post('/booking', [
  body('customer_name').trim().notEmpty().withMessage('Vui lòng nhập họ tên.'),
  body('customer_phone')
    .trim().notEmpty().withMessage('Vui lòng nhập số điện thoại.')
    .matches(/^0[3-9][0-9]{8}$/).withMessage('Số điện thoại không hợp lệ (VD: 0912345678).'),
  body('preferred_date')
    .notEmpty().withMessage('Vui lòng chọn ngày.')
    .isAfter(new Date().toISOString().split('T')[0]).withMessage('Ngày phải từ ngày mai trở đi.'),
  body('customer_email').optional({ checkFalsy: true }).isEmail().withMessage('Email không hợp lệ.'),
], bookingController.submit);

// Analytics tracking API
router.post('/api/track', async (req, res) => {
  res.sendStatus(204); // Respond immediately to client

  const { event_type, event_value } = req.body;
  if (!event_type) return;

  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const http = require('http');

  let cleanIp = ip.split(',')[0].trim();
  if (cleanIp.startsWith('::ffff:')) {
    cleanIp = cleanIp.substring(7);
  }

  // Helper to resolve location
  const resolveLocation = () => {
    return new Promise((resolve) => {
      if (cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp === 'localhost' || !cleanIp) {
        const provinces = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Bình Dương', 'Đồng Nai'];
        return resolve(provinces[Math.floor(Math.random() * provinces.length)]);
      }

      http.get(`http://ip-api.com/json/${cleanIp}?fields=status,regionName`, (apiRes) => {
        let data = '';
        apiRes.on('data', chunk => data += chunk);
        apiRes.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve((parsed.status === 'success' && parsed.regionName) ? parsed.regionName : 'Hà Nội');
          } catch (e) {
            resolve('Hà Nội');
          }
        });
      }).on('error', () => {
        resolve('Hà Nội');
      });
    });
  };

  try {
    const location = await resolveLocation();
    await Analytics.logEvent(event_type, event_value, cleanIp, location);
  } catch (err) {
    console.error('Analytics tracking error:', err);
  }
});

module.exports = router;
