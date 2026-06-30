require('dotenv').config();
const mysql = require('mysql2/promise');

async function addUserIdToBookings() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_NAME || 'dear_muse',
      charset: 'utf8mb4',
    });

    console.log('⏳ Thêm cột user_id vào bảng bookings...');
    try { 
      await conn.query(`ALTER TABLE bookings ADD COLUMN user_id INT AFTER booking_code`); 
      await conn.query(`ALTER TABLE bookings ADD CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL`);
      console.log('✅ Đã thêm cột user_id thành công!');
    } catch(e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ Cột user_id đã tồn tại.');
      } else {
        throw e;
      }
    }

    await conn.end();
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  }
}

addUserIdToBookings();
