const db = require('../config/db');

async function reseedBlogGrids() {
  try {
    console.log('🔄 Đang cập nhật cấu trúc lưới ảnh động (Dynamic Image Grids) cho 2 bài viết mẫu...');

    // 1. Post 1: Khai Trương Studio Mới Tại Hà Nội
    const post1Grids = [
      {
        layout: '1',
        images: ['/source/Nàng thơ/Xanh Xanh 002.JPG'],
        blockId: 'grid_seed1_1'
      }
    ];

    const post1Data = {
      summary: 'Dear Musé chính thức khai trương chi nhánh mới tại trung tâm Hà Nội với không gian thiết kế độc đáo và tràn ngập ánh sáng tự nhiên.',
      content: 'Chúng tôi vô cùng tự hào được giới thiệu không gian làm việc và sáng tạo mới của Dear Musé. Với mục tiêu mang lại những bộ ảnh cưới, chân dung nghệ thuật và thời trang đỉnh cao, không gian studio mới được thiết kế tối giản, tinh tế, sử dụng ánh sáng trời tự nhiên phối hợp cùng các thiết bị đèn hiện đại.',
      content_outro: 'Cảm ơn quý khách hàng và các đối tác đã luôn đồng hành cùng chúng tôi. Nhân dịp khai trương, Dear Musé gửi tặng chương trình ưu đãi 15% cho tất cả các gói chụp đặt lịch trong tháng này.',
      quote: 'Ánh sáng tự nhiên là linh hồn của nhiếp ảnh, và chúng tôi kiến tạo không gian này để tôn vinh điều đó.',
      content_blocks: JSON.stringify(post1Grids),
      images: JSON.stringify(['/source/Nàng thơ/Xanh Xanh 002.JPG'])
    };

    // 2. Post 2: Nàng Thơ Thanh Xuân — Concept Outdoor
    const post2Grids = [
      {
        layout: '3',
        images: [
          {
            url: '/source/Nàng thơ/Hướng dương 001_.jpeg',
            title: 'Dưới Ánh Mặt Trời Rực Rỡ',
            subtitle: 'Hướng dương nở rộ khoe sắc thắm cùng nàng thơ'
          },
          {
            url: '/source/Nàng thơ/Xanh Xanh 002.JPG',
            title: 'Nụ Cười Thanh Xuân',
            subtitle: 'Những kỷ niệm ngọt ngào được lưu lại'
          },
          {
            url: '/source/Nàng thơ/Quả chanh 001.JPG',
            title: 'Góc Nhìn Trong Trẻo',
            subtitle: 'Concept vintage outdoor mộc mạc tinh tế'
          }
        ],
        blockId: 'grid_seed2_1'
      }
    ];

    const post2Data = {
      summary: 'Bộ ảnh ngoại cảnh nhẹ nhàng lưu giữ nét thanh xuân trong trẻo của Khánh Linh và Minh Trí tại vườn hoa Nhật Tân, Hà Nội.',
      content: 'Concept ngoại cảnh hướng tới sự tự nhiên, mộc mạc và giàu chất thơ. Dưới ánh nắng chiều hoàng hôn nhẹ nhàng, từng biểu cảm, nụ cười và khoảnh khắc hồn nhiên của nàng thơ đều được bắt trọn một cách tinh tế nhất.',
      content_outro: 'Cảm ơn Khánh Linh và Minh Trí đã tin tưởng lựa chọn Dear Musé để cùng vẽ nên câu chuyện thanh xuân tuyệt đẹp này.',
      quote: 'Tuổi thanh xuân giống như một cơn mưa rào, dù có cảm lạnh bạn vẫn muốn được đắm mình trong nó lần nữa.',
      content_blocks: JSON.stringify(post2Grids),
      images: JSON.stringify([
        '/source/Nàng thơ/Hướng dương 001_.jpeg',
        '/source/Nàng thơ/Xanh Xanh 002.JPG',
        '/source/Nàng thơ/Quả chanh 001.JPG'
      ])
    };

    // Update Post 1 in DB
    await db.execute(
      `UPDATE blog_posts 
       SET summary = ?, content = ?, content_outro = ?, quote = ?, content_blocks = ?, images = ?
       WHERE slug = ?`,
      [
        post1Data.summary,
        post1Data.content,
        post1Data.content_outro,
        post1Data.quote,
        post1Data.content_blocks,
        post1Data.images,
        'khai-truong-studio-moi-tai-ha-noi'
      ]
    );
    console.log('✅ Đã cập nhật bài viết: Khai Trương Studio Mới Tại Hà Nội');

    // Update Post 2 in DB
    await db.execute(
      `UPDATE blog_posts 
       SET summary = ?, content = ?, content_outro = ?, quote = ?, content_blocks = ?, images = ?
       WHERE slug = ?`,
      [
        post2Data.summary,
        post2Data.content,
        post2Data.content_outro,
        post2Data.quote,
        post2Data.content_blocks,
        post2Data.images,
        'nang-tho-thanh-xuan-concept-outdoor'
      ]
    );
    console.log('✅ Đã cập nhật bài viết: Nàng Thơ Thanh Xuân — Concept Outdoor');

    console.log('🎉 Hoàn thành cập nhật cấu trúc lưới ảnh cho 2 bài viết mẫu!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi cập nhật bài viết mẫu:', error);
    process.exit(1);
  }
}

reseedBlogGrids();
