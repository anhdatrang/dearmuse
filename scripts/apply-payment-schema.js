require('dotenv').config();
const mysql = require('mysql2/promise');

async function applyPaymentSchema() {
  console.log('🔧 Đang cập nhật Database cho Payment Flow...');
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'admin',
      database: process.env.DB_NAME || 'dear_muse',
      charset: 'utf8mb4',
    });

    // Cập nhật Enum status của bookings
    console.log('⏳ Cập nhật ENUM status của bảng bookings...');
    await conn.query(`ALTER TABLE bookings MODIFY COLUMN status ENUM('pending','awaiting_payment','confirmed','completed','cancelled') DEFAULT 'pending'`);
    
    // Thêm các cột cho booking
    console.log('⏳ Thêm cột deposit_amount và payment_expires_at...');
    try { await conn.query(`ALTER TABLE bookings ADD COLUMN deposit_amount INT DEFAULT 0`); } catch(e) {}
    try { await conn.query(`ALTER TABLE bookings ADD COLUMN payment_expires_at DATETIME`); } catch(e) {}
    
    // Tạo bảng settings
    console.log('⏳ Tạo bảng settings...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        description VARCHAR(255),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Seed settings
    console.log('⏳ Thêm dữ liệu cấu hình mặc định...');
    await conn.query(`
      INSERT IGNORE INTO settings (setting_key, setting_value, description) VALUES
      ('bank_name', 'ACB', 'Tên ngân hàng nhận thanh toán'),
      ('bank_account_no', '6333333633', 'Số tài khoản'),
      ('bank_account_name', 'NGUYEN VAN HOI', 'Tên chủ tài khoản'),
      ('api_url', 'https://api.sieuthicode.net/historyapiacbv3', 'URL API kiểm tra giao dịch'),
      ('api_password', '', 'Mật khẩu API SieuthiCode'),
      ('api_token', '', 'Token API SieuthiCode')
    `);

    console.log('✅ Hoàn tất cập nhật Database!');
    await conn.end();
  } catch (e) {
    console.error('❌ Lỗi:', e.message);
  }
}

applyPaymentSchema();
