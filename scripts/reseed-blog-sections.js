const db = require('../config/db');

async function reseedBlogSections() {
  try {
    console.log('🔄 Đang cập nhật cấu trúc Phân đoạn (Sections) cho 2 bài viết mẫu...');

    // 1. Post 1: Khai Trương Studio Mới Tại Hà Nội
    const post1Sections = [
      {
        heading: 'Không Gian Mới Giữa Lòng Hà Nội',
        subheading: 'Chi nhánh Hoàn Kiếm chính thức mở cửa',
        image: '/source/Nàng thơ/Xanh Xanh 002.JPG',
        text: 'Dear Musé chính thức khai trương chi nhánh mới tại trung tâm Hà Nội với không gian thiết kế độc đáo và tràn ngập ánh sáng tự nhiên. Với mong muốn đem lại trải nghiệm dịch vụ nhiếp ảnh tối ưu, không gian mới đã được chăm chút tỉ mỉ từ những góc nhỏ nhất.',
        layout: 'left_img',
        blockId: 'sec_p1_1'
      },
      {
        heading: 'Tôn Vinh Ánh Sáng Tự Nhiên',
        subheading: 'Thiết kế tối giản và tinh tế',
        image: '',
        text: 'Chúng tôi vô cùng tự hào được giới thiệu không gian làm việc và sáng tạo mới của Dear Musé. Với mục tiêu mang lại những bộ ảnh cưới, chân dung nghệ thuật và thời trang đỉnh cao, không gian studio mới được thiết kế tối giản, tinh tế, sử dụng ánh sáng trời tự nhiên phối hợp cùng các thiết bị đèn hiện đại. Ánh sáng tự nhiên là linh hồn của nhiếp ảnh, và chúng tôi kiến tạo không gian này để tôn vinh điều đó.',
        layout: 'full_img_top',
        blockId: 'sec_p1_2'
      },
      {
        heading: 'Chương Trình Ưu Đãi Khai Trương',
        subheading: 'Món quà gửi tới các nàng thơ',
        image: '/source/Nàng thơ/Quả chanh 001.JPG',
        text: 'Cảm ơn quý khách hàng và các đối tác đã luôn đồng hành cùng chúng tôi. Nhân dịp khai trương, Dear Musé gửi tặng chương trình ưu đãi 15% cho tất cả các gói chụp đặt lịch trong tháng này.',
        layout: 'right_img',
        blockId: 'sec_p1_3'
      }
    ];

    // 2. Post 2: Nàng Thơ Thanh Xuân — Concept Outdoor
    const post2Sections = [
      {
        heading: 'Hồn Thơ Giữa Nắng Chiều',
        subheading: 'Bộ ảnh ngoại cảnh tại vườn hoa Nhật Tân',
        image: '/source/Nàng thơ/Hướng dương 001_.jpeg',
        text: 'Bộ ảnh ngoại cảnh nhẹ nhàng lưu giữ nét thanh xuân trong trẻo của Khánh Linh và Minh Trí tại vườn hoa Nhật Tân, Hà Nội. Dưới ánh nắng chiều hoàng hôn nhẹ nhàng, từng biểu cảm, nụ cười và khoảnh khắc hồn nhiên của nàng thơ đều được bắt trọn một cách tinh tế nhất.',
        layout: 'right_img',
        blockId: 'sec_p2_1'
      },
      {
        heading: 'Nét Thanh Xuân Tinh Khôi',
        subheading: 'Khoảnh khắc đọng lại mãi',
        image: '/source/Nàng thơ/Xanh Xanh 002.JPG',
        text: 'Concept ngoại cảnh hướng tới sự tự nhiên, mộc mạc và giàu chất thơ. Tuổi thanh xuân giống như một cơn mưa rào, dù có cảm lạnh bạn vẫn muốn được đắm mình trong nó lần nữa. Chúng tôi mong muốn mỗi bức ảnh là một trang nhật ký lưu giữ trọn vẹn cảm xúc của tuổi trẻ.',
        layout: 'left_img',
        blockId: 'sec_p2_2'
      },
      {
        heading: 'Sự Tươi Trẻ Của Sắc Vàng',
        subheading: 'Một góc năng lượng khác biệt',
        image: '/source/Nàng thơ/Quả chanh 001.JPG',
        text: 'Kết thúc buổi chụp là những tiếng cười rộn rã và kỷ niệm khó quên. Cảm ơn Khánh Linh và Minh Trí đã tin tưởng lựa chọn Dear Musé để cùng vẽ nên câu chuyện thanh xuân tuyệt đẹp này.',
        layout: 'full_img_bottom',
        blockId: 'sec_p2_3'
      }
    ];

    // Update Post 1
    await db.execute(
      `UPDATE blog_posts SET content_blocks = ?, content = ? WHERE slug = ?`,
      [JSON.stringify(post1Sections), post1Sections[0].text, 'khai-truong-studio-moi-tai-ha-noi']
    );
    console.log('✅ Đã cập nhật Phân đoạn cho bài viết: Khai Trương Studio Mới Tại Hà Nội');

    // Update Post 2
    await db.execute(
      `UPDATE blog_posts SET content_blocks = ?, content = ? WHERE slug = ?`,
      [JSON.stringify(post2Sections), post2Sections[0].text, 'nang-tho-thanh-xuan-concept-outdoor']
    );
    console.log('✅ Đã cập nhật Phân đoạn cho bài viết: Nàng Thơ Thanh Xuân — Concept Outdoor');

    console.log('🎉 Hoàn thành cập nhật Phân đoạn cho 2 bài viết mẫu!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi cập nhật Phân đoạn:', error);
    process.exit(1);
  }
}

reseedBlogSections();
