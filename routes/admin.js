const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Auth middleware
const requireAdmin = (req, res, next) => {
  if (!req.session.adminId) return res.redirect('/admin/login');
  next();
};

// Login
router.get('/login', adminController.loginPage);
router.post('/login', adminController.login);
router.get('/logout', requireAdmin, adminController.logout);

// Dashboard
router.get('/', requireAdmin, (req, res) => res.redirect('/admin/dashboard'));
router.get('/dashboard', requireAdmin, adminController.dashboard);
router.get('/analytics', requireAdmin, adminController.analytics);

// Bookings
router.get('/bookings', requireAdmin, adminController.bookings);
router.get('/bookings/:id', requireAdmin, adminController.bookingDetail);
router.post('/bookings/:id/update', requireAdmin, adminController.updateBooking);

// Portfolio
router.get('/portfolio', requireAdmin, adminController.portfolioAdmin);
router.post('/portfolio/create', requireAdmin, adminController.uploadMiddleware, adminController.createAlbum);
router.post('/portfolio/:id/delete', requireAdmin, adminController.deleteAlbum);

// Blog
router.get('/blog', requireAdmin, adminController.blogAdmin);
router.post('/blog/create', requireAdmin, adminController.uploadAny, adminController.createPost);
router.get('/blog/:id/edit', requireAdmin, adminController.editPost);
router.post('/blog/:id/edit', requireAdmin, adminController.uploadAny, adminController.updatePost);
router.post('/blog/:id/delete', requireAdmin, adminController.deletePost);

// Contacts
router.get('/contacts', requireAdmin, adminController.contacts);
router.post('/contacts/:id/read', requireAdmin, adminController.markContactRead);

module.exports = router;
