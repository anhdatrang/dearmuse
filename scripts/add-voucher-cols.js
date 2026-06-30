/**
 * Script: add-voucher-cols.js
 * Mục đích: Thêm cột applied_voucher_code vào bảng bookings
 * Chạy: node scripts/add-voucher-cols.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  console.log('🔧 Bắt đầu migrate — thêm cột voucher vào bookings...\n');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'dear_muse',
    charset: 'utf8mb4',
  });

  const alterCols = [
    { col: 'applied_voucher_code', sql: `ALTER TABLE bookings ADD COLUMN applied_voucher_code VARCHAR(30)` },
    { col: 'discount_amount',      sql: `ALTER TABLE bookings ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0` },
    { col: 'final_amount',         sql: `ALTER TABLE bookings ADD COLUMN final_amount DECIMAL(10,2) DEFAULT 0` },
    { col: 'applied_voucher_id',   sql: `ALTER TABLE bookings ADD COLUMN applied_voucher_id INT` },
  ];

  for (const item of alterCols) {
    try {
      await conn.query(item.sql);
      console.log(`✅ Đã thêm cột ${item.col}`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log(`ℹ️  Cột ${item.col} đã tồn tại, bỏ qua.`);
      } else {
        console.warn(`⚠️  Lỗi thêm cột ${item.col}:`, e.message);
      }
    }
  }

  // Seed Signature Voucher tiers vào vouchers nếu chưa có
  const [signRows] = await conn.query(`SELECT id FROM vouchers WHERE code_prefix = 'SIGN'`);
  if (signRows.length > 0) {
    // Cập nhật Signature Voucher để có mô tả rõ ràng hơn
    await conn.query(`
      UPDATE vouchers SET 
        name = 'Signature Voucher',
        description = 'Voucher đặc biệt cao cấp — giá trị phụ thuộc vào số Mảnh Sáng đổi (500/800/1500 MS). Liên hệ studio để xác nhận.',
        valid_days = 180
      WHERE code_prefix = 'SIGN'
    `);
    console.log('✅ Đã cập nhật Signature Voucher');
  }

  // Thêm Signature tiers nếu chưa có
  const tierData = [
    { prefix: 'SIGN500', name: 'Signature Voucher — Tier I', cost: 500, value: 300000, desc: 'Giảm 300.000đ cho gói bất kỳ' },
    { prefix: 'SIGN800', name: 'Signature Voucher — Tier II', cost: 800, value: 500000, desc: 'Giảm 500.000đ + 1 ảnh retouch thêm' },
    { prefix: 'SIGN1500', name: 'Signature Voucher — Tier III', cost: 1500, value: 20, desc: 'Giảm 20% toàn bộ gói + tư vấn concept riêng' },
  ];

  for (const t of tierData) {
    const [existing] = await conn.query(`SELECT id FROM vouchers WHERE code_prefix = ?`, [t.prefix]);
    if (existing.length === 0) {
      const isPercent = t.prefix === 'SIGN1500';
      await conn.query(`
        INSERT INTO vouchers (code_prefix, name, description, voucher_type, discount_type, discount_value, manh_sang_cost, valid_days, is_active)
        VALUES (?, ?, ?, 'redeem', ?, ?, ?, 180, 1)
      `, [t.prefix, t.name, t.desc, isPercent ? 'percent' : 'fixed', t.value, t.cost]);
      console.log(`✅ Thêm ${t.name}`);
    } else {
      console.log(`ℹ️  ${t.name} đã tồn tại`);
    }
  }

  await conn.end();
  console.log('\n🎉 Migrate voucher hoàn tất!\n');
}

migrate().catch(err => {
  console.error('❌ Lỗi migrate:', err.message);
  process.exit(1);
});
