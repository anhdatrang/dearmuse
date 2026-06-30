const db = require('../config/db');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const emailService = require('../services/emailService');
const discordService = require('../services/discordService');
const VoucherService = require('../services/voucherService');

// Lấy danh sách cài đặt từ DB
async function getSettings() {
  const [rows] = await db.query('SELECT setting_key, setting_value FROM settings');
  const settings = {};
  rows.forEach(r => settings[r.setting_key] = r.setting_value);
  return settings;
}

exports.showPaymentPage = async (req, res) => {
  try {
    const bookingCode = req.params.code;
    const booking = await Booking.findByCode(bookingCode);
    
    if (!booking) {
      return res.status(404).render('404');
    }

    // Nếu không ở trạng thái chờ thanh toán
    if (booking.status !== 'awaiting_payment') {
      return res.redirect(`/booking/${bookingCode}/status`);
    }

    // Kiểm tra hết hạn (10 phút)
    if (new Date() > new Date(booking.payment_expires_at)) {
      await Booking.updateStatus(booking.id, 'cancelled', 'Đã huỷ do quá hạn thanh toán 10 phút');
      booking.status = 'cancelled';
      return res.redirect(`/booking/${bookingCode}/status`);
    }

    const settings = await getSettings();

    // Mã VietQR
    const bankName = settings.bank_name || 'ACB';
    const accNo = settings.bank_account_no || '';
    const accName = settings.bank_account_name || '';
    const amount = booking.deposit_amount;
    const addInfo = bookingCode; // Nội dung chuyển khoản
    
    const qrUrl = `https://img.vietqr.io/image/${bankName}-${accNo}-compact2.png?amount=${amount}&addInfo=${addInfo}&accountName=${encodeURIComponent(accName)}`;

    res.render('payment', {
      title: 'Thanh Toán Đặt Lịch — Dear Musé',
      booking,
      qrUrl,
      settings
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
};

exports.showStatusPage = async (req, res) => {
  try {
    const bookingCode = req.params.code;
    const booking = await Booking.findByCode(bookingCode);
    
    if (!booking) return res.status(404).render('404');
    
    if (booking.status === 'awaiting_payment') {
      return res.redirect(`/booking/${bookingCode}/pay`);
    }

    res.render('booking-confirm', {
      title: 'Trạng thái đặt lịch — Dear Musé',
      metaDescription: 'Chi tiết đặt lịch chụp ảnh.',
      booking,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
};

exports.checkPaymentAPI = async (req, res) => {
  try {
    const bookingCode = req.params.code;
    const booking = await Booking.findByCode(bookingCode);
    
    if (!booking || booking.status !== 'awaiting_payment') {
      return res.json({ success: false, message: 'Đơn không hợp lệ' });
    }

    const settings = await getSettings();
    const apiUrl = settings.api_url;
    const password = settings.api_password;
    const token = settings.api_token;
    const stk = settings.bank_account_no;

    if (!apiUrl || !password || !token || !stk) {
      return res.json({ success: false, message: 'Chưa cấu hình API thanh toán' });
    }

    // Xử lý URL API (Thay thế {PASSWORD} nếu admin nhập vậy, hoặc nối chuỗi)
    let finalUrl = apiUrl;
    if (finalUrl.includes('{PASSWORD}')) {
      finalUrl = finalUrl.replace('{PASSWORD}', password).replace('{STK}', stk).replace('{TOKEN}', token);
    } else {
      // Mặc định nối chuỗi
      if (!finalUrl.endsWith('/')) finalUrl += '/';
      finalUrl += `${password}/${stk}/${token}`;
    }

    const response = await fetch(finalUrl);
    const data = await response.json();

    if (data.status === 'success' && data.transactions) {
      const cleanBookingCode = bookingCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const match = data.transactions.find(t => {
        if (t.type !== 'IN' || t.amount < booking.deposit_amount) return false;
        const cleanDescription = (t.description || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        return cleanDescription.includes(cleanBookingCode);
      });

      if (match) {
        // Đã thanh toán thành công
        await Booking.updateStatus(booking.id, 'pending', 'Thanh toán thành công qua API');
        
        // Bây giờ mới gửi thông báo email và discord
        let service = null;
        if (booking.service_id) {
           const [rows] = await db.query('SELECT name FROM services WHERE id = ?', [booking.service_id]);
           if (rows.length > 0) service = rows[0];
        }

        try {
          booking.serviceName = service ? service.name : 'Dịch vụ chụp ảnh';
          await emailService.sendBookingConfirmation(booking);
        } catch (e) { console.error(e); }
        
        try {
          await discordService.notifyBooking(booking, service ? service.name : 'Dịch vụ chụp ảnh');
        } catch (e) { console.error(e); }

        // VOUCHER: Mark voucher as used nếu booking có applied_voucher_id
        if (booking.applied_voucher_id) {
          try {
            await VoucherService.markVoucherAsUsed(booking.applied_voucher_id, booking.id);
          } catch (e) { console.error('Voucher mark used error:', e); }
        }

        // LOYALTY: Tự động cộng điểm full khi cọc thành công
        if (booking.user_id) {
          const LoyaltyService = require('../services/loyaltyService');
          try {
            const member = await LoyaltyService.ensureMember(booking.user_id);
            if (member && member.is_card_active && service && service.price_from) {
              const points = Math.floor(service.price_from / 10000);
              await LoyaltyService.addManhSang(member.id, points, 'spend', `Thanh toán đặt lịch ${bookingCode}`);
              await db.query('UPDATE bookings SET manh_sang_earned = ? WHERE id = ?', [points, booking.id]);
              await LoyaltyService.checkAndUpgradeTier(member.id);
            }
          } catch (e) { console.error('Loyalty add points error:', e); }
        }

        return res.json({ success: true, message: 'Thanh toán thành công' });
      }
    }

    res.json({ success: false, message: 'Chưa tìm thấy giao dịch. Vui lòng thử lại sau ít phút.' });
  } catch (err) {
    console.error('API Check Error:', err);
    res.json({ success: false, message: 'Lỗi hệ thống khi kiểm tra giao dịch.' });
  }
};

/**
 * API: Áp dụng mã voucher (không cần đăng nhập)
 * POST /api/voucher/apply
 * Body: { code, booking_code, total_amount }
 */
exports.applyVoucherAPI = async (req, res) => {
  try {
    const { code, booking_code, total_amount } = req.body;

    if (!code || !booking_code) {
      return res.status(400).json({ success: false, message: 'Thiếu mã voucher hoặc mã đặt lịch.' });
    }

    const voucherCode = code.trim().toUpperCase();

    // Tìm voucher trong member_vouchers (loyalty voucher)
    const [mvRows] = await db.query(
      `SELECT mv.*, v.discount_type, v.discount_value, v.max_discount_amount, v.min_order_value, v.name as voucher_name
       FROM member_vouchers mv
       JOIN vouchers v ON mv.voucher_id = v.id
       WHERE mv.code = ?`,
      [voucherCode]
    );

    let discountInfo = null;

    if (mvRows.length > 0) {
      // Là Loyalty Voucher (member_vouchers)
      const mv = mvRows[0];

      if (mv.status !== 'active') {
        return res.status(400).json({ success: false, message: 'Voucher này đã được sử dụng hoặc đã bị huỷ.' });
      }
      if (new Date() > new Date(mv.expires_at)) {
        return res.status(400).json({ success: false, message: 'Voucher đã hết hạn.' });
      }

      const amount = parseFloat(total_amount) || 0;
      let discount = 0;
      if (mv.discount_type === 'fixed') {
        discount = parseFloat(mv.discount_value);
      } else if (mv.discount_type === 'percent') {
        discount = (amount * parseFloat(mv.discount_value)) / 100;
        if (mv.max_discount_amount && discount > parseFloat(mv.max_discount_amount)) {
          discount = parseFloat(mv.max_discount_amount);
        }
      }
      if (discount > amount) discount = amount;

      discountInfo = {
        memberVoucherId: mv.id,
        voucherName: mv.voucher_name,
        discountType: mv.discount_type,
        discountValue: mv.discount_value,
        discountAmount: discount,
        finalAmount: amount - discount
      };
    } else {
      return res.status(404).json({ success: false, message: 'Mã voucher không hợp lệ hoặc không tồn tại.' });
    }

    // Lưu voucher vào booking
    const [bookingRows] = await db.query(
      'SELECT id, deposit_amount FROM bookings WHERE booking_code = ?',
      [booking_code]
    );
    if (bookingRows.length > 0) {
      const bk = bookingRows[0];
      await db.query(
        `UPDATE bookings SET 
           applied_voucher_code = ?,
           applied_voucher_id = ?,
           discount_amount = ?,
           final_amount = ?
         WHERE booking_code = ?`,
        [
          voucherCode,
          discountInfo.memberVoucherId,
          discountInfo.discountAmount,
          Math.max(0, parseFloat(bk.deposit_amount) - discountInfo.discountAmount),
          booking_code
        ]
      );
    }

    res.json({
      success: true,
      message: `Áp dụng voucher thành công!`,
      data: discountInfo
    });
  } catch (err) {
    console.error('Apply Voucher Error:', err);
    res.status(500).json({ success: false, message: 'Lỗi hệ thống khi áp dụng voucher.' });
  }
};
