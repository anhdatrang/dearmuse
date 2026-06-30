require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrateWebp() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dear_muse',
    multipleStatements: true
  });

  console.log('🔄 Đang kết nối Database để migrate ảnh sang .webp...');

  try {
    const queries = [
      `UPDATE services SET cover_image = REPLACE(REPLACE(REPLACE(cover_image, '.jpg', '.webp'), '.png', '.webp'), '.jpeg', '.webp') WHERE cover_image IS NOT NULL;`,
      `UPDATE customer_albums SET cover_image = REPLACE(REPLACE(REPLACE(cover_image, '.jpg', '.webp'), '.png', '.webp'), '.jpeg', '.webp') WHERE cover_image IS NOT NULL;`,
      `UPDATE album_images SET original_url = REPLACE(REPLACE(REPLACE(original_url, '.jpg', '.webp'), '.png', '.webp'), '.jpeg', '.webp') WHERE original_url IS NOT NULL;`,
      `UPDATE album_images SET thumbnail_url = REPLACE(REPLACE(REPLACE(thumbnail_url, '.jpg', '.webp'), '.png', '.webp'), '.jpeg', '.webp') WHERE thumbnail_url IS NOT NULL;`,
      `UPDATE blog_posts SET cover_image = REPLACE(REPLACE(REPLACE(cover_image, '.jpg', '.webp'), '.png', '.webp'), '.jpeg', '.webp') WHERE cover_image IS NOT NULL;`,
      
      // Upper case variants just in case
      `UPDATE services SET cover_image = REPLACE(REPLACE(REPLACE(cover_image, '.JPG', '.webp'), '.PNG', '.webp'), '.JPEG', '.webp') WHERE cover_image IS NOT NULL;`,
      `UPDATE customer_albums SET cover_image = REPLACE(REPLACE(REPLACE(cover_image, '.JPG', '.webp'), '.PNG', '.webp'), '.JPEG', '.webp') WHERE cover_image IS NOT NULL;`,
      `UPDATE album_images SET original_url = REPLACE(REPLACE(REPLACE(original_url, '.JPG', '.webp'), '.PNG', '.webp'), '.JPEG', '.webp') WHERE original_url IS NOT NULL;`,
      `UPDATE album_images SET thumbnail_url = REPLACE(REPLACE(REPLACE(thumbnail_url, '.JPG', '.webp'), '.PNG', '.webp'), '.JPEG', '.webp') WHERE thumbnail_url IS NOT NULL;`,
      `UPDATE blog_posts SET cover_image = REPLACE(REPLACE(REPLACE(cover_image, '.JPG', '.webp'), '.PNG', '.webp'), '.JPEG', '.webp') WHERE cover_image IS NOT NULL;`,
    ];

    for (const q of queries) {
      await conn.query(q);
    }
    
    console.log('✅ Migration hoàn tất: Đã đổi đuôi ảnh thành .webp trong DB.');
  } catch (err) {
    console.error('❌ Lỗi:', err);
  } finally {
    await conn.end();
  }
}

migrateWebp();
