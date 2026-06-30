const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/db');
const emailService = require('../services/emailService');
const discordService = require('../services/discordService');

function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

exports.getLogin = (req, res) => {
  res.render('auth/login', { title: 'Đăng Nhập Khách Hàng - Dear Musé' });
};

exports.postLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      req.flash('error', 'Email hoặc mật khẩu không đúng');
      return res.redirect('/auth/login');
    }
    const user = users[0];
    
    if (!user.is_verified) {
      // User is not verified, send OTP and redirect to verify
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
      await db.query('INSERT INTO otps (email, otp, purpose, expires_at) VALUES (?, ?, ?, ?)', [email, otp, 'register', expiresAt]);
      await emailService.sendOTP(email, otp, 'register');
      
      req.flash('error', 'Tài khoản chưa được xác thực. Chúng tôi đã gửi lại mã OTP vào email của bạn.');
      return res.redirect(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      req.flash('error', 'Email hoặc mật khẩu không đúng');
      return res.redirect('/auth/login');
    }
    req.session.userId = user.id;
    req.session.userName = user.name;
    req.flash('success', 'Đăng nhập thành công');
    res.redirect('/customer/my-albums');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Lỗi hệ thống');
    res.redirect('/auth/login');
  }
};

exports.getRegister = (req, res) => {
  res.render('auth/register', { title: 'Đăng Ký Khách Hàng - Dear Musé' });
};

exports.postRegister = async (req, res) => {
  const { name, email, password, phone } = req.body;
  try {
    const [existing] = await db.query('SELECT id, is_verified FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      if (existing[0].is_verified) {
        req.flash('error', 'Email này đã được đăng ký');
        return res.redirect('/auth/register');
      } else {
        // Exists but not verified, update password and resend OTP
        const hash = await bcrypt.hash(password, 10);
        await db.query('UPDATE users SET name = ?, password_hash = ?, phone = ? WHERE email = ?', [name, hash, phone, email]);
      }
    } else {
      const hash = await bcrypt.hash(password, 10);
      await db.query('INSERT INTO users (name, email, password_hash, phone, is_verified) VALUES (?, ?, ?, ?, 0)', [name, email, hash, phone]);
    }

    // Generate and send OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await db.query('INSERT INTO otps (email, otp, purpose, expires_at) VALUES (?, ?, ?, ?)', [email, otp, 'register', expiresAt]);
    
    await emailService.sendOTP(email, otp, 'register');

    req.flash('success', 'Mã xác thực đã được gửi đến email của bạn');
    res.redirect(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
  } catch (error) {
    console.error(error);
    req.flash('error', 'Lỗi hệ thống');
    res.redirect('/auth/register');
  }
};

exports.getVerifyOTP = (req, res) => {
  const email = req.query.email || '';
  res.render('auth/verify-otp', { title: 'Xác thực Email - Dear Musé', email });
};

exports.postVerifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const [otps] = await db.query('SELECT * FROM otps WHERE email = ? AND otp = ? AND purpose = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1', [email, otp, 'register']);
    
    if (otps.length === 0) {
      req.flash('error', 'Mã OTP không đúng hoặc đã hết hạn');
      return res.redirect(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
    }

    // Mark user as verified
    await db.query('UPDATE users SET is_verified = 1 WHERE email = ?', [email]);
    await db.query('DELETE FROM otps WHERE email = ? AND purpose = ?', [email, 'register']);

    // Fetch user details to send notification
    const [users] = await db.query('SELECT name, email, phone FROM users WHERE email = ?', [email]);
    if (users.length > 0) {
      await discordService.notifyNewUser(users[0]);
    }

    req.flash('success', 'Xác thực tài khoản thành công. Vui lòng đăng nhập.');
    res.redirect('/auth/login');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Lỗi hệ thống');
    res.redirect(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
  }
};

exports.getForgotPassword = (req, res) => {
  res.render('auth/forgot-password', { title: 'Quên Mật Khẩu - Dear Musé' });
};

exports.postForgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      // Don't reveal if user exists or not for security, just say "If email exists..."
      req.flash('success', 'Nếu email hợp lệ, một mã xác thực sẽ được gửi đến hòm thư của bạn.');
      return res.redirect(`/auth/reset-password?email=${encodeURIComponent(email)}`);
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    await db.query('INSERT INTO otps (email, otp, purpose, expires_at) VALUES (?, ?, ?, ?)', [email, otp, 'reset_password', expiresAt]);
    
    await emailService.sendOTP(email, otp, 'reset_password');

    req.flash('success', 'Mã xác thực đã được gửi đến email của bạn');
    res.redirect(`/auth/reset-password?email=${encodeURIComponent(email)}`);
  } catch (error) {
    console.error(error);
    req.flash('error', 'Lỗi hệ thống');
    res.redirect('/auth/forgot-password');
  }
};

exports.getResetPassword = (req, res) => {
  const email = req.query.email || '';
  res.render('auth/reset-password', { title: 'Đặt Lại Mật Khẩu - Dear Musé', email });
};

exports.postResetPassword = async (req, res) => {
  const { email, otp, password } = req.body;
  try {
    const [otps] = await db.query('SELECT * FROM otps WHERE email = ? AND otp = ? AND purpose = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1', [email, otp, 'reset_password']);
    
    if (otps.length === 0) {
      req.flash('error', 'Mã OTP không đúng hoặc đã hết hạn');
      return res.redirect(`/auth/reset-password?email=${encodeURIComponent(email)}`);
    }

    const hash = await bcrypt.hash(password, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE email = ?', [hash, email]);
    await db.query('DELETE FROM otps WHERE email = ? AND purpose = ?', [email, 'reset_password']);

    req.flash('success', 'Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập.');
    res.redirect('/auth/login');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Lỗi hệ thống');
    res.redirect(`/auth/reset-password?email=${encodeURIComponent(email)}`);
  }
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};
