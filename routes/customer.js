const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

const requireCustomer = (req, res, next) => {
  if (!req.session.userId) {
    req.flash('error', 'Vui lòng đăng nhập để xem bộ ảnh');
    return res.redirect('/auth/login');
  }
  next();
};

router.use(requireCustomer);

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 30 * 1024 * 1024 } }); // 30MB limit, client compresses before sending

router.get('/my-albums', customerController.dashboard);
router.get('/my-albums/:id', customerController.albumDetail);
router.get('/download-album/:id', customerController.downloadAlbum);
router.post('/albums/:id/filter-face', upload.single('photo'), customerController.filterFace);
router.post('/albums/:id/download-selected', customerController.downloadCustom);

// Loyalty UI Routes
router.get('/my-card', customerController.myCard);
router.get('/redeem', customerController.redeem);
router.get('/loyalty-history', customerController.loyaltyHistory);

module.exports = router;
