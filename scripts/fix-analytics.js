require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixAnalytics() {
  console.log('🔧 Đang thêm cột duration_seconds vào bảng analytics_events...');
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_NAME || 'dear_muse',
      charset: 'utf8mb4',
    });

    await conn.query(`ALTER TABLE analytics_events ADD COLUMN duration_seconds INT DEFAULT 0`);
    console.log('✅ Đã thêm cột duration_seconds thành công!');
    await conn.end();
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ Cột duration_seconds đã tồn tại, không cần thêm.');
    } else {
      console.error('❌ Lỗi:', e.message);
    }
  }
}

fixAnalytics();
