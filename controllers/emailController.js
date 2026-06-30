const db = require('../config/db');
const emailService = require('../services/emailService');
const ejs = require('ejs');
const path = require('path');

exports.marketingPage = async (req, res) => {
  res.render('admin/marketing', {
    title: 'Email Marketing — Dear Musé Admin',
    layout: 'layouts/admin',
    adminUsername: req.session.adminUsername,
    success: req.flash('success'),
    error: req.flash('error')
  });
};

exports.previewMarketingEmail = async (req, res) => {
  try {
    const { content } = req.body;
    const templatePath = path.join(__dirname, '..', 'views', 'emails', 'layout.ejs');
    const html = await ejs.renderFile(templatePath, { body: content || '<p>Nội dung trống</p>', title: 'Preview' });
    res.send(html);
  } catch (error) {
    res.status(500).send('Lỗi render preview: ' + error.message);
  }
};

exports.sendMarketingEmail = async (req, res) => {
  try {
    const { subject, content, recipientType, specificEmail } = req.body;
    
    // Render content into the layout
    const templatePath = path.join(__dirname, '..', 'views', 'emails', 'layout.ejs');
    const htmlContent = await ejs.renderFile(templatePath, { body: content, title: subject });

    let recipients = [];
    if (recipientType === 'all') {
      const [users] = await db.query('SELECT email FROM users WHERE is_verified = 1');
      recipients = users.map(u => u.email);
    } else if (recipientType === 'specific') {
      recipients = specificEmail.split(',').map(e => e.trim()).filter(e => e);
    }

    if (recipients.length === 0) {
      req.flash('error', 'Không tìm thấy người nhận hợp lệ.');
      return res.redirect('/admin/email-marketing');
    }

    // Send emails (background)
    for (let email of recipients) {
      emailService.sendMarketingEmail(email, subject, htmlContent).catch(e => console.error(e));
    }

    req.flash('success', `Đã bắt đầu gửi email cho ${recipients.length} người nhận. Vui lòng kiểm tra Lịch sử Email.`);
    res.redirect('/admin/email-history');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Có lỗi xảy ra khi xử lý email.');
    res.redirect('/admin/email-marketing');
  }
};

exports.emailHistory = async (req, res) => {
  try {
    const [history] = await db.query('SELECT * FROM email_history ORDER BY sent_at DESC LIMIT 100');
    res.render('admin/email-history', {
      title: 'Lịch sử Email — Dear Musé Admin',
      layout: 'layouts/admin',
      history,
      adminUsername: req.session.adminUsername,
      success: req.flash('success')
    });
  } catch (error) {
    console.error(error);
    res.redirect('/admin/dashboard');
  }
};
