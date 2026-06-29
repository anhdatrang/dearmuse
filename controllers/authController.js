const bcrypt = require('bcryptjs');
const db = require('../config/db');

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
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      req.flash('error', 'Email này đã được đăng ký');
      return res.redirect('/auth/register');
    }
    const hash = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (name, email, password_hash, phone) VALUES (?, ?, ?, ?)', [name, email, hash, phone]);
    req.flash('success', 'Đăng ký thành công, vui lòng đăng nhập');
    res.redirect('/auth/login');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Lỗi hệ thống');
    res.redirect('/auth/register');
  }
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};
