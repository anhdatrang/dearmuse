const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { body } = require('express-validator');
const Analytics = require('../models/Analytics');
const homeController = require('../controllers/homeController');
const portfolioController = require('../controllers/portfolioController');
const bookingController = require('../controllers/bookingController');
const contactController = require('../controllers/contactController');
const blogController = require('../controllers/blogController');
const chatbotController = require('../controllers/chatbotController');
const Service = require('../models/Service');
const conceptController = require('../controllers/conceptController');
const cdnController = require('../controllers/cdnController');
const paymentController = require('../controllers/paymentController');
const feedbackController = require('../controllers/feedbackController');

// Image CDN
router.get('/cdn/image', cdnController.serveImage);

// Home
router.get('/', homeController.home);

// Portfolio
router.get('/portfolio', portfolioController.index);
router.get('/portfolio/:slug', portfolioController.detail);

// Blog
router.get('/blog', blogController.index);
router.get('/blog/:slug', blogController.detail);

// Services
router.get('/services', async (req, res) => {
  try {
    const services = await Service.findAll();
    res.render('services', {
      title: 'Gói Dịch Vụ Chụp Ảnh Nghệ Thuật — Dear Musé',
      metaDescription: 'Các gói dịch vụ chụp ảnh nghệ thuật chuyên nghiệp tại Dear Musé: Chụp ảnh Cá Nhân, Chụp ảnh Doanh Nghiệp, và các gói Mở Rộng độc bản. Đặt lịch chụp tư vấn miễn phí ngay hôm nay.',
      services
    });
  } catch (err) {
    res.render('services', {
      title: 'Gói Dịch Vụ Chụp Ảnh Nghệ Thuật — Dear Musé',
      metaDescription: 'Các gói dịch vụ chụp ảnh nghệ thuật chuyên nghiệp tại Dear Musé: Chụp ảnh Cá Nhân, Chụp ảnh Doanh Nghiệp, và các gói Mở Rộng độc bản. Đặt lịch chụp tư vấn miễn phí ngay hôm nay.',
    });
  }
});

router.get('/services/:slug', conceptController.detail);

// Pricing
router.get('/pricing', async (req, res) => {
  const services = await Service.findAll().catch(() => []);
  res.render('pricing', {
    title: 'Bảng Giá Dịch Vụ Chụp Ảnh — Dear Musé',
    metaDescription: 'Xem chi tiết bảng giá các gói chụp ảnh nghệ thuật tại Dear Musé Studio. Cam kết không phát sinh chi phí, hỗ trợ tư vấn trang phục & concept, trả toàn bộ file gốc và ảnh chỉnh sửa chuyên sâu.',
    services
  });
});

// About
router.get('/about', (req, res) => {
  res.render('about', {
    title: 'Câu Chuyện Thương Hiệu & Triết Lý — Dear Musé',
    metaDescription: 'Tìm hiểu về hành trình của Dear Musé Studio. Triết lý nhiếp ảnh tôn trọng cảm xúc chân thật, tận dụng ánh sáng tự nhiên và kiến tạo những tác phẩm nghệ thuật độc bản cho từng khách hàng.'
  });
});

// Loyalty Landing Page
router.get('/loyalty', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'tier_limit_%'");
    const tierLimits = {
      tier_limit_pearl_rose: 300,
      tier_limit_rose_gold: 800,
      tier_limit_gold_privilege: 1500,
      tier_limit_frame_lumiere: 1201
    };
    rows.forEach(r => {
      tierLimits[r.setting_key] = parseInt(r.setting_value) || tierLimits[r.setting_key];
    });

    res.render('loyalty-landing', {
      title: 'Chương Trình Khách Hàng Thân Thiết — Dear Musé',
      metaDescription: 'Tham gia chương trình khách hàng thân thiết của Dear Musé. Tích luỹ Mảnh Sáng để đổi lấy các đặc quyền cao cấp và voucher giá trị.',
      tierLimits
    });
  } catch (err) {
    console.error(err);
    res.render('loyalty-landing', {
      title: 'Chương Trình Khách Hàng Thân Thiết — Dear Musé',
      metaDescription: 'Tham gia chương trình khách hàng thân thiết của Dear Musé. Tích luỹ Mảnh Sáng để đổi lấy các đặc quyền cao cấp và voucher giá trị.',
      tierLimits: {
        tier_limit_pearl_rose: 300,
        tier_limit_rose_gold: 800,
        tier_limit_gold_privilege: 1500,
        tier_limit_frame_lumiere: 1201
      }
    });
  }
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

// Payment Flow
router.get('/booking/:code/pay', paymentController.showPaymentPage);
router.get('/booking/:code/status', paymentController.showStatusPage);
router.post('/api/payment/check/:code', paymentController.checkPaymentAPI);

// Voucher API — không cần đăng nhập, chỉ cần có code
router.post('/api/voucher/apply', paymentController.applyVoucherAPI);

// Analytics tracking API
router.post('/api/track', async (req, res) => {
  res.sendStatus(204); // Respond immediately to client

  const { event_type, event_value, duration_seconds } = req.body;
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
    await Analytics.logEvent(event_type, event_value, cleanIp, location, duration_seconds || 0);
  } catch (err) {
    console.error('Analytics tracking error:', err);
  }
});

// Feedback
router.get('/feedback', feedbackController.index);
router.post('/feedback', feedbackController.submit);

// Chatbot API
router.post('/api/chatbot', chatbotController.chat);

module.exports = router;
