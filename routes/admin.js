const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminCustomerController = require('../controllers/adminCustomerController');
const adminUploadController = require('../controllers/adminUploadController');
const emailController = require('../controllers/emailController');
const adminServiceController = require('../controllers/adminServiceController');

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

// Settings
router.get('/settings', requireAdmin, adminController.settings);
router.post('/settings', requireAdmin, adminController.updateSettings);

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
router.post('/contacts/:id/interview', requireAdmin, adminController.sendInterviewContact);
router.post('/contacts/:id/update', requireAdmin, adminController.updateContact);

// Customer & Albums
router.get('/customers', requireAdmin, adminCustomerController.listCustomers);
router.get('/customers/:id/albums', requireAdmin, adminCustomerController.customerAlbums);
router.post('/customers/albums/create', requireAdmin, adminCustomerController.createAlbum);
router.post('/albums/:id/status', requireAdmin, adminCustomerController.updateAlbumStatus);
router.post('/albums/:id/delete', requireAdmin, adminCustomerController.deleteAlbum);
router.post('/albums/:id/upload', requireAdmin, adminUploadController.uploadMiddleware, adminUploadController.uploadPhotos);
router.get('/albums/:id/photos', requireAdmin, adminUploadController.managePhotos);
router.post('/albums/:id/photos/:photoId/delete', requireAdmin, adminUploadController.deletePhoto);
router.post('/albums/:id/reprocess-faces', requireAdmin, adminUploadController.reprocessFaces);
router.get('/photo-edit-requests', requireAdmin, adminCustomerController.listPhotoEditRequests);
router.get('/albums/:id/download-requested', requireAdmin, adminUploadController.downloadRequestedPhotos);
router.post('/albums/:id/upload-edited-batch', requireAdmin, adminUploadController.uploadMiddleware, adminUploadController.uploadEditedPhotosBatch);
router.post('/albums/:id/upload-edited/:requestId', requireAdmin, adminUploadController.uploadSingleMiddleware, adminUploadController.uploadSingleEditedPhoto);
router.post('/albums/:id/complete-edit-request', requireAdmin, adminUploadController.completeEditRequest);

// Email Marketing
router.get('/email-marketing', requireAdmin, emailController.marketingPage);
router.post('/email-marketing/send', requireAdmin, emailController.sendMarketingEmail);
router.post('/email-marketing/preview', requireAdmin, emailController.previewMarketingEmail);
router.get('/email-history', requireAdmin, emailController.emailHistory);

// Services
router.get('/services', requireAdmin, adminServiceController.listServices);
router.get('/services/create', requireAdmin, adminServiceController.createServicePage);
router.post('/services/create', requireAdmin, adminServiceController.uploadMiddleware, adminServiceController.createService);
router.get('/services/:id/edit', requireAdmin, adminServiceController.editServicePage);
router.post('/services/:id/edit', requireAdmin, adminServiceController.uploadMiddleware, adminServiceController.updateService);
router.post('/services/:id/delete', requireAdmin, adminServiceController.deleteService);

// Loyalty
const adminLoyaltyController = require('../controllers/adminLoyaltyController');
router.get('/loyalty', requireAdmin, adminLoyaltyController.listMembers);
router.post('/loyalty/:id/adjust', requireAdmin, adminLoyaltyController.adjustPoints);
router.post('/loyalty/:id/issue-voucher', requireAdmin, adminLoyaltyController.issueVoucherToMember);

// Vouchers
router.get('/vouchers', requireAdmin, adminLoyaltyController.listVouchers);
router.post('/vouchers/create', requireAdmin, adminLoyaltyController.createVoucher);
router.post('/vouchers/:id/toggle', requireAdmin, adminLoyaltyController.toggleVoucher);
// Announcements/Notifications
router.get('/notifications', requireAdmin, adminCustomerController.listAnnouncements);
router.post('/notifications', requireAdmin, adminCustomerController.createAnnouncement);
router.post('/notifications/:id/delete', requireAdmin, adminCustomerController.deleteAnnouncement);

module.exports = router;
