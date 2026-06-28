const db = require('../config/db');

async function reseedBlogBlocks() {
  try {
    console.log('🔄 Đang cập nhật nội dung khối cho 2 bài viết mẫu...');

    // 1. Post 1: Khai Trương Studio Mới Tại Hà Nội
    const post1Blocks = [
      {
        type: 'text',
        value: 'Dear Musé chính thức khai trương chi nhánh mới tại trung tâm Hà Nội với không gian thiết kế độc đáo và tràn ngập ánh sáng tự nhiên.'
      },
      {
        type: 'heading',
        value: 'Không Gian Tối Giản Và Tinh Tế'
      },
      {
        type: 'text',
        value: 'Chúng tôi vô cùng tự hào được giới thiệu không gian làm việc và sáng tạo mới của Dear Musé. Với mục tiêu mang lại những bộ ảnh cưới, chân dung nghệ thuật và thời trang đỉnh cao, không gian studio mới được thiết kế tối giản, tinh tế, sử dụng ánh sáng trời tự nhiên phối hợp cùng các thiết bị đèn hiện đại.'
      },
      {
        type: 'image',
        value: '/source/Nàng thơ/Xanh Xanh 002.JPG',
        blockId: 'seeded_p1_img1'
      },
      {
        type: 'quote',
        value: 'Ánh sáng tự nhiên là linh hồn của nhiếp ảnh, và chúng tôi kiến tạo không gian này để tôn vinh điều đó.'
      },
      {
        type: 'text',
        value: 'Cảm ơn quý khách hàng và các đối tác đã luôn đồng hành cùng chúng tôi. Nhân dịp khai trương, Dear Musé gửi tặng chương trình ưu đãi 15% cho tất cả các gói chụp đặt lịch trong tháng này.'
      }
    ];

    // 2. Post 2: Nàng Thơ Thanh Xuân — Concept Outdoor
    const post2Blocks = [
      {
        type: 'text',
        value: 'Bộ ảnh ngoại cảnh nhẹ nhàng lưu giữ nét thanh xuân trong trẻo của Khánh Linh và Minh Trí tại vườn hoa Nhật Tân, Hà Nội.'
      },
      {
        type: 'quote',
        value: 'Tuổi thanh xuân giống như một cơn mưa rào, dù có cảm lạnh bạn vẫn muốn được đắm mình trong nó lần nữa.'
      },
      {
        type: 'heading',
        value: 'Khoảnh Khắc Dưới Nắng Chiều Hoàng Hôn'
      },
      {
        type: 'text',
        value: 'Concept ngoại cảnh hướng tới sự tự nhiên, mộc mạc và giàu chất thơ. Dưới ánh nắng chiều hoàng hôn nhẹ nhàng, từng biểu cảm, nụ cười và khoảnh khắc hồn nhiên của nàng thơ đều được bắt trọn một cách tinh tế nhất.'
      },
      {
        type: 'image',
        value: '/source/Nàng thơ/Hướng dương 001_.jpeg',
        blockId: 'seeded_p2_img1'
      },
      {
        type: 'text',
        value: 'Sự kết hợp hoàn hảo giữa ánh sáng tự nhiên và nụ cười rạng rỡ đã tạo nên những thước phim đầy cảm xúc.'
      },
      {
        type: 'image',
        value: '/source/Nàng thơ/Xanh Xanh 002.JPG',
        blockId: 'seeded_p2_img2'
      },
      {
        type: 'image',
        value: '/source/Nàng thơ/Quả chanh 001.JPG',
        blockId: 'seeded_p2_img3'
      },
      {
        type: 'text',
        value: 'Cảm ơn Khánh Linh và Minh Trí đã tin tưởng lựa chọn Dear Musé để cùng vẽ nên câu chuyện thanh xuân tuyệt đẹp này.'
      }
    ];

    // Update Post 1
    await db.execute(
      `UPDATE blog_posts SET content_blocks = ?, quote = ? WHERE slug = ?`,
      [JSON.stringify(post1Blocks), post1Blocks[4].value, 'khai-truong-studio-moi-tai-ha-noi']
    );
    console.log('✅ Đã cập nhật bài viết: Khai Trương Studio Mới Tại Hà Nội');

    // Update Post 2
    await db.execute(
      `UPDATE blog_posts SET content_blocks = ?, quote = ? WHERE slug = ?`,
      [JSON.stringify(post2Blocks), post2Blocks[1].value, 'nang-tho-thanh-xuan-concept-outdoor']
    );
    console.log('✅ Đã cập nhật bài viết: Nàng Thơ Thanh Xuân — Concept Outdoor');

    console.log('🎉 Hoàn thành cập nhật 2 bài viết mẫu!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi cập nhật bài viết mẫu:', error);
    process.exit(1);
  }
}

reseedBlogBlocks();
