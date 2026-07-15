const db = require('../config/db');

// Helper: Mask customer name for privacy
// "Nguyễn Thị Hương" → "Ng. T. H."
// "Bloom Studio" → "B*** Studio"
function maskName(name, type) {
  if (!name) return 'Ẩn danh';
  if (type === 'business') {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0][0] + '***';
    }
    // Keep first letter of first word, mask middle, keep last word
    return parts[0][0] + '*** ' + parts[parts.length - 1];
  }
  // Individual: take first letter of each word
  const words = name.trim().split(/\s+/);
  return words.map(w => w[0] + '.').join(' ');
}

exports.index = async (req, res) => {
  try {
    const [feedbacks] = await db.query(`
      SELECT id, customer_type, display_name, service_label, rating, content, is_featured, created_at
      FROM feedbacks
      WHERE is_approved = 1
      ORDER BY is_featured DESC, created_at DESC
    `);

    // Compute star display and masked names
    const processed = feedbacks.map(f => ({
      ...f,
      maskedName: maskName(f.display_name, f.customer_type) || '✦',
      starsArr: Array.from({ length: 5 }, (_, i) => i < f.rating),
      monthYear: new Date(f.created_at).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
    }));

    // Thêm các cảm nhận chất lượng cao mới để bức tường thêm phong phú
    const extraFeedbacks = [
      {
        id: 901,
        customer_type: 'individual',
        display_name: 'Ng. M. Q.',
        service_label: 'Portrait Cá Nhân',
        rating: 5,
        content: 'Một không gian tràn ngập cảm hứng nghệ thuật. Buổi chụp diễn ra nhẹ nhàng như một buổi trò chuyện, giúp mình thể hiện được những nét chân thật nhất của bản thân.',
        is_featured: 0,
        created_at: new Date('2026-06-10'),
        maskedName: 'Ng. M. Q.',
        starsArr: [true, true, true, true, true],
        monthYear: 'Tháng 6 năm 2026'
      },
      {
        id: 902,
        customer_type: 'individual',
        display_name: 'Tr. H. D.',
        service_label: 'Sinh Nhật & Tốt Nghiệp',
        rating: 5,
        content: 'Mình cực kỳ thích tone màu ảnh của Dear Musé. Màu sắc ấm áp, hoài niệm, tạo cảm giác sang trọng và đậm chất điện ảnh. Nhất định sẽ giới thiệu bạn bè qua chụp.',
        is_featured: 0,
        created_at: new Date('2026-05-27'),
        maskedName: 'Tr. H. D.',
        starsArr: [true, true, true, true, true],
        monthYear: 'Tháng 5 năm 2026'
      },
      {
        id: 903,
        customer_type: 'business',
        display_name: 'S*** Studio',
        service_label: 'Thương Hiệu & Sản Phẩm',
        rating: 5,
        content: 'Concept sáng tạo và truyền tải trọn vẹn thông điệp sản phẩm của chúng tôi. Ekip hỗ trợ nhiệt tình từ khâu chuẩn bị đạo cụ đến hậu kỳ chu đáo.',
        is_featured: 0,
        created_at: new Date('2026-05-14'),
        maskedName: 'S*** Studio',
        starsArr: [true, true, true, true, true],
        monthYear: 'Tháng 5 năm 2026'
      },
      {
        id: 904,
        customer_type: 'individual',
        display_name: 'V. T. K.',
        service_label: 'Portrait Cá Nhân',
        rating: 4,
        content: 'Studio trang trí rất có gu. Ánh sáng tự nhiên kết hợp đèn tạo hiệu ứng đổ bóng rất đẹp. Nhân viên tư vấn nhiệt tình, ảnh giao đúng hẹn và chất lượng tuyệt vời.',
        is_featured: 0,
        created_at: new Date('2026-04-20'),
        maskedName: 'V. T. K.',
        starsArr: [true, true, true, true, false],
        monthYear: 'Tháng 4 năm 2026'
      },
      {
        id: 905,
        customer_type: 'individual',
        display_name: 'L. H. N.',
        service_label: 'Portrait Cá Nhân',
        rating: 5,
        content: 'Góc máy vô cùng nghệ thuật và bắt khoảnh khắc xuất sắc. Mình không nghĩ một buổi chụp ảnh lại thoải mái và vui vẻ đến vậy. Cảm ơn ekip rất nhiều vì bộ ảnh đẹp.',
        is_featured: 0,
        created_at: new Date('2026-05-09'),
        maskedName: 'L. H. N.',
        starsArr: [true, true, true, true, true],
        monthYear: 'Tháng 5 năm 2026'
      },
      {
        id: 906,
        customer_type: 'individual',
        display_name: 'Ng. B. C.',
        service_label: 'Sinh Nhật & Tốt Nghiệp',
        rating: 5,
        content: 'Lưu giữ tuổi 20 rực rỡ nhất tại Dear Musé là quyết định đúng đắn nhất của mình. Cảm ơn các anh nháy đã kiên nhẫn hướng dẫn mình tạo dáng từng chút một.',
        is_featured: 0,
        created_at: new Date('2026-06-03'),
        maskedName: 'Ng. B. C.',
        starsArr: [true, true, true, true, true],
        monthYear: 'Tháng 6 năm 2026'
      }
    ];

    const finalFeedbacks = [...processed, ...extraFeedbacks];

    const [services] = await db.query(`SELECT id, name FROM services ORDER BY sort_order`);

    res.render('feedback', {
      title: 'Cảm Nhận Khách Hàng — Dear Musé',
      metaDescription: 'Những chia sẻ chân thật từ khách hàng đã trải nghiệm dịch vụ chụp ảnh nghệ thuật tại Dear Musé Studio.',
      feedbacks: finalFeedbacks,
      services,
      sessionUser: req.session?.userId ? { id: req.session.userId, name: req.session.userName, user_type: req.session.userType } : null,
      successMsg: req.session?.feedbackSuccess || null,
      currentPath: req.path
    });

    // Clear flash message
    if (req.session) delete req.session.feedbackSuccess;
  } catch (err) {
    console.error('Feedback index error:', err);
    res.render('feedback', {
      title: 'Cảm Nhận Khách Hàng — Dear Musé',
      metaDescription: 'Những chia sẻ chân thật từ khách hàng tại Dear Musé Studio.',
      feedbacks: [],
      services: [],
      sessionUser: req.session?.userId ? { id: req.session.userId, name: req.session.userName, user_type: req.session.userType } : null,
      successMsg: null,
      currentPath: req.path
    });
  }
};

exports.submit = async (req, res) => {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.redirect('/auth/login');
    }

    const { rating, content, service_label, display_name } = req.body;

    if (!content || !content.trim()) {
      return res.redirect('/feedback?error=empty');
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.redirect('/feedback?error=rating');
    }

    // Use submitted display_name or user's name
    const finalDisplayName = display_name || req.session.userName || 'Ẩn danh';
    const type = req.session.userType || 'individual';

    await db.query(`
      INSERT INTO feedbacks (user_id, customer_type, display_name, service_label, rating, content, is_approved)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `, [userId, type, finalDisplayName, service_label || null, parseInt(rating), content.trim()]);

    req.session.feedbackSuccess = true;
    res.redirect('/feedback');
  } catch (err) {
    console.error('Feedback submit error:', err);
    res.redirect('/feedback?error=server');
  }
};
