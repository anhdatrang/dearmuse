require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const ejsLayouts = require('express-ejs-layouts');
const compression = require('compression');

const app = express();

// Enable Gzip compression
app.use(compression());

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(ejsLayouts);
app.set('layout', 'layouts/main');

// Static files (có cache 30 ngày để giảm lag)
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '30d'
}));

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'dear_muse_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24h
}));

// Flash messages
app.use(flash());

// Global locals for views
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.currentPath = req.path;
  res.locals.baseUrl = req.protocol + '://' + req.get('host');
  res.locals.sessionUser = req.session.userId ? { id: req.session.userId, name: req.session.userName } : null;
  next();
});

// Routes
const indexRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customer');

app.use('/', indexRoutes);
app.use('/admin', adminRoutes);
app.use('/auth', authRoutes);
app.use('/customer', customerRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { title: 'Không tìm thấy — Dear Musé' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', { title: 'Lỗi — Dear Musé' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✨ Dear Musé đang chạy tại http://localhost:${PORT}`);
});

// Ngăn các lỗi từ background jobs (ví dụ: AI xử lý ảnh) làm crash toàn bộ server
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Background Job Error] Unhandled Promise Rejection:', reason?.message || reason);
});
process.on('uncaughtException', (err) => {
  console.error('[Background Job Error] Uncaught Exception:', err.message);
});

module.exports = app;
