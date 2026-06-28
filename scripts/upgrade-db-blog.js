const db = require('../config/db');

async function upgradeDatabase() {
  try {
    console.log('🔄 Đang kiểm tra cấu trúc bảng blog_posts...');
    
    // Check if the column content_blocks already exists
    const [columns] = await db.execute(`SHOW COLUMNS FROM blog_posts LIKE 'content_blocks'`);
    
    if (columns.length === 0) {
      console.log('➕ Cột content_blocks chưa tồn tại. Đang thêm cột mới...');
      await db.execute(`
        ALTER TABLE blog_posts 
        ADD COLUMN content_blocks JSON NULL AFTER content
      `);
      console.log('✅ Đã thêm cột content_blocks thành công!');
    } else {
      console.log('ℹ️ Cột content_blocks đã tồn tại trong database, bỏ qua nâng cấp.');
    }
    
    // Also check if we can migrate existing posts
    const [posts] = await db.execute(`SELECT id, content, images, quote, content_outro FROM blog_posts WHERE content_blocks IS NULL`);
    if (posts.length > 0) {
      console.log(`🔄 Phát hiện ${posts.length} bài viết cũ chưa có blocks. Tiến hành tự động chuyển đổi sang dạng block...`);
      for (const post of posts) {
        const blocks = [];
        
        // Add content as a text block
        if (post.content && post.content.trim()) {
          blocks.push({ type: 'text', value: post.content });
        }
        
        // Add quote if exists
        if (post.quote && post.quote.trim()) {
          blocks.push({ type: 'quote', value: post.quote });
        }
        
        // Add images if exists
        let extraImages = [];
        try {
          if (post.images) {
            extraImages = typeof post.images === 'string' ? JSON.parse(post.images) : post.images;
          }
        } catch (e) {
          console.error(`Lỗi parse ảnh cho post id ${post.id}:`, e);
        }
        
        if (Array.isArray(extraImages)) {
          for (const img of extraImages) {
            if (img && img.trim()) {
              blocks.push({ type: 'image', value: img });
            }
          }
        }
        
        // Add outro content
        if (post.content_outro && post.content_outro.trim()) {
          blocks.push({ type: 'text', value: post.content_outro });
        }
        
        // Update post with blocks
        await db.execute(
          `UPDATE blog_posts SET content_blocks = ? WHERE id = ?`,
          [JSON.stringify(blocks), post.id]
        );
      }
      console.log('✅ Đã chuyển đổi dữ liệu các bài viết cũ sang cấu trúc block mới!');
    }

    console.log('🎉 Hoàn thành nâng cấp database!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi nâng cấp database:', error);
    process.exit(1);
  }
}

upgradeDatabase();
