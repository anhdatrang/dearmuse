const db = require('../config/db');

async function seedAnalytics() {
  console.log('🔄 Bắt đầu nạp dữ liệu kiểm thử Analytics...');
  try {
    // 1. Clean up old mock analytics data if needed, or just insert new ones
    // We will insert daily timeline events for the last 14 days
    console.log('📝 Nạp dữ liệu timeline...');
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const dateStr = new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const count = Math.floor(Math.random() * 40) + 10; // 10 to 50 events per day
      for (let c = 0; c < count; c++) {
        await db.execute(
          `INSERT INTO analytics_events (event_type, event_value, ip_address, location, created_at) 
           VALUES (?, ?, ?, ?, ?)`,
          ['page_view', '/', '127.0.0.1', 'Hà Nội', `${dateStr} 12:00:00`]
        );
      }
    }

    // 2. Nạp dữ liệu Time on Page
    console.log('📝 Nạp dữ liệu thời gian xem trang...');
    const pages = [
      { path: '/', duration: 25 },
      { path: '/services', duration: 42 },
      { path: '/portfolio', duration: 85 },
      { path: '/booking', duration: 32 },
      { path: '/about', duration: 18 },
      { path: '/blog', duration: 55 }
    ];
    for (const p of pages) {
      // Mỗi trang nạp 10-15 records
      const count = Math.floor(Math.random() * 5) + 10;
      for (let c = 0; c < count; c++) {
        const offset = Math.floor(Math.random() * 15) - 7; // Thêm biến động
        await db.execute(
          `INSERT INTO analytics_events (event_type, event_value, ip_address, location, duration_seconds) 
           VALUES (?, ?, ?, ?, ?)`,
          ['time_on_page', p.path, '127.0.0.1', 'Hà Nội', p.duration + offset]
        );
      }
    }

    // 3. Nạp dữ liệu Clicks
    console.log('📝 Nạp dữ liệu các nút click...');
    const clicks = [
      { element: 'Booking Button (Header)', count: 42 },
      { element: 'Booking Button (Footer)', count: 18 },
      { element: 'Booking Button (CTA Block)', count: 35 },
      { element: 'Contact Channel: Zalo', count: 68 },
      { element: 'Contact Channel: Hotline Phone', count: 24 },
      { element: 'Contact Channel: Facebook', count: 50 },
      { element: 'Chatbot: Mascot Clicked', count: 32 },
      { element: 'Chatbot: Message Sent', count: 95 },
      { element: 'Concept Click: Nàng thơ', count: 55 },
      { element: 'Concept Click: Cá nhân/Áo dài', count: 38 }
    ];
    for (const cl of clicks) {
      for (let c = 0; c < cl.count; c++) {
        await db.execute(
          `INSERT INTO analytics_events (event_type, event_value, ip_address, location) 
           VALUES (?, ?, ?, ?)`,
          ['click_element', cl.element, '127.0.0.1', 'Hà Nội']
        );
      }
    }

    console.log('✅ Nạp dữ liệu kiểm thử Analytics thành công!');
  } catch (err) {
    console.error('❌ Lỗi khi nạp dữ liệu:', err);
  } finally {
    process.exit(0);
  }
}

seedAnalytics();
