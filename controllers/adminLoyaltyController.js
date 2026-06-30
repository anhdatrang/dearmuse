const db = require('../config/db');
const LoyaltyService = require('../services/loyaltyService');

// ─────────────────────────────────────────────────────────────
// MEMBER MANAGEMENT
// ─────────────────────────────────────────────────────────────

exports.listMembers = async (req, res) => {
  try {
    const [members] = await db.query(`
      SELECT m.*, u.email, u.phone, u.name as user_name
      FROM members m
      JOIN users u ON m.user_id = u.id
      WHERE m.is_card_active = 1
      ORDER BY m.manh_sang_total DESC
    `);

    res.render('admin/loyalty', {
      title: 'Quản lý Thẻ Thành Viên — Dear Musé Admin',
      layout: 'layouts/admin',
      members,
      adminUsername: req.session.adminUsername,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi tải danh sách thành viên');
    res.redirect('/admin/dashboard');
  }
};

exports.adjustPoints = async (req, res) => {
  try {
    const memberId = req.params.id;
    const { amount, reason } = req.body;
    
    if (!amount || isNaN(amount) || !reason) {
      req.flash('error', 'Dữ liệu không hợp lệ');
      return res.redirect('/admin/loyalty');
    }

    const adjustAmount = parseInt(amount, 10);
    if (adjustAmount === 0) {
      req.flash('error', 'Số điểm điều chỉnh phải khác 0');
      return res.redirect('/admin/loyalty');
    }

    await LoyaltyService.addManhSang(
      memberId, 
      adjustAmount, 
      'admin_adjust', 
      `Admin điều chỉnh: ${reason}`
    );
    
    await LoyaltyService.checkAndUpgradeTier(memberId);

    req.flash('success', `Đã ${adjustAmount > 0 ? 'cộng' : 'trừ'} ${Math.abs(adjustAmount)} Mảnh Sáng thành công.`);
    res.redirect('/admin/loyalty');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi điều chỉnh điểm: ' + err.message);
    res.redirect('/admin/loyalty');
  }
};

// ─────────────────────────────────────────────────────────────
// VOUCHER MANAGEMENT
// ─────────────────────────────────────────────────────────────

exports.listVouchers = async (req, res) => {
  try {
    const [vouchers] = await db.query(`SELECT * FROM vouchers ORDER BY created_at DESC`);

    res.render('admin/vouchers', {
      title: 'Quản lý Voucher — Dear Musé Admin',
      layout: 'layouts/admin',
      vouchers,
      adminUsername: req.session.adminUsername,
      success: req.flash('success'),
      error: req.flash('error')
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi tải danh sách voucher');
    res.redirect('/admin/dashboard');
  }
};

exports.createVoucher = async (req, res) => {
  try {
    const {
      code_prefix, name, description, voucher_type,
      discount_type, discount_value, max_discount_amount,
      min_order_value, manh_sang_cost, required_tier, valid_days
    } = req.body;

    if (!code_prefix || !name || !voucher_type || !discount_type || !discount_value) {
      req.flash('error', 'Vui lòng điền đầy đủ các trường bắt buộc.');
      return res.redirect('/admin/vouchers');
    }

    const prefix = code_prefix.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 20);

    await db.query(`
      INSERT INTO vouchers 
        (code_prefix, name, description, voucher_type, discount_type, discount_value, 
         max_discount_amount, min_order_value, manh_sang_cost, required_tier, valid_days, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      prefix,
      name,
      description || null,
      voucher_type,
      discount_type,
      parseFloat(discount_value),
      max_discount_amount ? parseFloat(max_discount_amount) : null,
      min_order_value ? parseFloat(min_order_value) : 0,
      manh_sang_cost ? parseInt(manh_sang_cost) : null,
      required_tier || null,
      parseInt(valid_days) || 90
    ]);

    req.flash('success', `Voucher "${name}" đã được tạo thành công.`);
    res.redirect('/admin/vouchers');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi tạo voucher: ' + err.message);
    res.redirect('/admin/vouchers');
  }
};

exports.toggleVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT is_active, name FROM vouchers WHERE id = ?', [id]);
    if (rows.length === 0) {
      req.flash('error', 'Voucher không tồn tại.');
      return res.redirect('/admin/vouchers');
    }
    const newStatus = rows[0].is_active ? 0 : 1;
    await db.query('UPDATE vouchers SET is_active = ? WHERE id = ?', [newStatus, id]);
    req.flash('success', `Voucher "${rows[0].name}" đã ${newStatus ? 'được kích hoạt' : 'bị tắt'}.`);
    res.redirect('/admin/vouchers');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi toggle voucher: ' + err.message);
    res.redirect('/admin/vouchers');
  }
};

exports.deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query('SELECT name FROM vouchers WHERE id = ?', [id]);
    if (rows.length === 0) {
      req.flash('error', 'Voucher không tồn tại.');
      return res.redirect('/admin/vouchers');
    }

    // Kiểm tra xem voucher này đã được dùng chưa
    const [usedRows] = await db.query(
      `SELECT COUNT(*) as cnt FROM member_vouchers WHERE voucher_id = ? AND status IN ('active','used')`,
      [id]
    );
    if (usedRows[0].cnt > 0) {
      req.flash('error', `Không thể xoá voucher "${rows[0].name}" vì đã được cấp phát cho thành viên.`);
      return res.redirect('/admin/vouchers');
    }

    await db.query('DELETE FROM vouchers WHERE id = ?', [id]);
    req.flash('success', `Voucher "${rows[0].name}" đã được xoá.`);
    res.redirect('/admin/vouchers');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi xoá voucher: ' + err.message);
    res.redirect('/admin/vouchers');
  }
};

// ─────────────────────────────────────────────────────────────
// ISSUE MANUAL VOUCHER TO MEMBER
// ─────────────────────────────────────────────────────────────
exports.issueVoucherToMember = async (req, res) => {
  try {
    const { member_id, voucher_id, reason } = req.body;
    if (!member_id || !voucher_id) {
      req.flash('error', 'Thiếu thông tin cấp phát voucher.');
      return res.redirect('/admin/loyalty');
    }

    const VoucherService = require('../services/voucherService');
    const [vRows] = await db.query('SELECT * FROM vouchers WHERE id = ?', [voucher_id]);
    if (vRows.length === 0) {
      req.flash('error', 'Voucher không tồn tại.');
      return res.redirect('/admin/loyalty');
    }
    const v = vRows[0];

    await VoucherService.issueVoucher(member_id, {
      voucher_id: v.id,
      code_prefix: v.code_prefix,
      name: v.name,
      voucher_type: v.voucher_type,
      discount_type: v.discount_type,
      discount_value: v.discount_value,
      max_discount_amount: v.max_discount_amount,
      issued_reason: reason || 'Admin cấp phát'
    });

    req.flash('success', 'Đã cấp phát voucher thành công cho thành viên.');
    res.redirect('/admin/loyalty');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi cấp phát voucher: ' + err.message);
    res.redirect('/admin/loyalty');
  }
};
