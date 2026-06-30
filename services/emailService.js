const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');
const db = require('../config/db');

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: process.env.MAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Render an EJS template into an HTML string
 */
async function renderTemplate(templateName, context) {
  const templatePath = path.join(__dirname, '..', 'views', 'emails', `${templateName}.ejs`);
  return await ejs.renderFile(templatePath, context);
}

/**
 * Log email to database history
 */
async function logEmailHistory(recipient, subject, content, status) {
  try {
    await db.query(
      'INSERT INTO email_history (recipient, subject, content, status) VALUES (?, ?, ?, ?)',
      [recipient, subject, content, status]
    );
  } catch (err) {
    console.error('Error logging email history:', err);
  }
}

/**
 * Send an email using Nodemailer
 * @param {string} to Recipient email
 * @param {string} subject Email subject
 * @param {string} templateName EJS template name (without .ejs extension)
 * @param {object} context Data to pass to EJS template. If templateName is null, context.htmlContent is used as direct HTML.
 */
async function sendMail(to, subject, templateName, context = {}) {
  try {
    const html = templateName ? await renderTemplate(templateName, context) : context.htmlContent;
    
    const mailOptions = {
      from: process.env.MAIL_FROM || '"Dear Musé Studio" <noreply@dearmuse.com>',
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    await logEmailHistory(to, subject, html, 'sent');
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    await logEmailHistory(to, subject, 'Failed to send email. Error: ' + error.message, 'failed');
    throw error;
  }
}

exports.sendMail = sendMail;

exports.sendOTP = async (to, otp, purpose) => {
  const subject = purpose === 'register' ? 'Mã Xác Thực Tài Khoản — Dear Musé' : 'Đặt Lại Mật Khẩu — Dear Musé';
  const message = purpose === 'register' 
    ? 'Cảm ơn bạn đã đăng ký tài khoản tại Dear Musé Studio. Dưới đây là mã xác thực của bạn:' 
    : 'Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã dưới đây:';
  
  return sendMail(to, subject, 'otp', { otp, message, title: subject });
};

exports.sendBookingConfirmation = async (booking) => {
  return sendMail(booking.customer_email, 'Xác Nhận Đặt Lịch — Dear Musé', 'booking-confirmation', { booking, title: 'Xác Nhận Đặt Lịch' });
};

exports.sendInterviewContact = async (to, subject, content) => {
  return sendMail(to, subject, 'interview', { content, title: subject });
};

exports.sendMarketingEmail = async (to, subject, htmlContent) => {
  return sendMail(to, subject, null, { htmlContent });
};
