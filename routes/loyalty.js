const express = require('express');
const router = express.Router();
const loyaltyController = require('../controllers/loyaltyController');

// Middleware kiểm tra đăng nhập (trả về JSON cho API)
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Vui lòng đăng nhập.' });
  }
  next();
};

router.use(requireAuth);

// MEMBER
router.get('/me', loyaltyController.getMe);
router.get('/transactions', loyaltyController.getTransactions);
router.get('/tier-benefits', loyaltyController.getTierBenefits);

// VOUCHERS
router.get('/vouchers/catalog', loyaltyController.getVoucherCatalog);
router.get('/vouchers/my', loyaltyController.getMyVouchers);
router.post('/vouchers/redeem', loyaltyController.redeemVoucher);
router.post('/vouchers/apply', loyaltyController.applyVoucher);

// REFERRAL
router.get('/referral/info', loyaltyController.getReferralInfo);
router.post('/referral/apply', loyaltyController.applyReferral);

module.exports = router;
