const bcrypt = require('bcryptjs');
const db = require('../config/db');
const Booking = require('../models/Booking');
const Portfolio = require('../models/Portfolio');
const Contact = require('../models/Contact');
const Service = require('../models/Service');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ─── Auth ─────────────────────────────────────────────
exports.loginPage = (req, res) => {
  if (req.session.adminId) return res.redirect('/admin/dashboard');
  res.render('admin/login', { title: 'Admin Login — Dear Musé', error: null, layout: false });
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.execute(`SELECT * FROM admins WHERE username = ?`, [username]);
    const admin = rows[0];
    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return res.render('admin/login', { title: 'Admin Login — Dear Musé', error: 'Sai tài khoản hoặc mật khẩu.', layout: false });
    }
    req.session.adminId = admin.id;
    req.session.adminUsername = admin.username;
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error(err);
    res.render('admin/login', { title: 'Admin Login — Dear Musé', error: 'Lỗi đăng nhập.', layout: false });
  }
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
};

// ─── Dashboard ─────────────────────────────────────────
exports.dashboard = async (req, res) => {
  try {
    const statusCounts = await Booking.countByStatus();
    const recentBookings = await Booking.getRecent(7);
    const unreadContacts = await Contact.countUnread();
    
    const counts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    statusCounts.forEach(r => { counts[r.status] = r.count; });

    res.render('admin/dashboard', {
      title: 'Dashboard — Dear Musé Admin',
      layout: 'layouts/admin',
      counts,
      recentBookings,
      unreadContacts,
      adminUsername: req.session.adminUsername,
    });
  } catch (err) {
    console.error(err);
    res.render('admin/dashboard', { title: 'Dashboard', counts: {}, recentBookings: [], unreadContacts: 0, adminUsername: req.session.adminUsername });
  }
};

// ─── Bookings ──────────────────────────────────────────
exports.bookings = async (req, res) => {
  try {
    const status = req.query.status || null;
    const bookings = await Booking.findAll({ status });
    res.render('admin/bookings', {
      title: 'Quản lý Đặt lịch — Dear Musé Admin',
      layout: 'layouts/admin',
      bookings,
      activeStatus: status,
      adminUsername: req.session.adminUsername,
    });
  } catch (err) {
    console.error(err);
    res.render('admin/bookings', { title: 'Đặt lịch', layout: 'layouts/admin', bookings: [], activeStatus: null, adminUsername: req.session.adminUsername });
  }
};

exports.bookingDetail = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.redirect('/admin/bookings');
    res.render('admin/booking-detail', {
      title: `#${booking.booking_code} — Dear Musé Admin`,
      layout: 'layouts/admin',
      booking,
      adminUsername: req.session.adminUsername,
    });
  } catch (err) {
    res.redirect('/admin/bookings');
  }
};

exports.updateBooking = async (req, res) => {
  try {
    const { status, admin_note } = req.body;
    await Booking.updateStatus(req.params.id, status, admin_note);
    req.flash('success', 'Cập nhật thành công!');
    res.redirect(`/admin/bookings/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.redirect('/admin/bookings');
  }
};

// ─── Portfolio ─────────────────────────────────────────
exports.portfolioAdmin = async (req, res) => {
  try {
    const albums = await Portfolio.findAll();
    res.render('admin/portfolio', {
      title: 'Quản lý Portfolio — Dear Musé Admin',
      layout: 'layouts/admin',
      albums,
      adminUsername: req.session.adminUsername,
      success: req.flash('success'),
      error: req.flash('error'),
    });
  } catch (err) {
    res.render('admin/portfolio', { title: 'Portfolio', layout: 'layouts/admin', albums: [], adminUsername: req.session.adminUsername, success: [], error: [] });
  }
};

exports.uploadMiddleware = upload.fields([
  { name: 'cover_image', maxCount: 1 },
  { name: 'images', maxCount: 20 },
]);

exports.createAlbum = async (req, res) => {
  try {
    const coverFile = req.files['cover_image']?.[0];
    const extraFiles = req.files['images'] || [];
    const coverImage = coverFile ? `/uploads/${coverFile.filename}` : '';
    const images = extraFiles.map(f => `/uploads/${f.filename}`);
    const slug = req.body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
    
    await Portfolio.create({ ...req.body, slug, cover_image: coverImage, images });
    req.flash('success', 'Tạo album thành công!');
    res.redirect('/admin/portfolio');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi tạo album.');
    res.redirect('/admin/portfolio');
  }
};

exports.deleteAlbum = async (req, res) => {
  try {
    await Portfolio.delete(req.params.id);
    req.flash('success', 'Đã xoá album.');
    res.redirect('/admin/portfolio');
  } catch (err) {
    req.flash('error', 'Lỗi xoá album.');
    res.redirect('/admin/portfolio');
  }
};

// ─── Contacts ──────────────────────────────────────────
exports.contacts = async (req, res) => {
  try {
    const contacts = await Contact.findAll();
    res.render('admin/contacts', {
      title: 'Tin nhắn — Dear Musé Admin',
      layout: 'layouts/admin',
      contacts,
      adminUsername: req.session.adminUsername,
    });
  } catch (err) {
    res.render('admin/contacts', { title: 'Tin nhắn', layout: 'layouts/admin', contacts: [], adminUsername: req.session.adminUsername });
  }
};

exports.markContactRead = async (req, res) => {
  await Contact.markRead(req.params.id);
  res.redirect('/admin/contacts');
};
