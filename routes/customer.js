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

router.get('/my-albums', customerController.dashboard);
router.get('/my-albums/:id', customerController.albumDetail);
router.get('/download-album/:id', customerController.downloadAlbum);

module.exports = router;
