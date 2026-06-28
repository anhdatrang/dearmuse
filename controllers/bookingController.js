const { validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const nodemailer = require('nodemailer');

async function sendConfirmationEmail(booking, service) {
  if (!booking.customer_email) return;
  
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const serviceName = service ? service.name : 'Dịch vụ chụp ảnh';
    const dateStr = new Date(booking.preferred_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: booking.customer_email,
      subject: `[Dear Musé] Xác nhận đặt lịch #${booking.booking_code}`,
      html: `
        <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; background: #FFF7E6; padding: 40px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <p style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #9C8474; margin: 0 0 8px;">DEAR MUSÉ PHOTO STUDIO</p>
            <h1 style="font-size: 28px; color: #1A1916; margin: 0; font-style: italic;">Đặt lịch thành công</h1>
          </div>
          <hr style="border: none; border-top: 0.5px solid #EDE8DF; margin: 24px 0;" />
          <p style="color: #1A1916; line-height: 1.8;">Xin chào <strong>${booking.customer_name}</strong>,</p>
          <p style="color: #6B6860; line-height: 1.8;">Chúng tôi đã nhận được yêu cầu đặt lịch của bạn và sẽ liên hệ xác nhận trong vòng 24 giờ.</p>
          <div style="background: #F2EDE4; padding: 24px; border-radius: 4px; margin: 24px 0;">
            <p style="margin: 0 0 8px;"><strong>Mã đặt lịch:</strong> ${booking.booking_code}</p>
            <p style="margin: 0 0 8px;"><strong>Dịch vụ:</strong> ${serviceName}</p>
            <p style="margin: 0 0 8px;"><strong>Ngày mong muốn:</strong> ${dateStr}</p>
            <p style="margin: 0;"><strong>Hình thức:</strong> ${booking.location_type === 'studio' ? 'Studio' : booking.location_type === 'outdoor' ? 'Ngoại cảnh' : 'Studio & Ngoại cảnh'}</p>
          </div>
          <p style="color: #6B6860; line-height: 1.8; font-size: 14px;">Nếu có thắc mắc, vui lòng liên hệ qua Facebook hoặc Instagram của <em>Dear Musé</em>.</p>
          <hr style="border: none; border-top: 0.5px solid #EDE8DF; margin: 24px 0;" />
          <p style="text-align: center; color: #9C8474; font-size: 12px; letter-spacing: 0.1em;">© 2025 Dear Musé · Crafted with care.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }
}

exports.show = async (req, res) => {
  try {
    const services = await Service.findAll();
    const preselectedService = req.query.service || null;
    res.render('booking', {
      title: 'Đặt Lịch Chụp Ảnh Trực Tuyến — Dear Musé',
      metaDescription: 'Đăng ký đặt lịch chụp ảnh nghệ thuật trực tuyến tại Dear Musé Studio. Quy trình nhanh gọn, phản hồi xác nhận nhanh chóng trong vòng 24h, hỗ trợ tư vấn concept hoàn toàn miễn phí.',
      services,
      preselectedService,
      errors: [],
      oldInput: {},
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
