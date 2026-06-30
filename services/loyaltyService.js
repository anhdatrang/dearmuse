const pool = require('../config/db');

const TIER_THRESHOLDS = {
  pearl: 0,
  rose: 300,
  gold: 800,
  privilege: 1500
};

const TIER_ORDER = ['pearl', 'rose', 'gold', 'privilege'];

class LoyaltyService {
  /**
   * Tạo mã Referral ngẫu nhiên (VD: DM-ABCD12)
   */
  static generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'DM-';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Đảm bảo user có record trong bảng members, nếu chưa có thì tạo mới.
   */
  static async ensureMember(userId, conn = null) {
    const db = conn || pool;
    const [rows] = await db.query('SELECT * FROM members WHERE user_id = ?', [userId]);
    
    if (rows.length > 0) {
      return rows[0];
    }
    
    // Chưa có thì tạo mới
    let referralCode = this.generateReferralCode();
    
    // Đảm bảo code là duy nhất
    while (true) {
      const [existing] = await db.query('SELECT id FROM members WHERE referral_code = ?', [referralCode]);
      if (existing.length === 0) break;
      referralCode = this.generateReferralCode();
    }
    
    const [result] = await db.query(
      'INSERT INTO members (user_id, referral_code) VALUES (?, ?)',
      [userId, referralCode]
    );
    
    const [newMember] = await db.query('SELECT * FROM members WHERE id = ?', [result.insertId]);
    return newMember[0];
  }

  /**
   * Tính Mảnh Sáng từ số tiền chi tiêu (10,000 VND = 1 MS)
   */
  static calcSpendManhSang(amountVND) {
    if (!amountVND || amountVND < 0) return 0;
    return Math.floor(amountVND / 10000);
  }

  /**
   * Tính điểm thưởng nhóm (3 người trở lên = 50 điểm/người)
   */
  static calcGroupBonus(groupSize) {
    if (!groupSize || groupSize < 3) return 0;
    return groupSize * 50;
  }

  /**
   * Xác định hạng thẻ dựa trên tổng Mảnh Sáng
   */
  static getTier(totalManhSang) {
    if (totalManhSang >= TIER_THRESHOLDS.privilege) return 'privilege';
    if (totalManhSang >= TIER_THRESHOLDS.gold) return 'gold';
    if (totalManhSang >= TIER_THRESHOLDS.rose) return 'rose';
    return 'pearl';
  }

  /**
   * Thêm/Trừ Mảnh Sáng và ghi log giao dịch
   */
  static async addManhSang(memberId, amount, type, description, referenceId = null, referenceType = null, conn = null) {
    const isExternalConn = !!conn;
    const db = conn || await pool.getConnection();
    
    try {
      if (!isExternalConn) await db.beginTransaction();
      
      const [members] = await db.query('SELECT * FROM members WHERE id = ? FOR UPDATE', [memberId]);
      if (members.length === 0) throw new Error('Member not found');
      
      const member = members[0];
      const newBalance = member.manh_sang_balance + amount;
      
      if (newBalance < 0) {
        throw new Error('INSUFFICIENT_MANH_SANG');
      }
      
      let newTotal = member.manh_sang_total;
      // Chỉ tăng total khi được cộng điểm, không giảm total khi dùng voucher
      if (amount > 0) {
        newTotal += amount;
      }
      
      // Cập nhật member
      await db.query(
        'UPDATE members SET manh_sang_total = ?, manh_sang_balance = ? WHERE id = ?',
        [newTotal, newBalance, memberId]
      );
      
      // Ghi log giao dịch
      await db.query(
        'INSERT INTO manh_sang_transactions (member_id, amount, balance_after, type, description, reference_id, reference_type) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [memberId, amount, newBalance, type, description, referenceId, referenceType]
      );
      
      if (!isExternalConn) await db.commit();
      
      return { newBalance, newTotal };
    } catch (error) {
      if (!isExternalConn) await db.rollback();
      throw error;
    } finally {
      if (!isExternalConn) db.release();
    }
  }

  /**
   * Kiểm tra và thăng hạng nếu đủ điều kiện
   */
  static async checkAndUpgradeTier(memberId, conn = null) {
    const isExternalConn = !!conn;
    const db = conn || await pool.getConnection();
    
    try {
      if (!isExternalConn) await db.beginTransaction();
      
      const [members] = await db.query('SELECT * FROM members WHERE id = ? FOR UPDATE', [memberId]);
      if (members.length === 0) return null;
      
      const member = members[0];
      const newTier = this.getTier(member.manh_sang_total);
      
      if (newTier !== member.card_tier) {
        // Có sự thay đổi hạng
        await db.query(
          'UPDATE members SET card_tier = ? WHERE id = ?',
          [newTier, memberId]
        );
        
        await db.query(
          'INSERT INTO tier_upgrade_log (member_id, from_tier, to_tier, manh_sang_at_change, reason) VALUES (?, ?, ?, ?, ?)',
          [memberId, member.card_tier, newTier, member.manh_sang_total, 'auto_upgrade']
        );
        
        if (!isExternalConn) await db.commit();
        
        // TODO: Gửi email/notification chúc mừng thăng hạng
        return { upgraded: true, from: member.card_tier, to: newTier };
      }
      
      if (!isExternalConn) await db.commit();
      return { upgraded: false };
    } catch (error) {
      if (!isExternalConn) await db.rollback();
      throw error;
    } finally {
      if (!isExternalConn) db.release();
    }
  }

  /**
   * Trigger các quy tắc cộng điểm cho một booking hoàn thành
   */
  static async processCompletedBooking(bookingId) {
    const [bookings] = await pool.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (bookings.length === 0) return;
    const booking = bookings[0];
    
    if (!booking.user_id) return;
    
    const member = await this.ensureMember(booking.user_id);
    if (!member || !member.is_card_active) return;

    // Check if it's 1st booking
    if (!member.is_first_booking_done) {
      await this.addManhSang(member.id, 50, 'first_booking', `Đặt lịch lần đầu tiên #${booking.booking_code}`, bookingId, 'booking');
      await pool.query('UPDATE members SET is_first_booking_done = 1 WHERE id = ?', [member.id]);
    } else if (!member.second_booking_rewarded) {
      // Check if this is the second confirmed booking
      // (assuming this function is only called when a booking becomes confirmed)
      const [confirmedBookings] = await pool.query('SELECT id FROM bookings WHERE user_id = ? AND status = "confirmed" AND id != ?', [booking.user_id, bookingId]);
      if (confirmedBookings.length >= 1) {
        await this.addManhSang(member.id, 80, 'second_visit', `Trở lại đặt lịch lần 2 #${booking.booking_code}`, bookingId, 'booking');
        await pool.query('UPDATE members SET second_booking_rewarded = 1 WHERE id = ?', [member.id]);
      }
    }
    
    await this.checkAndUpgradeTier(member.id);
  }
}

module.exports = LoyaltyService;
