const db = require('../config/db');

async function upgradeDatabase() {
  console.log('🔄 Bắt đầu nâng cấp cơ sở dữ liệu cho Analytics...');
  try {
    // Kiểm tra xem cột duration_seconds đã tồn tại chưa
    const [columns] = await db.execute(`SHOW COLUMNS FROM analytics_events LIKE 'duration_seconds'`);
    
    if (columns.length === 0) {
      console.log('➕ Cột "duration_seconds" chưa tồn tại. Đang thêm cột...');
      await db.execute(`
        ALTER TABLE analytics_events 
        ADD COLUMN duration_seconds INT DEFAULT 0 AFTER location
      `);
      console.log('✅ Đã thêm cột "duration_seconds" thành công.');
    } else {
      console.log('ℹ️ Cột "duration_seconds" đã tồn tại.');
    }
    
  } catch (err) {
    console.error('❌ Lỗi khi nâng cấp cơ sở dữ liệu:', err);
  } finally {
    // Đóng pool kết nối để kết thúc tiến trình
    process.exit(0);
  }
}

upgradeDatabase();
