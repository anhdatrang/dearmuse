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
    const booking = await Booking.create(req.body);
    let service = null;
    if (req.body.service_id) {
      service = await Service.findById(req.body.service_id);
    }
    await sendConfirmationEmail({ ...booking, ...req.body }, service);
    await discordService.notifyBooking({ ...booking, ...req.body }, service ? service.name : 'Dịch vụ chụp ảnh');

    res.render('booking-confirm', {
      title: 'Đặt lịch thành công — Dear Musé',
      metaDescription: 'Yêu cầu đặt lịch chụp ảnh của bạn đã được tiếp nhận thành công. Dear Musé sẽ liên hệ xác nhận chi tiết concept chụp trong vòng 24 giờ.',
      booking: { ...booking, customer_name: req.body.customer_name },
    });
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
