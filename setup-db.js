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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await conn.query(`
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
