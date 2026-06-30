const pool = require('../config/db');
const LoyaltyService = require('./loyaltyService');
const VoucherService = require('./voucherService');

class ReferralService {
  /**
   * Áp dụng mã giới thiệu (thường gọi lúc đăng ký)
   */
  static async applyReferralCode(refereeUserId, referralCode) {
    const conn = await pool.getConnection();
    
    try {
      await conn.beginTransaction();
      
      const referee = await LoyaltyService.ensureMember(refereeUserId, conn);
      
      const [referrers] = await conn.query('SELECT * FROM members WHERE referral_code = ?', [referralCode]);
      if (referrers.length === 0) {
        throw new Error('REFERRAL_CODE_INVALID');
      }
      const referrer = referrers[0];
      
      if (referrer.id === referee.id) {
        throw new Error('CANNOT_REFER_SELF');
      }
      
      // Kiểm tra đã có người giới thiệu chưa
      if (referee.referred_by) {
        throw new Error('ALREADY_REFERRED');
      }
      
      // Cập nhật người giới thiệu
      await conn.query('UPDATE members SET referred_by = ? WHERE id = ?', [referrer.id, referee.id]);
      
      // Tạo record referral pending
      await conn.query(
        'INSERT INTO referrals (referrer_id, referee_id, status) VALUES (?, ?, "pending")',
        [referrer.id, referee.id]
      );
      
      // Tặng cho người được giới thiệu voucher 10% (first time)
      await VoucherService.issueVoucher(referee.id, {
        code_prefix: 'WELCOME',
        name: 'Voucher Khách Mới (Được giới thiệu)',
        voucher_type: 'referral',
        discount_type: 'percent',
        discount_value: 10,
        issued_reason: 'Được giới thiệu bởi bạn bè',
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 ngày
      }, conn);
      
      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Hoàn thành luồng Referral (Gọi khi referee hoàn thành booking đầu tiên)
   */
  static async completeReferral(refereeMemberId, conn = null) {
    const isExternalConn = !!conn;
    const db = conn || await pool.getConnection();
    
    try {
      if (!isExternalConn) await db.beginTransaction();
      
      const [refs] = await db.query(
        'SELECT * FROM referrals WHERE referee_id = ? AND status = "pending"', 
        [refereeMemberId]
      );
      
      if (refs.length === 0) return false;
      const referral = refs[0];
      
      // Mark as completed
      await db.query(
        'UPDATE referrals SET status = "completed", completed_at = NOW(), referrer_rewarded = 1 WHERE id = ?',
        [referral.id]
      );
      
      // Tặng 100 Mảnh Sáng cho người giới thiệu
      await LoyaltyService.addManhSang(
        referral.referrer_id,
        100,
        'referral_reward',
        'Thưởng giới thiệu bạn bè thành công',
        referral.id,
        'referral',
        db
      );
      
      // Tăng số người đã giới thiệu (referral_count)
      await db.query(
        'UPDATE members SET referral_count = referral_count + 1 WHERE id = ?',
        [referral.referrer_id]
      );
      
      // Check Milestone
      await this.checkReferralMilestone(referral.referrer_id, db);
      
      if (!isExternalConn) await db.commit();
      return true;
    } catch (error) {
      if (!isExternalConn) await db.rollback();
      throw error;
    } finally {
      if (!isExternalConn) db.release();
    }
  }

  /**
   * Kiểm tra và tặng thưởng nếu đạt mốc giới thiệu (3 người, 7 người)
   */
  static async checkReferralMilestone(referrerId, conn) {
    const [members] = await conn.query('SELECT referral_count, card_tier FROM members WHERE id = ?', [referrerId]);
    if (members.length === 0) return;
    const member = members[0];
    const count = member.referral_count;
    
    if (count === 3) {
      // Tặng voucher nâng cấp concept
      await VoucherService.issueVoucher(referrerId, {
        code_prefix: 'MILESTONE',
        name: 'Voucher Nâng Cấp Concept (Mốc 3 người)',
        voucher_type: 'milestone',
        discount_type: 'fixed',
        discount_value: 0, // Special logic
        issued_reason: 'Đạt mốc 3 lượt giới thiệu'
      }, conn);
    }
    
    if (count === 7) {
      // Tự động thăng hạng (nhảy 1 bậc)
      const TIER_ORDER = ['pearl', 'rose', 'gold', 'privilege'];
      const currentIdx = TIER_ORDER.indexOf(member.card_tier);
      if (currentIdx < TIER_ORDER.length - 1) {
        const newTier = TIER_ORDER[currentIdx + 1];
        
        await conn.query(
          'UPDATE members SET card_tier = ? WHERE id = ?',
          [newTier, referrerId]
        );
        
        await conn.query(
          'INSERT INTO tier_upgrade_log (member_id, from_tier, to_tier, manh_sang_at_change, reason) VALUES (?, ?, ?, 0, ?)',
          [referrerId, member.card_tier, newTier, 'referral_milestone']
        );
      }
    }
  }
}

module.exports = ReferralService;
