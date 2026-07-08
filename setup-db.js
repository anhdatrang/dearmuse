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
    password: process.env.DB_PASSWORD || 'admin',
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
      features JSON,
      is_featured TINYINT(1) DEFAULT 0,
      sort_order INT DEFAULT 0,
      category VARCHAR(50) NOT NULL DEFAULT 'ca-nhan',
      category_label VARCHAR(100) NOT NULL DEFAULT 'Cá Nhân',
      subtitle VARCHAR(255),
      gallery JSON,
      pricing JSON,
      addons JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`DROP TABLE IF EXISTS portfolio`);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS portfolio (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255),
      slug VARCHAR(255) UNIQUE,
      category ENUM('ca-nhan','doanh-nghiep','mo-rong') NOT NULL,
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
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_type ENUM('individual', 'business') DEFAULT 'individual',
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      company_name VARCHAR(255),
      is_verified TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS announcements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS user_notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      is_read TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      booking_code VARCHAR(20) UNIQUE,
      user_id INT,
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
      status ENUM('pending','awaiting_payment','confirmed','completed','cancelled') DEFAULT 'awaiting_payment',
      deposit_amount INT DEFAULT 0,
      payment_expires_at DATETIME,
      admin_note TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
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
      admin_note TEXT,
      assigned_to VARCHAR(255),
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

  await conn.query(`DROP TABLE IF EXISTS blog_posts`);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      category ENUM('news', 'customer_photos') NOT NULL DEFAULT 'news',
      subtitle VARCHAR(255),
      client_name VARCHAR(255),
      location VARCHAR(255),
      photographer VARCHAR(255),
      concept VARCHAR(255),
      quote TEXT,
      summary VARCHAR(500),
      content TEXT,
      content_outro TEXT,
      content_blocks JSON,
      cover_image VARCHAR(500) NOT NULL,
      images JSON,
      is_featured TINYINT(1) DEFAULT 0,
      status ENUM('draft', 'published') DEFAULT 'published',
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
      duration_seconds INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      setting_key VARCHAR(100) UNIQUE NOT NULL,
      setting_value TEXT,
      description VARCHAR(255),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);



  // Thêm cột is_verified nếu bảng đã tồn tại từ trước
  try {
    await conn.query(`ALTER TABLE users ADD COLUMN is_verified TINYINT(1) DEFAULT 0`);
    console.log('✅ Đã thêm cột is_verified vào bảng users');
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') {
      console.warn('⚠️ Cảnh báo thêm cột is_verified:', e.message);
    }
  }

  // Thêm cột cho doanh nghiệp nếu bảng đã tồn tại từ trước
  try {
    await conn.query(`ALTER TABLE users ADD COLUMN user_type ENUM('individual', 'business') DEFAULT 'individual'`);
    await conn.query(`ALTER TABLE users ADD COLUMN company_name VARCHAR(255)`);
    console.log('✅ Đã thêm cột doanh nghiệp vào bảng users');
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') {
      console.warn('⚠️ Cảnh báo thêm cột doanh nghiệp:', e.message);
    }
  }

  try {
    await conn.query(`ALTER TABLE blog_posts ADD COLUMN content_blocks JSON NULL AFTER content`);
    console.log('✅ Đã thêm cột content_blocks vào bảng blog_posts');
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') {
      console.warn('⚠️ Cảnh báo thêm cột content_blocks:', e.message);
    }
  }

  // Thêm cột duration_seconds cho bảng analytics_events
  try {
    await conn.query(`ALTER TABLE analytics_events ADD COLUMN duration_seconds INT DEFAULT 0`);
    console.log('✅ Đã thêm cột duration_seconds vào bảng analytics_events');
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') {
      console.warn('⚠️ Cảnh báo thêm cột duration_seconds:', e.message);
    }
  }

  // Thêm cột features cho bảng services nếu bảng đã tồn tại từ trước
  try {
    await conn.query(`ALTER TABLE services ADD COLUMN features JSON`);

    // Seed default features cho các service hiện có nếu features là null
    const defaultFeatures = JSON.stringify([
      "Tư vấn concept & trang phục",
      "10 ảnh chỉnh sửa chuyên sâu (retouch)",
      "Toàn bộ file gốc sau buổi chụp"
    ]);
    await conn.query(`UPDATE services SET features = ? WHERE features IS NULL`, [defaultFeatures]);

    console.log('✅ Đã thêm cột features vào bảng services');
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') {
      console.warn('⚠️ Cảnh báo thêm cột features:', e.message);
    }
  }

  await conn.query(`
    CREATE TABLE IF NOT EXISTS customer_albums (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      cover_image VARCHAR(500),
      status ENUM('booked', 'shooting', 'editing', 'completed') DEFAULT 'booked',
      edit_status ENUM('not_submitted', 'submitted', 'completed') DEFAULT 'not_submitted',
      shoot_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS album_images (
      id INT AUTO_INCREMENT PRIMARY KEY,
      album_id INT NOT NULL,
      original_url VARCHAR(500) NOT NULL,
      thumbnail_url VARCHAR(500) NOT NULL,
      file_name VARCHAR(255),
      file_size INT,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (album_id) REFERENCES customer_albums(id) ON DELETE CASCADE
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS face_descriptors (
      id INT AUTO_INCREMENT PRIMARY KEY,
      image_id INT NOT NULL,
      descriptor JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (image_id) REFERENCES album_images(id) ON DELETE CASCADE
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS photo_edit_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      album_id INT NOT NULL,
      image_id INT NOT NULL,
      customer_note TEXT,
      edited_url VARCHAR(500) DEFAULT NULL,
      edited_thumbnail_url VARCHAR(500) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (album_id) REFERENCES customer_albums(id) ON DELETE CASCADE,
      FOREIGN KEY (image_id) REFERENCES album_images(id) ON DELETE CASCADE
    )
  `);

  // Migration for existing database:
  try {
    await conn.query(`ALTER TABLE customer_albums ADD COLUMN edit_status ENUM('not_submitted', 'submitted', 'completed') DEFAULT 'not_submitted'`);
    console.log('✅ Đã thêm cột edit_status vào bảng customer_albums');
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') {
      console.warn('⚠️ Cảnh báo thêm cột edit_status:', e.message);
    }
  }

  await conn.query(`
    CREATE TABLE IF NOT EXISTS otps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      otp VARCHAR(6) NOT NULL,
      purpose ENUM('register', 'reset_password') NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS email_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      subject VARCHAR(255) NOT NULL,
      recipient VARCHAR(255) NOT NULL,
      content TEXT,
      status VARCHAR(50) DEFAULT 'sent',
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('✅ Các bảng cơ bản đã được tạo');

  // LOYALTY SYSTEM TABLES
  await conn.query(`
    CREATE TABLE IF NOT EXISTS members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL UNIQUE,
      full_name VARCHAR(255),
      dob DATE,
      id_card VARCHAR(50),
      is_card_active TINYINT(1) DEFAULT 0,
      manh_sang_total INT NOT NULL DEFAULT 0,
      manh_sang_balance INT NOT NULL DEFAULT 0,
      card_tier ENUM('pearl', 'rose', 'gold', 'privilege', 'frame', 'lumiere') NOT NULL DEFAULT 'pearl',
      is_first_booking_done TINYINT(1) NOT NULL DEFAULT 0,
      is_first_register_done TINYINT(1) NOT NULL DEFAULT 0,
      second_booking_rewarded TINYINT(1) NOT NULL DEFAULT 0,
      referral_code VARCHAR(12) UNIQUE NOT NULL,
      referred_by INT,
      referral_count INT NOT NULL DEFAULT 0,
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (referred_by) REFERENCES members(id) ON DELETE SET NULL
    )
  `);

  try {
    await conn.query(`
      ALTER TABLE members 
      ADD COLUMN full_name VARCHAR(255),
      ADD COLUMN dob DATE,
      ADD COLUMN id_card VARCHAR(50),
      ADD COLUMN is_card_active TINYINT(1) DEFAULT 0
    `);
    console.log('✅ Đã thêm các cột profile vào bảng members');
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') {
      console.warn('⚠️ Cảnh báo thêm cột profile vào members:', e.message);
    }
  }

  await conn.query(`
    CREATE TABLE IF NOT EXISTS manh_sang_transactions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      member_id INT NOT NULL,
      amount INT NOT NULL,
      balance_after INT NOT NULL,
      type ENUM('spend', 'register_bonus', 'first_booking', 'early_deposit', 'second_visit', 'referral_reward', 'feedback_photo', 'social_share', 'birthday_booking', 'group_booking', 'voucher_redeem', 'admin_adjust', 'referral_milestone', 'early_brief', 'case_study', 'multi_project', 'renewal') NOT NULL,
      description TEXT,
      reference_id INT,
      reference_type VARCHAR(30),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS vouchers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code_prefix VARCHAR(20) NOT NULL,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      voucher_type ENUM('redeem', 'birthday', 'seasonal', 'referral', 'milestone', 'manual') NOT NULL,
      discount_type ENUM('fixed', 'percent') NOT NULL,
      discount_value DECIMAL(10,2) NOT NULL,
      max_discount_amount DECIMAL(10,2),
      min_order_value DECIMAL(10,2) DEFAULT 0,
      manh_sang_cost INT,
      required_tier ENUM('pearl', 'rose', 'gold', 'privilege', 'frame', 'lumiere'),
      valid_days INT DEFAULT 90,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS member_vouchers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      member_id INT NOT NULL,
      voucher_id INT NOT NULL,
      code VARCHAR(30) UNIQUE NOT NULL,
      status ENUM('active', 'used', 'expired', 'cancelled') NOT NULL DEFAULT 'active',
      manh_sang_spent INT DEFAULT 0,
      used_at DATETIME,
      used_on_booking_id INT,
      issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      issued_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY (voucher_id) REFERENCES vouchers(id),
      FOREIGN KEY (used_on_booking_id) REFERENCES bookings(id) ON DELETE SET NULL
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS referrals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      referrer_id INT NOT NULL,
      referee_id INT NOT NULL,
      status ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
      referrer_rewarded TINYINT(1) NOT NULL DEFAULT 0,
      referee_rewarded TINYINT(1) NOT NULL DEFAULT 0,
      completed_at DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (referrer_id) REFERENCES members(id) ON DELETE CASCADE,
      FOREIGN KEY (referee_id) REFERENCES members(id) ON DELETE CASCADE,
      UNIQUE KEY uk_referral (referrer_id, referee_id)
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS tier_upgrade_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      member_id INT NOT NULL,
      from_tier VARCHAR(20) NOT NULL,
      to_tier VARCHAR(20) NOT NULL,
      manh_sang_at_change INT NOT NULL,
      reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
    )
  `);

  // Alter bookings table
  try {
    await conn.query(`ALTER TABLE bookings ADD COLUMN user_id INT`);
    await conn.query(`ALTER TABLE bookings ADD CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL`);
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME' && !e.message.includes('Duplicate key name')) {
      console.warn('⚠️ Cảnh báo thêm cột user_id vào bookings:', e.message);
    }
  }

  try {
    await conn.query(`ALTER TABLE bookings MODIFY COLUMN status ENUM('pending','awaiting_payment','confirmed','completed','cancelled') DEFAULT 'awaiting_payment'`);
    await conn.query(`ALTER TABLE bookings ADD COLUMN deposit_amount INT DEFAULT 0`);
    await conn.query(`ALTER TABLE bookings ADD COLUMN payment_expires_at DATETIME`);
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') {
      console.warn('⚠️ Cảnh báo thêm cột payment vào bookings:', e.message);
    }
  }

  // Alter contacts table
  try {
    await conn.query(`ALTER TABLE contacts ADD COLUMN admin_note TEXT`);
    await conn.query(`ALTER TABLE contacts ADD COLUMN assigned_to VARCHAR(255)`);
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') {
      console.warn('⚠️ Cảnh báo thêm cột note vào contacts:', e.message);
    }
  }

  // Update enums for business loyalty
  try {
    await conn.query(`ALTER TABLE members MODIFY COLUMN card_tier ENUM('pearl', 'rose', 'gold', 'privilege', 'frame', 'lumiere') NOT NULL DEFAULT 'pearl'`);
    await conn.query(`ALTER TABLE manh_sang_transactions MODIFY COLUMN type ENUM('spend', 'register_bonus', 'first_booking', 'early_deposit', 'second_visit', 'referral_reward', 'feedback_photo', 'social_share', 'birthday_booking', 'group_booking', 'voucher_redeem', 'admin_adjust', 'referral_milestone', 'early_brief', 'case_study', 'multi_project', 'renewal') NOT NULL`);
    await conn.query(`ALTER TABLE vouchers MODIFY COLUMN required_tier ENUM('pearl', 'rose', 'gold', 'privilege', 'frame', 'lumiere')`);
    console.log('✅ Đã cập nhật các ENUM cho hệ thống Loyalty Doanh Nghiệp');
  } catch (e) {
    console.warn('⚠️ Cảnh báo cập nhật ENUM doanh nghiệp:', e.message);
  }

  try {
    await conn.query(`ALTER TABLE bookings ADD COLUMN group_size INT DEFAULT 1`);
    await conn.query(`ALTER TABLE bookings ADD COLUMN is_birthday_month TINYINT(1) DEFAULT 0`);
    await conn.query(`ALTER TABLE bookings ADD COLUMN applied_voucher_id INT`);
    await conn.query(`ALTER TABLE bookings ADD COLUMN manh_sang_earned INT DEFAULT 0`);
    await conn.query(`ALTER TABLE bookings ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0`);
    await conn.query(`ALTER TABLE bookings ADD COLUMN final_amount DECIMAL(10,2) DEFAULT 0`);
    await conn.query(`ALTER TABLE bookings ADD COLUMN applied_voucher_code VARCHAR(30)`);
    console.log('✅ Đã thêm các cột Loyalty vào bảng bookings');
  } catch (e) {
    if (e.code !== 'ER_DUP_FIELDNAME') {
      console.warn('⚠️ Cảnh báo thêm cột Loyalty vào bookings:', e.message);
    }
  }

  // Seed Loyalty Vouchers
  const [existingVouchers] = await conn.query(`SELECT COUNT(*) as count FROM vouchers`);
  if (existingVouchers[0].count === 0) {
    await conn.query(`
      INSERT INTO vouchers (code_prefix, name, voucher_type, discount_type, discount_value, manh_sang_cost) VALUES
      ('GLOW', 'Glow Voucher', 'redeem', 'fixed', 50000, 80),
      ('ROSE', 'Rose Voucher', 'redeem', 'fixed', 100000, 200),
      ('GOLD', 'Gold Voucher', 'redeem', 'fixed', 200000, 400),
      ('SIGN', 'Signature Voucher', 'redeem', 'fixed', 0, 500)
    `);
    console.log('✅ Seed loyalty vouchers xong');
  } else {
    console.log('ℹ️  Vouchers đã có dữ liệu, bỏ qua seed');
  }

  console.log('✅ Các bảng Loyalty System đã sẵn sàng');

  // Seed services
  const [existingServices] = await conn.query(`SELECT COUNT(*) as count FROM services`);
  if (existingServices[0].count === 0) {
    const { concepts } = require('./data/concepts');
    for (const c of concepts) {
      let priceFrom = 0;
      if (c.pricing && c.pricing.length > 0) {
        const pStr = c.pricing[0].price.replace(/[^0-9]/g, '');
        priceFrom = parseInt(pStr) || 0;
      }
      const features = c.pricing && c.pricing[0] ? c.pricing[0].inclusions : [];

      await conn.query(`
        INSERT INTO services (name, slug, description, short_desc, price_from, duration_minutes, cover_image, features, is_featured, sort_order, category, category_label, subtitle, gallery, pricing, addons)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        c.name,
        c.id,
        c.description,
        c.subtitle,
        priceFrom,
        90,
        c.coverImage,
        JSON.stringify(features),
        1,
        0,
        c.category,
        c.categoryLabel,
        c.subtitle,
        JSON.stringify(c.gallery),
        JSON.stringify(c.pricing),
        JSON.stringify(c.addons)
      ]);
    }
    console.log('✅ Seed services xong');
  } else {
    console.log('ℹ️  Services đã có dữ liệu, bỏ qua seed');
  }

  // Seed blog posts
  const [existingPosts] = await conn.query(`SELECT COUNT(*) as count FROM blog_posts`);
  if (existingPosts[0].count === 0) {
    const post1Blocks = [
      { type: "text", value: "Dear Musé chính thức khai trương chi nhánh mới tại trung tâm Hà Nội với không gian thiết kế độc đáo và tràn ngập ánh sáng tự nhiên." },
      { type: "quote", value: "Ánh sáng tự nhiên là linh hồn của nhiếp ảnh, và chúng tôi kiến tạo không gian này để tôn vinh điều đó." },
      { type: "text", value: "Chúng tôi vô cùng tự hào được giới thiệu không gian làm việc và sáng tạo mới của Dear Musé. Với mục tiêu mang lại những bộ ảnh cưới, chân dung nghệ thuật và thời trang đỉnh cao, không gian studio mới được thiết kế tối giản, tinh tế, sử dụng ánh sáng trời tự nhiên phối hợp cùng các thiết bị đèn hiện đại." },
      { type: "text", value: "Cảm ơn quý khách hàng và các đối tác đã luôn đồng hành cùng chúng tôi. Nhân dịp khai trương, Dear Musé gửi tặng chương trình ưu đãi 15% cho tất cả các gói chụp đặt lịch trong tháng này." }
    ];

    const post2Blocks = [
      { type: "text", value: "Bộ ảnh ngoại cảnh nhẹ nhàng lưu giữ nét thanh xuân trong trẻo của Khánh Linh và Minh Trí tại vườn hoa Nhật Tân, Hà Nội." },
      { type: "quote", value: "Tuổi thanh xuân giống như một cơn mưa rào, dù có cảm lạnh bạn vẫn muốn được đắm mình trong nó lần nữa." },
      { type: "image", value: "/source/Nàng thơ/Hướng dương 001_.jpeg" },
      { type: "text", value: "Concept ngoại cảnh hướng tới sự tự nhiên, mộc mạc và giàu chất thơ. Dưới ánh nắng chiều hoàng hôn nhẹ nhàng, từng biểu cảm, nụ cười và khoảnh khắc hồn nhiên của nàng thơ đều được bắt trọn một cách tinh tế nhất." },
      { type: "image", value: "/source/Nàng thơ/Xanh Xanh 002.JPG" },
      { type: "image", value: "/source/Nàng thơ/Quả chanh 001.JPG" },
      { type: "text", value: "Cảm ơn Khánh Linh và Minh Trí đã tin tưởng lựa chọn Dear Musé để cùng vẽ nên câu chuyện thanh xuân tuyệt đẹp này." }
    ];

    await conn.query(`
      INSERT INTO blog_posts (title, slug, category, subtitle, client_name, location, photographer, concept, quote, summary, content, content_outro, content_blocks, cover_image, images, is_featured, status) VALUES
      ('Khai Trương Studio Mới Tại Hà Nội', 'khai-truong-studio-moi-tai-ha-noi', 'news',
       'Không gian sáng tạo nghệ thuật mới giữa lòng thủ đô',
       'Dear Musé Team', 'Hoàn Kiếm, Hà Nội', 'Dear Musé Crew', 'Khai Trương / Không Gian Mới',
       'Ánh sáng tự nhiên là linh hồn của nhiếp ảnh, và chúng tôi kiến tạo không gian này để tôn vinh điều đó.',
       'Dear Musé chính thức khai trương chi nhánh mới tại trung tâm Hà Nội với không gian thiết kế độc đáo và tràn ngập ánh sáng tự nhiên.',
       'Chúng tôi vô cùng tự hào được giới thiệu không gian làm việc và sáng tạo mới của Dear Musé. Với mục tiêu mang lại những bộ ảnh cưới, chân dung nghệ thuật và thời trang đỉnh cao, không gian studio mới được thiết kế tối giản, tinh tế, sử dụng ánh sáng trời tự nhiên phối hợp cùng các thiết bị đèn hiện đại.',
       'Cảm ơn quý khách hàng và các đối tác đã luôn đồng hành cùng chúng tôi. Nhân dịp khai trương, Dear Musé gửi tặng chương trình ưu đãi 15% cho tất cả các gói chụp đặt lịch trong tháng này.',
       ?,
       '/source/Nàng thơ/Nàng thơ 002.JPG', '[]', 1, 'published'),
      ('Nàng Thơ Thanh Xuân — Concept Outdoor', 'nang-tho-thanh-xuan-concept-outdoor', 'customer_photos',
       'Lưu giữ nét trong trẻo tinh khôi của tuổi trẻ dưới nắng chiều hoàng hôn',
       'Khánh Linh & Minh Trí', 'Vườn hoa Nhật Tân, Hà Nội', 'Lâm Bùi (Lead Photographer)', 'Nàng Thơ / Vintage Outdoor',
       'Tuổi thanh xuân giống như một cơn mưa rào, dù có cảm lạnh bạn vẫn muốn được đắm mình trong nó lần nữa.',
       'Bộ ảnh ngoại cảnh nhẹ nhàng lưu giữ nét thanh xuân trong trẻo của Khánh Linh và Minh Trí tại vườn hoa Nhật Tân, Hà Nội.',
       'Concept ngoại cảnh hướng tới sự tự nhiên, mộc mạc và giàu chất thơ. Dưới ánh nắng chiều hoàng hôn nhẹ nhàng, từng biểu cảm, nụ cười và khoảnh khắc hồn nhiên của nàng thơ đều được bắt trọn một cách tinh tế nhất.',
       'Cảm ơn Khánh Linh và Minh Trí đã tin tưởng lựa chọn Dear Musé để cùng vẽ nên câu chuyện thanh xuân tuyệt đẹp này.',
       ?,
       '/source/Nàng thơ/Hướng dương 003.jpg',
       '["/source/Nàng thơ/Hướng dương 003.jpg", "/source/Nàng thơ/Xanh Xanh 002.JPG", "/source/Nàng thơ/Quả chanh 001.JPG"]', 0, 'published')
    `, [JSON.stringify(post1Blocks), JSON.stringify(post2Blocks)]);
    console.log('✅ Seed blog posts xong');
  } else {
    console.log('ℹ️  Blog posts đã có dữ liệu, bỏ qua seed');
  }

  // Seed portfolio
  const [existingPortfolio] = await conn.query(`SELECT COUNT(*) as count FROM portfolio`);
  if (existingPortfolio[0].count === 0) {
    await conn.query(`
      INSERT INTO portfolio (title, slug, category, description, cover_image, images, shoot_date, is_featured, sort_order) VALUES
      ('Doanh Nghiệp — Premium Event', 'doanh-nghiep-premium-event', 'doanh-nghiep', 'Bộ ảnh sự kiện doanh nghiệp cao cấp và sang trọng.', '/source/DOANH%20NGHI%E1%BB%86P/PREMIUM/IMG_4319.JPG', '[]', '2025-05-15', 1, 1),
      ('Nàng Thơ — Hướng Dương', 'nang-tho-huong-duong', 'ca-nhan', 'Bộ ảnh nghệ thuật với hoa hướng dương — sự tươi vui và rực rỡ trong từng khung hình chân dung.', '/source/N%C3%A0ng%20th%C6%A1/H%C6%B0%E1%BB%9Bng%20d%C6%B0%C6%A1ng%20001_.jpeg', '[]', '2025-04-20', 1, 2),
      ('Nàng Thơ — Xanh Xanh', 'nang-tho-xanh-xanh', 'ca-nhan', 'Tone xanh mát lành — concept studio nhẹ nhàng, tinh tế với ánh sáng được tạo dựng tỉ mỉ.', '/source/N%C3%A0ng%20th%C6%A1/Xanh%20Xanh%20002.JPG', '[]', '2025-03-10', 1, 3),
      ('Mở Rộng — Sáng Tạo Sản Phẩm', 'mo-rong-sang-tao-san-pham', 'mo-rong', 'Concept nghệ thuật tối giản kết hợp với ảnh chụp sản phẩm độc bản.', '/source/M%E1%BB%9E%20R%E1%BB%98NG/S%E1%BA%A2N%20PH%E1%BA%A8M/IMG_4613.JPG', '[]', '2025-02-14', 1, 4)
    `);
    console.log('✅ Seed portfolio xong');
  } else {
    console.log('ℹ️  Portfolio đã có dữ liệu, bỏ qua seed');
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

  // Seed default settings
  const [existingSettings] = await conn.query(`SELECT COUNT(*) as count FROM settings`);
  if (existingSettings[0].count === 0) {
    await conn.query(`
      INSERT INTO settings (setting_key, setting_value, description) VALUES
      ('bank_name', 'ACB', 'Tên ngân hàng nhận thanh toán'),
      ('bank_account_no', '6333333633', 'Số tài khoản'),
      ('bank_account_name', 'NGUYEN VAN HOI', 'Tên chủ tài khoản'),
      ('api_url', 'https://api.sieuthicode.net/historyapiacbv3', 'URL API kiểm tra giao dịch'),
      ('api_password', '', 'Mật khẩu API SieuthiCode'),
      ('api_token', '', 'Token API SieuthiCode')
    `);
    console.log('✅ Cấu hình thanh toán đã được seed');
  } else {
    console.log('ℹ️  Cấu hình thanh toán đã tồn tại, bỏ qua');
  }

  // Seed default tier limits settings
  try {
    const tierSettings = [
      ['tier_limit_pearl_rose', '300', 'Mốc Mảnh Sáng thăng hạng Rose (Cá nhân)'],
      ['tier_limit_rose_gold', '800', 'Mốc Mảnh Sáng thăng hạng Gold (Cá nhân)'],
      ['tier_limit_gold_privilege', '1500', 'Mốc Mảnh Sáng thăng hạng Privilege (Cá nhân)'],
      ['tier_limit_frame_lumiere', '1201', 'Mốc Mảnh Sáng thăng hạng Lumière (Doanh nghiệp)']
    ];
    for (const s of tierSettings) {
      await conn.query(`INSERT IGNORE INTO settings (setting_key, setting_value, description) VALUES (?, ?, ?)`, s);
    }
    console.log('✅ Cấu hình mốc tích điểm đã được seed');
  } catch (e) {
    console.warn('⚠️ Cảnh báo seed mốc tích điểm:', e.message);
  }

  // FEEDBACK TABLE
  await conn.query(`
    CREATE TABLE IF NOT EXISTS feedbacks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      customer_type ENUM('individual', 'business') DEFAULT 'individual',
      display_name VARCHAR(100),
      service_id INT,
      service_label VARCHAR(100),
      rating TINYINT NOT NULL DEFAULT 5,
      content TEXT NOT NULL,
      is_approved TINYINT(1) DEFAULT 0,
      is_featured TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
    )
  `);
  console.log('✅ Bảng feedbacks đã sẵn sàng');

  // Seed Feedbacks
  const [existingFeedbacks] = await conn.query(`SELECT COUNT(*) as count FROM feedbacks`);
  if (existingFeedbacks[0].count === 0) {
    await conn.query(`
      INSERT INTO feedbacks (customer_type, display_name, service_label, rating, content, is_approved, is_featured, created_at) VALUES
      ('individual', 'Ng. T. H.', 'Portrait Cá Nhân', 5,
       'Mình không ngờ một buổi chụp lại có thể khiến mình rơi nước mắt vì hạnh phúc. Nhiếp ảnh gia không chỉ chụp ảnh — họ kể câu chuyện của mình theo cách mình chưa từng thấy. Những tấm ảnh đó, mình sẽ giữ mãi.',
       1, 1, '2026-05-12 10:00:00'),

      ('individual', 'T. M. K.', 'Sinh Nhật & Tốt Nghiệp', 5,
       'Bộ ảnh tốt nghiệp của mình hoàn toàn vượt mọi kỳ vọng. Ánh sáng, góc chụp, cả không khí — tất cả đều như trong mơ. Cảm ơn Dear Musé đã biến một ngày quan trọng thành ký ức không thể phai.',
       1, 1, '2026-05-20 14:00:00'),

      ('business', 'Cty B***', 'Thương Hiệu & Sản Phẩm', 5,
       'Chúng tôi đã hợp tác với nhiều studio khác nhau, nhưng Dear Musé mang lại một sự khác biệt thực sự. Bộ ảnh thương hiệu mới của chúng tôi nhận được rất nhiều phản hồi tích cực từ đối tác và khách hàng.',
       1, 1, '2026-04-15 09:00:00'),

      ('individual', 'L. T. A.', 'Portrait Cá Nhân', 5,
       'Lần đầu tiên trong đời mình thấy mình đẹp đến vậy trong ảnh. Team rất chuyên nghiệp, tạo cho mình sự thoải mái hoàn toàn. Kết quả không chỉ là ảnh — đó là sự tự tin.',
       1, 0, '2026-05-01 11:00:00'),

      ('individual', 'Ph. H. Y.', 'Sinh Nhật & Tốt Nghiệp', 5,
       'Sinh nhật 25 tuổi của mình trở nên ý nghĩa hơn bao giờ hết nhờ buổi chụp này. Mỗi tấm ảnh là một khoảnh khắc được đóng khung bởi ánh sáng và tình yêu. Không thể không yêu Dear Musé.',
       1, 0, '2026-04-28 15:00:00'),

      ('business', 'C*** Media', 'Sự Kiện', 5,
       'Sự kiện ra mắt sản phẩm của chúng tôi được ghi lại hoàn hảo. Mọi khoảnh khắc, mọi cảm xúc đều được nắm bắt tinh tế. Dear Musé xứng đáng là đối tác truyền thông tin cậy lâu dài.',
       1, 0, '2026-05-05 10:30:00'),

      ('individual', 'V. K. N.', 'Portrait Cá Nhân', 4,
       'Concept được tư vấn rất kỹ và phù hợp với tính cách của mình. Ảnh ra đẹp và tự nhiên. Sẽ quay lại cho bộ ảnh tiếp theo chắc chắn rồi!',
       1, 0, '2026-04-10 13:00:00'),

      ('individual', 'Đ. T. T.', 'Sinh Nhật & Tốt Nghiệp', 5,
       'Bộ ảnh outdoor hoàng hôn của mình — không có từ nào khác ngoài tuyệt vời. Nhiếp ảnh gia chụp nhanh, chụp nhiều, chọn lọc tinh tế. Ảnh nhận về là những khoảnh khắc vàng.',
       1, 0, '2026-03-25 16:00:00'),

      ('business', 'T*** Brand', 'Thương Hiệu & Sản Phẩm', 5,
       'Lookbook thương hiệu sau khi hợp tác với Dear Musé đã giúp chúng tôi tăng tỉ lệ chuyển đổi đáng kể. Hình ảnh chuyên nghiệp, storytelling thông qua ánh sáng — đó là điều chúng tôi cần.',
       1, 0, '2026-03-10 08:00:00'),

      ('individual', 'H. M. L.', 'Portrait Cá Nhân', 5,
       'Mình là người rất tự ti khi chụp ảnh, nhưng đội ngũ Dear Musé đã khiến mình hoàn toàn thoải mái và tự nhiên. Ảnh ra xem mà mình không nhận ra chính mình — đẹp quá đến mức đó.',
       1, 0, '2026-05-18 10:00:00'),

      ('individual', 'Ng. H. B.', 'Sự Kiện', 4,
       'Buổi chụp kỷ yếu lớp mình được Dear Musé ghi lại rất cảm xúc. Không khí, nụ cười, cả những giọt nước mắt chia tay — tất cả đều hiện diện trong ảnh. Xứng đáng 5 sao!',
       1, 0, '2026-04-05 09:00:00'),

      ('business', 'R*** Studio', 'Sự Kiện', 5,
       'Chúng tôi thuê Dear Musé chụp workshop thiết kế của mình. Kết quả vượt xa mong đợi — mỗi tấm ảnh toát lên năng lượng sáng tạo và chuyên nghiệp. Đối tác tuyệt vời!',
       1, 0, '2026-02-20 14:00:00'),

      ('individual', 'B. T. Ph.', 'Portrait Cá Nhân', 5,
       'Dear Musé không chỉ chụp ảnh — họ tạo ra nghệ thuật. Từ việc tư vấn trang phục đến lựa chọn ánh sáng, mọi thứ đều được cân nhắc kỹ lưỡng. Bộ ảnh của mình là một tác phẩm.',
       1, 0, '2026-05-08 11:30:00'),

      ('individual', 'X. P. D.', 'Sinh Nhật & Tốt Nghiệp', 5,
       'Tốt nghiệp đại học — một cột mốc quan trọng mà mình muốn lưu giữ theo cách đặc biệt nhất. Và Dear Musé đã làm điều đó. Mỗi tấm ảnh như một trang nhật ký của tuổi trẻ.',
       1, 0, '2026-04-22 15:00:00'),

      ('business', 'Cty L***', 'Thương Hiệu & Sản Phẩm', 4,
       'Hình ảnh sản phẩm mới của công ty chúng tôi trở nên thu hút và chuyên nghiệp hơn hẳn. Dear Musé hiểu được ngôn ngữ thương hiệu và chuyển hóa nó thành những khung hình đẹp mắt.',
       1, 0, '2026-03-15 10:00:00'),

      ('individual', 'T. H. L.', 'Portrait Cá Nhân', 5,
       'Lần đầu chụp concept nghệ thuật và mình hoàn toàn bị chinh phục. Không gian studio ấm cúng, team thân thiện, ảnh ra đẹp đến không tưởng. Đây sẽ mãi là bộ ảnh yêu thích của mình.',
       1, 0, '2026-05-25 13:00:00'),

      ('individual', 'M. Q. A.', 'Sự Kiện', 5,
       'Tiệc sinh nhật mẹ mình được ghi lại đầy đủ và cảm động. Những nụ cười, những cái ôm, những giọt nước mắt hạnh phúc — Dear Musé không bỏ sót khoảnh khắc nào. Cảm ơn nhiều lắm!',
       1, 0, '2026-04-30 17:00:00'),

      ('business', 'A*** Agency', 'Sự Kiện', 5,
       'Chúng tôi đã và sẽ tiếp tục chọn Dear Musé cho các sự kiện của agency. Chất lượng ổn định, phong cách nhất quán, và luôn giao ảnh đúng hẹn. Đó là những gì chúng tôi cần nhất.',
       1, 0, '2026-02-10 09:00:00'),

      ('individual', 'Ng. T. B.', 'Portrait Cá Nhân', 5,
       'Mình đặt lịch để có bộ ảnh làm hồ sơ nghề nghiệp, nhưng kết quả nhận được còn hơn cả những gì mình hy vọng. Ảnh vừa chuyên nghiệp vừa đậm chất cá nhân. Dear Musé thực sự hiểu khách hàng.',
       1, 0, '2026-05-02 10:00:00'),

      ('individual', 'C. K. V.', 'Sinh Nhật & Tốt Nghiệp', 5,
       'Bộ ảnh sinh nhật 30 tuổi của mình — một khoảnh khắc mình sẽ nhớ mãi. Mỗi tấm ảnh như thì thầm: "Em đã làm được, em xứng đáng với điều này." Cảm ơn Dear Musé rất nhiều.',
       1, 0, '2026-05-30 12:00:00')
    `);
    console.log('✅ Seed 20 feedbacks mẫu xong');
  } else {
    console.log('ℹ️  Feedbacks đã có dữ liệu, bỏ qua seed');
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
