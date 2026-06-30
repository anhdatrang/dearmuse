const pool = require('../config/db');
const LoyaltyService = require('../services/loyaltyService');
const VoucherService = require('../services/voucherService');
const ReferralService = require('../services/referralService');

exports.getMe = async (req, res) => {
  try {
    const member = await LoyaltyService.ensureMember(req.session.userId);
    res.json({ success: true, data: member });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const member = await LoyaltyService.ensureMember(req.session.userId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const [transactions] = await pool.query(
      'SELECT * FROM manh_sang_transactions WHERE member_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [member.id, limit, offset]
    );
    
    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM manh_sang_transactions WHERE member_id = ?', [member.id]);
    
    res.json({
      success: true,
      data: transactions,
      pagination: {
        total: countResult[0].total,
        page,
        limit
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTierBenefits = async (req, res) => {
  try {
    const member = await LoyaltyService.ensureMember(req.session.userId);
    const tier = member.card_tier;
    
    // Giả lập trả về các quyền lợi tương ứng
    const benefitsMap = {
      pearl: ['Giảm sinh nhật 5%'],
      rose: ['Giảm sinh nhật 10%', 'Thêm 1 ảnh retouch', 'Voucher kỷ niệm 1 năm'],
      gold: ['Giảm sinh nhật 15%', 'Thêm 2 ảnh retouch', 'Voucher kỷ niệm 1 năm', 'Ưu tiên lịch chụp', 'Early access concept mới'],
      privilege: ['Giảm sinh nhật 20%', 'Thêm 3 ảnh retouch', 'Voucher kỷ niệm 1 năm', 'Ưu tiên lịch chụp', 'Early access concept mới', 'Trải nghiệm cá nhân hóa']
    };
    
    res.json({ success: true, tier, benefits: benefitsMap[tier] || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// VOUCHERS
exports.getVoucherCatalog = async (req, res) => {
  try {
    const [vouchers] = await pool.query('SELECT * FROM vouchers WHERE is_active = 1 AND voucher_type = "redeem"');
    res.json({ success: true, data: vouchers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.redeemVoucher = async (req, res) => {
  try {
    const member = await LoyaltyService.ensureMember(req.session.userId);
    const { voucher_id } = req.body;
    
    if (!voucher_id) return res.status(400).json({ success: false, message: 'Missing voucher_id' });
    
    const result = await VoucherService.redeemVoucher(member.id, voucher_id);
    res.json({ success: true, data: result, message: 'Đổi voucher thành công' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getMyVouchers = async (req, res) => {
  try {
    const member = await LoyaltyService.ensureMember(req.session.userId);
    const [vouchers] = await pool.query(
      `SELECT mv.*, v.name, v.description, v.discount_type, v.discount_value, v.max_discount_amount 
       FROM member_vouchers mv
       JOIN vouchers v ON mv.voucher_id = v.id
       WHERE mv.member_id = ? 
       ORDER BY mv.created_at DESC`,
      [member.id]
    );
    res.json({ success: true, data: vouchers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.applyVoucher = async (req, res) => {
  try {
    const member = await LoyaltyService.ensureMember(req.session.userId);
    // Trong thực tế sẽ tính toán dựa trên booking, ở đây mô phỏng apply
    const { booking_id, code, total_amount } = req.body; 
    
    if (!code || !total_amount) return res.status(400).json({ success: false, message: 'Thiếu thông tin code hoặc total_amount' });
    
    const result = await VoucherService.applyVoucher(member.id, code, total_amount);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// REFERRAL
exports.getReferralInfo = async (req, res) => {
  try {
    const member = await LoyaltyService.ensureMember(req.session.userId);
    
    // Lấy danh sách đã giới thiệu
    const [referred] = await pool.query(
      `SELECT r.status, r.created_at, u.name 
       FROM referrals r 
       JOIN members m ON r.referee_id = m.id 
       JOIN users u ON m.user_id = u.id 
       WHERE r.referrer_id = ?`,
       [member.id]
    );
    
    res.json({
      success: true,
      data: {
        referral_code: member.referral_code,
        referral_count: member.referral_count,
        history: referred
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.applyReferral = async (req, res) => {
  try {
    const { referral_code } = req.body;
    if (!referral_code) return res.status(400).json({ success: false, message: 'Missing referral_code' });
    
    await ReferralService.applyReferralCode(req.session.userId, referral_code);
    res.json({ success: true, message: 'Áp dụng mã giới thiệu thành công' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
