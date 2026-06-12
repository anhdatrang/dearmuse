require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function setup() {
  console.log('🔧 Bắt đầu setup database Dear Musé...\n');

  // Connect without database first to create it
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    charset: 'utf8mb4',
  });

  console.log('✅ Kết nối MySQL thành công');

  // Create DB
  await conn.query(`CREATE DATABASE IF NOT EXISTS dear_muse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  console.log('✅ Database dear_muse đã sẵn sàng');

  // Switch to DB
  await conn.changeUser({ database: 'dear_muse' });

  // Create tables
  await conn.query(`
    CREATE TABLE IF NOT EXISTS services (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      short_desc VARCHAR(500),
      price_from INT,
      duration_minutes INT,
      cover_image VARCHAR(500),
      is_featured TINYINT(1) DEFAULT 0,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS portfolio (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255),
      slug VARCHAR(255) UNIQUE,
      category ENUM('portrait','event','commercial','outdoor','studio') NOT NULL,
      description TEXT,
      cover_image VARCHAR(500) NOT NULL,
      images JSON,
      shoot_date DATE,
      is_featured TINYINT(1) DEFAULT 0,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      booking_code VARCHAR(20) UNIQUE,
      customer_name VARCHAR(255) NOT NULL,
      customer_phone VARCHAR(20) NOT NULL,
      customer_email VARCHAR(255),
      service_id INT,
      preferred_date DATE NOT NULL,
      preferred_time TIME,
      backup_date DATE,
      location_type ENUM('studio','outdoor','both') DEFAULT 'studio',
      location_note TEXT,
      message TEXT,
      status ENUM('pending','confirmed','completed','cancelled') DEFAULT 'pending',
      admin_note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      email VARCHAR(255),
      subject VARCHAR(500),
      message TEXT NOT NULL,
      is_read TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      event_type VARCHAR(50) NOT NULL,
      event_value VARCHAR(255),
      ip_address VARCHAR(45),
      location VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Các bảng đã được tạo');

  // Seed services
  const [existingServices] = await conn.query(`SELECT COUNT(*) as count FROM services`);
  if (existingServices[0].count === 0) {
    await conn.query(`
      INSERT INTO services (name, slug, description, short_desc, price_from, duration_minutes, is_featured, sort_order) VALUES
      ('Portrait Cá Nhân', 'portrait-ca-nhan', 'Chụp chân dung nghệ thuật — nắm bắt cá tính và cảm xúc của bạn trong từng khung hình. Mỗi bộ ảnh là một câu chuyện riêng, được kể bằng ánh sáng và cảm xúc thật.', 'Lưu giữ khoảnh khắc của chính bạn', 1500000, 90, 1, 1),
      ('Sinh Nhật & Tốt Nghiệp', 'sinh-nhat-tot-nghiep', 'Những cột mốc quan trọng xứng đáng được ghi lại theo cách đẹp nhất. Từ buổi chụp sinh nhật lãng mạn đến bộ ảnh tốt nghiệp đáng tự hào.', 'Cột mốc cuộc đời đáng nhớ', 1800000, 120, 1, 2),
      ('Sự Kiện', 'su-kien', 'Ghi lại không khí và cảm xúc của những buổi sự kiện đặc biệt. Dạ hội, tiệc tốt nghiệp, workshop hay bất kỳ khoảnh khắc tập thể nào xứng đáng được lưu giữ.', 'Khoảnh khắc tập thể, cảm xúc riêng tư', 3000000, 180, 0, 3),
      ('Thương Hiệu & Sản Phẩm', 'thuong-hieu-san-pham', 'Ảnh thương mại chuyên nghiệp — nâng tầm hình ảnh thương hiệu của bạn. Từ ảnh sản phẩm đến lookbook thương hiệu, chúng tôi tạo nên hình ảnh kể được câu chuyện.', 'Hình ảnh bán hàng, hình ảnh thương hiệu', 2500000, 120, 1, 4)
    `);
    console.log('✅ Seed services xong');
  } else {
    console.log('ℹ️  Services đã có dữ liệu, bỏ qua seed');
  }

  // Seed admin account
  const [existingAdmins] = await conn.query(`SELECT COUNT(*) as count FROM admins`);
  if (existingAdmins[0].count === 0) {
    const hash = await bcrypt.hash('dearmuse2025', 10);
    await conn.query(`INSERT INTO admins (username, password_hash) VALUES (?, ?)`, ['admin', hash]);
    console.log('✅ Admin account tạo xong: admin / dearmuse2025');
  } else {
    console.log('ℹ️  Admin đã tồn tại, bỏ qua');
  }

  await conn.end();
  console.log('\n🎉 Setup hoàn tất! Chạy: npm start\n');
  console.log('📋 Admin panel: http://localhost:3000/admin/login');
  console.log('   Username: admin');
  console.log('   Password: dearmuse2025\n');
}

setup().catch(err => {
  console.error('❌ Lỗi setup:', err.message);
  console.error('\n💡 Kiểm tra lại DB_PASSWORD trong file .env');
  process.exit(1);
});
