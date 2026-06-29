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
  is_featured TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT 0,
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
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_albums (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cover_image VARCHAR(500),
  status ENUM('booked', 'shooting', 'editing', 'completed') DEFAULT 'booked',
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

