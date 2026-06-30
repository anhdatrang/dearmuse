const pool = require('../config/db');
const LoyaltyService = require('./loyaltyService');

class VoucherService {
  /**
   * Sinh mã voucher ngẫu nhiên (VD: GLOW-A3X9KL)
   */
  static generateVoucherCode(prefix) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let suffix = '';
    for (let i = 0; i < 6; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${prefix}-${suffix}`;
  }

  /**
   * Đổi Mảnh Sáng lấy Voucher
   */
  static async redeemVoucher(memberId, voucherId) {
    const conn = await pool.getConnection();
    
    try {
      await conn.beginTransaction();
      
      const [members] = await conn.query('SELECT manh_sang_balance, card_tier FROM members WHERE id = ? FOR UPDATE', [memberId]);
      if (members.length === 0) throw new Error('Member not found');
      const member = members[0];
      
      const [vouchers] = await conn.query('SELECT * FROM vouchers WHERE id = ?', [voucherId]);
      if (vouchers.length === 0) throw new Error('Voucher not found');
      const voucher = vouchers[0];
      
      if (!voucher.is_active || voucher.voucher_type !== 'redeem') {
        throw new Error('Voucher is not available for redeem');
      }
      
      if (member.manh_sang_balance < voucher.manh_sang_cost) {
        throw new Error('INSUFFICIENT_MANH_SANG');
      }
      
      const TIER_ORDER = ['pearl', 'rose', 'gold', 'privilege'];
      if (voucher.required_tier) {
        const memberTierIndex = TIER_ORDER.indexOf(member.card_tier);
        const requiredTierIndex = TIER_ORDER.indexOf(voucher.required_tier);
        if (memberTierIndex < requiredTierIndex) {
          throw new Error('TIER_NOT_ELIGIBLE');
        }
      }
      
      let code = this.generateVoucherCode(voucher.code_prefix);
      
      // Đảm bảo code unique
      while (true) {
        const [existing] = await conn.query('SELECT id FROM member_vouchers WHERE code = ?', [code]);
        if (existing.length === 0) break;
        code = this.generateVoucherCode(voucher.code_prefix);
      }
      
      // Tính ngày hết hạn
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + voucher.valid_days);
      
      // 1. Trừ Mảnh Sáng
      await LoyaltyService.addManhSang(
        memberId, 
        -voucher.manh_sang_cost, 
        'voucher_redeem', 
        `Đổi ${voucher.name}`, 
        voucherId, 
        'voucher', 
        conn
      );
      
      // 2. Tạo MemberVoucher
      await conn.query(
        `INSERT INTO member_vouchers 
        (member_id, voucher_id, code, status, manh_sang_spent, expires_at, issued_reason) 
        VALUES (?, ?, ?, 'active', ?, ?, 'Đổi bằng Mảnh Sáng')`,
        [memberId, voucherId, code, voucher.manh_sang_cost, expiresAt]
      );
      
      await conn.commit();
      return { code, expiresAt, name: voucher.name };
      
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Cấp phát voucher trực tiếp (dành cho Dịp sinh nhật, Referral, Milestone)
   */
  static async issueVoucher(memberId, voucherConfig, conn = null) {
    const isExternalConn = !!conn;
    const db = conn || await pool.getConnection();
    
    try {
      if (!isExternalConn) await db.beginTransaction();
      
      // Tạo một record trong vouchers nếu nó là custom voucher, 
      // hoặc truyền voucher_id vào voucherConfig.
      // Để đơn giản, giả sử voucherConfig có voucher_id hoặc ta tự tạo voucher template.
      let voucherId = voucherConfig.voucher_id;
      let codePrefix = voucherConfig.code_prefix || 'GIFT';
      
      if (!voucherId) {
        const [result] = await db.query(
          `INSERT INTO vouchers (code_prefix, name, voucher_type, discount_type, discount_value, max_discount_amount, is_active) 
           VALUES (?, ?, ?, ?, ?, ?, 0)`, // 0 is_active để ẩn khỏi catalog chung
          [
            codePrefix, 
            voucherConfig.name, 
            voucherConfig.voucher_type, 
            voucherConfig.discount_type, 
            voucherConfig.discount_value, 
            voucherConfig.max_discount_amount || null
          ]
        );
        voucherId = result.insertId;
      }
      
      let code = this.generateVoucherCode(codePrefix);
      while (true) {
        const [existing] = await db.query('SELECT id FROM member_vouchers WHERE code = ?', [code]);
        if (existing.length === 0) break;
        code = this.generateVoucherCode(codePrefix);
      }
      
      const expiresAt = voucherConfig.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Mặc định 30 ngày
      
      await db.query(
        `INSERT INTO member_vouchers 
        (member_id, voucher_id, code, status, expires_at, issued_reason) 
        VALUES (?, ?, ?, 'active', ?, ?)`,
        [memberId, voucherId, code, expiresAt, voucherConfig.issued_reason]
      );
      
      if (!isExternalConn) await db.commit();
      return { code, expiresAt };
    } catch (error) {
      if (!isExternalConn) await db.rollback();
      throw error;
    } finally {
      if (!isExternalConn) db.release();
    }
  }

  /**
   * Áp dụng voucher khi tạo Booking hoặc thanh toán
   */
  static async applyVoucher(memberId, voucherCode, totalAmount) {
    const [rows] = await pool.query(
      `SELECT mv.*, v.discount_type, v.discount_value, v.max_discount_amount, v.min_order_value 
       FROM member_vouchers mv
       JOIN vouchers v ON mv.voucher_id = v.id
       WHERE mv.code = ? AND mv.member_id = ?`,
      [voucherCode, memberId]
    );
    
    if (rows.length === 0) {
      throw new Error('VOUCHER_INVALID_OR_NOT_YOURS');
    }
    
    const voucher = rows[0];
    
    if (voucher.status !== 'active') {
      throw new Error('VOUCHER_ALREADY_USED_OR_CANCELLED');
    }
    
    if (new Date() > new Date(voucher.expires_at)) {
      throw new Error('VOUCHER_EXPIRED');
    }
    
    if (totalAmount < voucher.min_order_value) {
      throw new Error('ORDER_VALUE_NOT_ENOUGH');
    }
    
    let discount = 0;
    if (voucher.discount_type === 'fixed') {
      discount = parseFloat(voucher.discount_value);
    } else if (voucher.discount_type === 'percent') {
      discount = (totalAmount * parseFloat(voucher.discount_value)) / 100;
      if (voucher.max_discount_amount && discount > voucher.max_discount_amount) {
        discount = parseFloat(voucher.max_discount_amount);
      }
    }
    
    // Nếu discount > tổng tiền
    if (discount > totalAmount) {
      discount = totalAmount;
    }
    
    return {
      isValid: true,
      memberVoucherId: voucher.id,
      discountAmount: discount,
      finalAmount: totalAmount - discount
    };
  }

  /**
   * Đánh dấu voucher đã dùng (Gọi khi Booking confirmed/completed)
   */
  static async markVoucherAsUsed(memberVoucherId, bookingId, conn = null) {
    const db = conn || pool;
    await db.query(
      `UPDATE member_vouchers 
       SET status = 'used', used_at = NOW(), used_on_booking_id = ? 
       WHERE id = ?`,
      [bookingId, memberVoucherId]
    );
  }
}

module.exports = VoucherService;
