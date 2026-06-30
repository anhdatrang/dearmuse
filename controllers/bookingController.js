const { validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const emailService = require('../services/emailService');
const discordService = require('../services/discordService');
const db = require('../config/db');

async function sendConfirmationEmail(booking, service) {
  if (!booking.customer_email) return;
  try {
    booking.serviceName = service ? service.name : 'Dịch vụ chụp ảnh';
    await emailService.sendBookingConfirmation(booking);
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
}

exports.show = async (req, res) => {
  try {
    const services = await Service.findAll();
    const preselectedService = req.query.service || null;
    
    let oldInput = {};
    if (req.session && req.session.userId) {
      const [users] = await db.query('SELECT name, email, phone FROM users WHERE id = ?', [req.session.userId]);
      if (users.length > 0) {
        oldInput = {
          customer_name: users[0].name,
          customer_email: users[0].email,
          customer_phone: users[0].phone
        };
      }
    }

    res.render('booking', {
      title: 'Đặt Lịch Chụp Ảnh Trực Tuyến — Dear Musé',
      metaDescription: 'Đăng ký đặt lịch chụp ảnh nghệ thuật trực tuyến tại Dear Musé Studio. Quy trình nhanh gọn, phản hồi xác nhận nhanh chóng trong vòng 24h, hỗ trợ tư vấn concept hoàn toàn miễn phí.',
      services,
      preselectedService,
      errors: [],
      oldInput,
    });
  } catch (err) {
    console.error(err);
    res.render('booking', {
      title: 'Đặt Lịch Chụp Ảnh Trực Tuyến — Dear Musé',
      metaDescription: 'Đăng ký đặt lịch chụp ảnh nghệ thuật trực tuyến tại Dear Musé Studio. Quy trình nhanh gọn, phản hồi xác nhận nhanh chóng trong vòng 24h, hỗ trợ tư vấn concept hoàn toàn miễn phí.',
      services: [],
      preselectedService: null,
      errors: [],
      oldInput: {}
    });
  }
};

exports.submit = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const services = await Service.findAll();
    return res.render('booking', {
      title: 'Đặt Lịch Chụp Ảnh Trực Tuyến — Dear Musé',
      metaDescription: 'Đăng ký đặt lịch chụp ảnh nghệ thuật trực tuyến tại Dear Musé Studio. Quy trình nhanh gọn, phản hồi xác nhận nhanh chóng trong vòng 24h, hỗ trợ tư vấn concept hoàn toàn miễn phí.',
      services,
      preselectedService: req.body.service_id,
      errors: errors.array(),
      oldInput: req.body,
    });
  }

  try {
    let service = null;
    let deposit_amount = 500000; // Default if no service

    if (req.body.service_id) {
      service = await Service.findById(req.body.service_id);
      if (service && service.price_from) {
        deposit_amount = Math.round((service.price_from * 0.3) / 1000) * 1000; // 30%, rounded to nearest 1000
      }
    }

    req.body.deposit_amount = deposit_amount;
    
    if (req.session.userId) {
      req.body.user_id = req.session.userId;
    }

    const booking = await Booking.create(req.body);
    
    // We do NOT send confirmation email yet, because they haven't paid.
    // Or we send a "pending payment" email? The requirement says "chỉ khi thanh toán xong thì mới coi như là đặt lịch thành công".
    // So we don't send emails to user or discord yet.
    
    res.redirect(`/booking/${booking.booking_code}/pay`);
  } catch (err) {
    console.error(err);
    const services = await Service.findAll();
    res.render('booking', {
      title: 'Đặt Lịch Chụp Ảnh Trực Tuyến — Dear Musé',
      metaDescription: 'Đăng ký đặt lịch chụp ảnh nghệ thuật trực tuyến tại Dear Musé Studio. Quy trình nhanh gọn, phản hồi xác nhận nhanh chóng trong vòng 24h, hỗ trợ tư vấn concept hoàn toàn miễn phí.',
      services,
      preselectedService: req.body.service_id,
      errors: [{ msg: 'Có lỗi xảy ra, vui lòng thử lại.' }],
      oldInput: req.body,
    });
  }
};
