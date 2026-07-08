-- Dear Musé Database Schema
CREATE DATABASE IF NOT EXISTS dear_muse CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dear_muse;

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
);

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
);

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
);

CREATE TABLE IF NOT EXISTS contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  subject VARCHAR(500),
  message TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
);

CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  description VARCHAR(255)
);

-- Seed default settings
INSERT IGNORE INTO settings (setting_key, setting_value, description) VALUES
('bank_name', 'ACB', 'Tên ngân hàng nhận thanh toán'),
('bank_account_no', '6333333633', 'Số tài khoản'),
('bank_account_name', 'NGUYEN VAN HOI', 'Tên chủ tài khoản'),
('api_url', 'https://api.sieuthicode.net/historyapiacbv3', 'URL API kiểm tra giao dịch'),
('api_password', '', 'Mật khẩu API SieuthiCode'),
('api_token', '', 'Token API SieuthiCode'),
('tier_limit_pearl_rose', '300', 'Mốc Mảnh Sáng thăng hạng Rose (Cá nhân)'),
('tier_limit_rose_gold', '800', 'Mốc Mảnh Sáng thăng hạng Gold (Cá nhân)'),
('tier_limit_gold_privilege', '1500', 'Mốc Mảnh Sáng thăng hạng Privilege (Cá nhân)'),
('tier_limit_frame_lumiere', '1201', 'Mốc Mảnh Sáng thăng hạng Lumière (Doanh nghiệp)');

-- Seed services
INSERT IGNORE INTO services (name, slug, description, short_desc, price_from, duration_minutes, is_featured, sort_order) VALUES
('Portrait Cá Nhân', 'portrait-ca-nhan', 'Chụp chân dung nghệ thuật — nắm bắt cá tính và cảm xúc của bạn trong từng khung hình. Mỗi bộ ảnh là một câu chuyện riêng, được kể bằng ánh sáng và cảm xúc thật.', 'Lưu giữ khoảnh khắc của chính bạn', 1500000, 90, 1, 1),
('Sinh Nhật & Tốt Nghiệp', 'sinh-nhat-tot-nghiep', 'Những cột mốc quan trọng xứng đáng được ghi lại theo cách đẹp nhất. Từ buổi chụp sinh nhật lãng mạn đến bộ ảnh tốt nghiệp đáng tự hào.', 'Cột mốc cuộc đời đáng nhớ', 1800000, 120, 1, 2),
('Sự Kiện', 'su-kien', 'Ghi lại không khí và cảm xúc của những buổi sự kiện đặc biệt. Dạ hội, tiệc tốt nghiệp, workshop hay bất kỳ khoảnh khắc tập thể nào xứng đáng được lưu giữ.', 'Khoảnh khắc tập thể, cảm xúc riêng tư', 3000000, 180, 0, 3),
('Thương Hiệu & Sản Phẩm', 'thuong-hieu-san-pham', 'Ảnh thương mại chuyên nghiệp — nâng tầm hình ảnh thương hiệu của bạn. Từ ảnh sản phẩm đến lookbook thương hiệu, chúng tôi tạo nên hình ảnh kể được câu chuyện.', 'Hình ảnh bán hàng, hình ảnh thương hiệu', 2500000, 120, 1, 4);

-- Seed portfolio
INSERT IGNORE INTO portfolio (title, slug, category, description, cover_image, images, shoot_date, is_featured, sort_order) VALUES
('Doanh Nghiệp — Premium Event', 'doanh-nghiep-premium-event', 'doanh-nghiep', 'Bộ ảnh sự kiện doanh nghiệp cao cấp và sang trọng.', '/source/DOANH%20NGHI%E1%BB%86P/PREMIUM/IMG_4319.JPG', '[]', '2025-05-15', 1, 1),
('Nàng Thơ — Hướng Dương', 'nang-tho-huong-duong', 'ca-nhan', 'Bộ ảnh nghệ thuật với hoa hướng dương — sự tươi vui và rực rỡ trong từng khung hình chân dung.', '/source/N%C3%A0ng%20th%C6%A1/H%C6%B0%E1%BB%9Bng%20d%C6%B0%C6%A1ng%20001_.jpeg', '[]', '2025-04-20', 1, 2),
('Nàng Thơ — Xanh Xanh', 'nang-tho-xanh-xanh', 'ca-nhan', 'Tone xanh mát lành — concept studio nhẹ nhàng, tinh tế với ánh sáng được tạo dựng tỉ mỉ.', '/source/N%C3%A0ng%20th%C6%A1/Xanh%20Xanh%20002.JPG', '[]', '2025-03-10', 1, 3),
('Mở Rộng — Sáng Tạo Sản Phẩm', 'mo-rong-sang-tao-san-pham', 'mo-rong', 'Concept nghệ thuật tối giản kết hợp với ảnh chụp sản phẩm độc bản.', '/source/M%E1%BB%9E%20R%E1%BB%98NG/S%E1%BA%A2N%20PH%E1%BA%A8M/IMG_4613.JPG', '[]', '2025-02-14', 1, 4);

-- Seed default admin (password: dearmuse2025)
INSERT IGNORE INTO admins (username, password_hash) VALUES
('admin', '$2b$10$Pnc9Bs./gs0wLNLBLkMG1OCd.GVAcDXBzl0xF8/mq8MltcwnLnpwm');

-- Create Customer Tables
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
);

CREATE TABLE IF NOT EXISTS announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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
);

CREATE TABLE IF NOT EXISTS album_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  album_id INT NOT NULL,
  original_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255),
  file_size INT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (album_id) REFERENCES customer_albums(id) ON DELETE CASCADE
);

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
);

CREATE TABLE IF NOT EXISTS face_descriptors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  image_id INT NOT NULL,
  descriptor JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (image_id) REFERENCES album_images(id) ON DELETE CASCADE
);

-- Create Analytics table
CREATE TABLE IF NOT EXISTS analytics_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  event_value VARCHAR(255),
  ip_address VARCHAR(45),
  location VARCHAR(100),
  duration_seconds INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create OTPs table for authentication
CREATE TABLE IF NOT EXISTS otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(6) NOT NULL,
  purpose ENUM('register', 'reset_password') NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Email History table
CREATE TABLE IF NOT EXISTS email_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subject VARCHAR(255) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  content TEXT,
  status VARCHAR(50) DEFAULT 'sent',
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS group_size INT DEFAULT 1;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_birthday_month TINYINT(1) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS applied_voucher_id INT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS manh_sang_earned INT DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS final_amount DECIMAL(10,2) DEFAULT 0;

-- =========================================================
-- LOYALTY SYSTEM (Dear Muse)
-- =========================================================

CREATE TABLE IF NOT EXISTS members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
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
);

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
);

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
);

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
);

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
);

CREATE TABLE IF NOT EXISTS tier_upgrade_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  from_tier VARCHAR(20) NOT NULL,
  to_tier VARCHAR(20) NOT NULL,
  manh_sang_at_change INT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Seed data for vouchers
INSERT IGNORE INTO vouchers (code_prefix, name, voucher_type, discount_type, discount_value, manh_sang_cost) VALUES
('GLOW', 'Glow Voucher', 'redeem', 'fixed', 50000, 80),
('ROSE', 'Rose Voucher', 'redeem', 'fixed', 100000, 200),
('GOLD', 'Gold Voucher', 'redeem', 'fixed', 200000, 400),
('SIGN', 'Signature Voucher', 'redeem', 'fixed', 0, 500);
