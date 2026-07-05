const bcrypt = require('bcryptjs');
const db = require('../config/db');
const Booking = require('../models/Booking');
const Portfolio = require('../models/Portfolio');
const Contact = require('../models/Contact');
const Service = require('../models/Service');
const Analytics = require('../models/Analytics');
const BlogPost = require('../models/BlogPost');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

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
exports.uploadAny = upload.any();

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

exports.analytics = async (req, res) => {
  try {
    const summary = await Analytics.getSummary();
    const topConcepts = await Analytics.getTopConcepts();
    const topLocations = await Analytics.getTopLocations();
    const timeline = await Analytics.getTimeline();
    const avgTimeOnPage = await Analytics.getAverageTimeOnPage();
    const detailedClicks = await Analytics.getDetailedClicks();
    const unreadContacts = await Contact.countUnread();

    // Query conversion rate: actual bookings vs booking clicks
    const [bookingCountRow] = await db.execute(`SELECT COUNT(*) as count FROM bookings`);
    const totalBookings = bookingCountRow[0].count;

    res.render('admin/analytics', {
      title: 'Phân tích hành vi — Dear Musé Admin',
      layout: 'layouts/admin',
      summary,
      topConcepts,
      topLocations,
      timeline,
      totalBookings,
      unreadContacts,
      avgTimeOnPage,
      detailedClicks,
      adminUsername: req.session.adminUsername,
    });
  } catch (err) {
    console.error('Error in admin analytics:', err);
    res.redirect('/admin/dashboard');
  }
};

// ─── Settings ──────────────────────────────────────────
exports.settings = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT setting_key, setting_value, description FROM settings');
    const settings = {};
    rows.forEach(r => settings[r.setting_key] = { value: r.setting_value, description: r.description });

    res.render('admin/settings', {
      title: 'Cấu hình hệ thống — Dear Musé Admin',
      layout: 'layouts/admin',
      settings,
      adminUsername: req.session.adminUsername,
      success: req.flash('success'),
      error: req.flash('error'),
    });
  } catch (err) {
    console.error(err);
    res.redirect('/admin/dashboard');
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const data = req.body;
    for (const key in data) {
      await db.query('UPDATE settings SET setting_value = ? WHERE setting_key = ?', [data[key], key]);
    }
    req.flash('success', 'Cập nhật cấu hình thành công!');
    res.redirect('/admin/settings');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi cập nhật cấu hình.');
    res.redirect('/admin/settings');
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
    const oldBooking = await Booking.findById(req.params.id);
    
    await Booking.updateStatus(req.params.id, status, admin_note);
    
    // LOYALTY: Trigger logic khi admin confirm booking
    if (status === 'confirmed' && oldBooking.status !== 'confirmed') {
      const LoyaltyService = require('../services/loyaltyService');
      await LoyaltyService.processCompletedBooking(req.params.id);
    }
    
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
    
    let coverImage = '';
    if (coverFile) {
      const coverFilename = coverFile.filename.split('.')[0] + '.webp';
      await sharp(coverFile.path)
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(path.join(coverFile.destination, coverFilename));
      coverImage = `/uploads/${coverFilename}`;
      fs.unlinkSync(coverFile.path); // Delete original
    }

    const images = [];
    for (let f of extraFiles) {
      const fFilename = f.filename.split('.')[0] + '.webp';
      await sharp(f.path)
        .resize({ width: 1920, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(path.join(f.destination, fFilename));
      images.push(`/uploads/${fFilename}`);
      fs.unlinkSync(f.path); // Delete original
    }

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

const emailService = require('../services/emailService');

exports.sendInterviewContact = async (req, res) => {
  try {
    const { email, subject, content } = req.body;
    await emailService.sendInterviewContact(email, subject, content);
    await Contact.markRead(req.params.id); // Mark as read when replied
    res.redirect('/admin/contacts');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/contacts');
  }
};

exports.updateContact = async (req, res) => {
  try {
    const { admin_note, assigned_to } = req.body;
    await Contact.updateNotes(req.params.id, admin_note, assigned_to);
    res.redirect('/admin/contacts');
  } catch (err) {
    console.error(err);
    res.redirect('/admin/contacts');
  }
};

// ─── Blog Management ────────────────────────────────────
exports.blogAdmin = async (req, res) => {
  try {
    const posts = await BlogPost.findAllAdmin();
    res.render('admin/blog', {
      title: 'Quản lý Blog — Dear Musé Admin',
      layout: 'layouts/admin',
      posts,
      adminUsername: req.session.adminUsername,
      success: req.flash('success'),
      error: req.flash('error'),
    });
  } catch (err) {
    console.error(err);
    res.render('admin/blog', {
      title: 'Quản lý Blog',
      layout: 'layouts/admin',
      posts: [],
      adminUsername: req.session.adminUsername,
      success: [],
      error: [],
    });
  }
};

const processImageFile = async (file) => {
  if (!file) return '';
  const webpFilename = file.filename.split('.')[0] + '.webp';
  await sharp(file.path)
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(path.join(file.destination, webpFilename));
  fs.unlinkSync(file.path); // Delete original
  return `/uploads/${webpFilename}`;
};

exports.createPost = async (req, res) => {
  try {
    const files = req.files || [];
    
    // Find cover image file
    const coverFile = files.find(f => f.fieldname === 'cover_image');
    const coverImage = coverFile ? await processImageFile(coverFile) : '';

    // Process blocks JSON
    let blocks = [];
    try {
      if (req.body.content_blocks) {
        blocks = JSON.parse(req.body.content_blocks);
      }
    } catch (e) {
      console.error('Error parsing content_blocks JSON:', e);
    }

    // Process dynamic image slots for each grid
    for (let grid of blocks) {
      const numImages = parseInt(grid.layout || '1');
      if (!Array.isArray(grid.images)) {
        grid.images = [];
      }
      for (let i = 0; i < numImages; i++) {
        const fileKey = `block_image_${grid.blockId}_${i}`;
        const blockFile = files.find(f => f.fieldname === fileKey);
        
        // Ensure every item of grid.images is converted from string to object { url, title, subtitle }
        if (!grid.images[i]) {
          grid.images[i] = { url: '', title: '', subtitle: '' };
        } else if (typeof grid.images[i] === 'string') {
          grid.images[i] = { url: grid.images[i], title: '', subtitle: '' };
        } else {
          grid.images[i].url = grid.images[i].url || '';
          grid.images[i].title = grid.images[i].title || '';
          grid.images[i].subtitle = grid.images[i].subtitle || '';
        }

        if (blockFile) {
          grid.images[i].url = await processImageFile(blockFile);
        }
      }
      grid.images = grid.images.slice(0, numImages);
    }

    // Legacy fallback fields for backwards compatibility
    const legacyImages = [];
    for (let grid of blocks) {
      if (Array.isArray(grid.images)) {
        for (let img of grid.images) {
          const imgUrl = typeof img === 'object' ? img.url : img;
          if (imgUrl) legacyImages.push(imgUrl);
        }
      }
    }

    // Normalized slug generator for beautiful Vietnamese URLs
    const cleanTitle = req.body.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const slug = (cleanTitle || 'post') + '-' + Date.now();
    
    await BlogPost.create({
      title: req.body.title,
      slug,
      category: req.body.category,
      subtitle: req.body.subtitle,
      client_name: req.body.client_name,
      location: req.body.location,
      photographer: req.body.photographer,
      concept: req.body.concept,
      quote: req.body.quote || null,
      summary: req.body.summary,
      content: req.body.content,
      content_outro: req.body.content_outro || null,
      content_blocks: blocks,
      cover_image: coverImage,
      images: legacyImages,
      is_featured: req.body.is_featured === '1' ? 1 : 0,
      status: req.body.status || 'published'
    });
    
    req.flash('success', 'Tạo bài viết thành công!');
    res.redirect('/admin/blog');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi tạo bài viết.');
    res.redirect('/admin/blog');
  }
};

exports.editPost = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      req.flash('error', 'Không tìm thấy bài viết.');
      return res.redirect('/admin/blog');
    }

    res.render('admin/blog_edit', {
      title: 'Chỉnh sửa bài viết — Dear Musé Admin',
      layout: 'layouts/admin',
      post,
      adminUsername: req.session.adminUsername,
      success: req.flash('success'),
      error: req.flash('error'),
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi tải trang chỉnh sửa.');
    res.redirect('/admin/blog');
  }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) {
      req.flash('error', 'Không tìm thấy bài viết.');
      return res.redirect('/admin/blog');
    }

    const files = req.files || [];
    
    // Process cover image (keep old one if not uploaded)
    const coverFile = files.find(f => f.fieldname === 'cover_image');
    const coverImage = coverFile ? await processImageFile(coverFile) : post.cover_image;

    // Process blocks JSON
    let blocks = [];
    try {
      if (req.body.content_blocks) {
        blocks = JSON.parse(req.body.content_blocks);
      }
    } catch (e) {
      console.error('Error parsing content_blocks JSON:', e);
    }

    // Process dynamic image slots for each grid
    for (let grid of blocks) {
      const numImages = parseInt(grid.layout || '1');
      if (!Array.isArray(grid.images)) {
        grid.images = [];
      }
      for (let i = 0; i < numImages; i++) {
        const fileKey = `block_image_${grid.blockId}_${i}`;
        const blockFile = files.find(f => f.fieldname === fileKey);
        
        // Ensure every item of grid.images is converted from string to object { url, title, subtitle }
        if (!grid.images[i]) {
          grid.images[i] = { url: '', title: '', subtitle: '' };
        } else if (typeof grid.images[i] === 'string') {
          grid.images[i] = { url: grid.images[i], title: '', subtitle: '' };
        } else {
          grid.images[i].url = grid.images[i].url || '';
          grid.images[i].title = grid.images[i].title || '';
          grid.images[i].subtitle = grid.images[i].subtitle || '';
        }

        if (blockFile) {
          grid.images[i].url = await processImageFile(blockFile);
        }
      }
      grid.images = grid.images.slice(0, numImages);
    }

    // Legacy fallback fields for backwards compatibility
    const legacyImages = [];
    for (let grid of blocks) {
      if (Array.isArray(grid.images)) {
        for (let img of grid.images) {
          const imgUrl = typeof img === 'object' ? img.url : img;
          if (imgUrl) legacyImages.push(imgUrl);
        }
      }
    }

    await BlogPost.update(post.id, {
      title: req.body.title,
      category: req.body.category,
      subtitle: req.body.subtitle,
      client_name: req.body.client_name,
      location: req.body.location,
      photographer: req.body.photographer,
      concept: req.body.concept,
      quote: req.body.quote || null,
      summary: req.body.summary,
      content: req.body.content,
      content_outro: req.body.content_outro || null,
      content_blocks: blocks,
      cover_image: coverImage,
      images: legacyImages,
      is_featured: req.body.is_featured === '1' ? 1 : 0,
      status: req.body.status || 'published'
    });

    req.flash('success', 'Cập nhật bài viết thành công!');
    res.redirect('/admin/blog');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi cập nhật bài viết.');
    res.redirect('/admin/blog');
  }
};

exports.deletePost = async (req, res) => {
  try {
    await BlogPost.delete(req.params.id);
    req.flash('success', 'Đã xoá bài viết.');
    res.redirect('/admin/blog');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi xoá bài viết.');
    res.redirect('/admin/blog');
  }
};
