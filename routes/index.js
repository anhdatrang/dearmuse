const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
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

module.exports = router;
