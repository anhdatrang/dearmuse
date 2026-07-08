// scripts/migrate-concepts.js
const db = require('../config/db');
const { concepts } = require('../data/concepts');

async function run() {
  console.log('🚀 Bắt đầu quá trình migration...');

  try {
    // 1. Kiểm tra và bổ sung các cột nếu chưa tồn tại
    const [cols] = await db.query('SHOW COLUMNS FROM services');
    const colNames = cols.map(c => c.Field);

    const columnsToAdd = [
      { name: 'category', def: "VARCHAR(50) NOT NULL DEFAULT 'ca-nhan'" },
      { name: 'category_label', def: "VARCHAR(100) NOT NULL DEFAULT 'Cá Nhân'" },
      { name: 'subtitle', def: 'VARCHAR(255) NULL' },
      { name: 'gallery', def: 'JSON NULL' },
      { name: 'pricing', def: 'JSON NULL' },
      { name: 'addons', def: 'JSON NULL' }
    ];

    for (const col of columnsToAdd) {
      if (!colNames.includes(col.name)) {
        console.log(`- Thêm cột '${col.name}' vào bảng services...`);
        await db.query(`ALTER TABLE services ADD COLUMN ${col.name} ${col.def}`);
      }
    }

    // 2. Xóa các dịch vụ cũ trong bảng services để import dữ liệu concept sạch
    console.log('- Xóa dữ liệu cũ trong bảng services...');
    await db.query('DELETE FROM services');

    // 3. Import 8 concept từ data/concepts.js
    console.log('- Đang import 8 concept từ data/concepts.js vào database...');
    for (const c of concepts) {
      let priceFrom = 0;
      if (c.pricing && c.pricing.length > 0) {
        // Trích xuất số từ chuỗi giá (ví dụ "1.800.000đ" -> 1800000)
        const pStr = c.pricing[0].price.replace(/[^0-9]/g, '');
        priceFrom = parseInt(pStr) || 0;
      }
      const features = c.pricing && c.pricing[0] ? c.pricing[0].inclusions : [];

      console.log(`  + Import concept: ${c.name} (${c.id})`);
      await db.query(`
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

    console.log('✅ Migration hoàn tất thành công!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Lỗi trong quá trình migration:', err);
    process.exit(1);
  }
}

run();
