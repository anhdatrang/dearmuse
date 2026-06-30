const db = require('../config/db');

class Booking {
  static async create(data) {
    const bookingCode = `DM-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const depositAmount = data.deposit_amount || 0;
    
    const [result] = await db.execute(
      `INSERT INTO bookings (booking_code, user_id, customer_name, customer_phone, customer_email, service_id, preferred_date, preferred_time, backup_date, location_type, location_note, message, deposit_amount, status, payment_expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'awaiting_payment', DATE_ADD(NOW(), INTERVAL 10 MINUTE))`,
      [bookingCode, data.user_id || null, data.customer_name, data.customer_phone, data.customer_email || null,
       data.service_id || null, data.preferred_date, data.preferred_time || null,
       data.backup_date || null, data.location_type || 'studio',
       data.location_note || null, data.message || null, depositAmount]
    );
    return { id: result.insertId, booking_code: bookingCode };
  }

  static async findAll({ status, limit, offset } = {}) {
    let query = `SELECT b.*, s.name as service_name FROM bookings b LEFT JOIN services s ON b.service_id = s.id`;
    const params = [];
    if (status) { query += ` WHERE b.status = ?`; params.push(status); }
    query += ` ORDER BY b.created_at DESC`;
    if (limit) { query += ` LIMIT ? OFFSET ?`; params.push(limit, offset || 0); }
    const [rows] = await db.execute(query, params);
    return rows;
  }

  static async findById(id) {
    const [rows] = await db.execute(
      `SELECT b.*, s.name as service_name FROM bookings b LEFT JOIN services s ON b.service_id = s.id WHERE b.id = ?`, [id]
    );
    return rows[0];
  }

  static async findByCode(code) {
    const [rows] = await db.execute(
      `SELECT b.*, s.name as service_name FROM bookings b LEFT JOIN services s ON b.service_id = s.id WHERE b.booking_code = ?`, [code]
    );
    return rows[0];
  }

  static async findByUserId(userId) {
    const [rows] = await db.execute(
      `SELECT b.*, s.name as service_name FROM bookings b LEFT JOIN services s ON b.service_id = s.id WHERE b.user_id = ? ORDER BY b.created_at DESC`, [userId]
    );
    return rows;
  }

  static async updateStatus(id, status, adminNote) {
    await db.execute(`UPDATE bookings SET status = ?, admin_note = ? WHERE id = ?`, [status, adminNote, id]);
  }

  static async countByStatus() {
    const [rows] = await db.execute(
      `SELECT status, COUNT(*) as count FROM bookings GROUP BY status`
    );
    return rows;
  }

  static async getRecent(days = 7) {
    const [rows] = await db.execute(
      `SELECT b.*, s.name as service_name FROM bookings b LEFT JOIN services s ON b.service_id = s.id
       WHERE b.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) ORDER BY b.created_at DESC`,
      [days]
    );
    return rows;
  }
}

module.exports = Booking;
