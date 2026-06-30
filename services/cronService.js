const db = require('../config/db');
const emailService = require('./emailService');
const discordService = require('./discordService');

async function getSettings() {
  const [rows] = await db.query('SELECT setting_key, setting_value FROM settings');
  const settings = {};
  rows.forEach(r => settings[r.setting_key] = r.setting_value);
  return settings;
}

async function checkPaymentAPI(bookingCode, depositAmount, settings) {
  const apiUrl = settings.api_url;
  const password = settings.api_password;
  const token = settings.api_token;
  const stk = settings.bank_account_no;

  if (!apiUrl || !password || !token || !stk) return false;

  let finalUrl = apiUrl;
  if (finalUrl.includes('{PASSWORD}')) {
    finalUrl = finalUrl.replace('{PASSWORD}', password).replace('{STK}', stk).replace('{TOKEN}', token);
  } else {
    if (!finalUrl.endsWith('/')) finalUrl += '/';
    finalUrl += `${password}/${stk}/${token}`;
  }

  try {
    const response = await fetch(finalUrl);
    const data = await response.json();

    if (data.status === 'success' && data.transactions) {
      const cleanBookingCode = bookingCode.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const match = data.transactions.find(t => {
        if (t.type !== 'IN' || t.amount < depositAmount) return false;
        const cleanDescription = (t.description || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        return cleanDescription.includes(cleanBookingCode);
      });
      return !!match;
    }
  } catch (err) {
    console.error('Background API Check Error:', err.message);
  }
  return false;
}

exports.initCronJobs = () => {
  // Chạy mỗi 1 phút
  setInterval(async () => {
    try {
      const settings = await getSettings();

      // Lấy danh sách các đơn đang chờ thanh toán
      const [pendingBookings] = await db.query(`
        SELECT * FROM bookings 
        WHERE status = 'awaiting_payment'
      `);

      for (const booking of pendingBookings) {
        const isExpired = new Date() > new Date(booking.payment_expires_at);

        // 1. Kiểm tra API xem khách đã chuyển khoản chưa
        const hasPaid = await checkPaymentAPI(booking.booking_code, booking.deposit_amount, settings);

        if (hasPaid) {
          // Khách ĐÃ thanh toán
          await db.query(`UPDATE bookings SET status = 'pending', admin_note = 'Tự động duyệt từ Cron Job' WHERE id = ?`, [booking.id]);
          
          let service = null;
          if (booking.service_id) {
             const [rows] = await db.query('SELECT name FROM services WHERE id = ?', [booking.service_id]);
             if (rows.length > 0) service = rows[0];
          }

          booking.serviceName = service ? service.name : 'Dịch vụ chụp ảnh';
          emailService.sendBookingConfirmation(booking).catch(e => console.error(e));
          discordService.notifyBooking(booking, booking.serviceName).catch(e => console.error(e));
        } else if (isExpired) {
          // Hết hạn và chưa thanh toán -> Huỷ
          await db.query(`UPDATE bookings SET status = 'cancelled', admin_note = 'Hệ thống tự động huỷ do không thanh toán cọc sau 10 phút' WHERE id = ?`, [booking.id]);
        }
      }
    } catch (err) {
      console.error('Cron job error:', err.message);
    }
  }, 30 * 1000);
};
