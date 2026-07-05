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
      maskedName: f.display_name || '✦',
      starsArr: Array.from({ length: 5 }, (_, i) => i < f.rating),
      monthYear: new Date(f.created_at).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
    }));

    const [services] = await db.query(`SELECT id, name FROM services ORDER BY sort_order`);

    res.render('feedback', {
      title: 'Cảm Nhận Khách Hàng — Dear Musé',
      metaDescription: 'Những chia sẻ chân thật từ khách hàng đã trải nghiệm dịch vụ chụp ảnh nghệ thuật tại Dear Musé Studio.',
      feedbacks: processed,
      services,
      sessionUser: req.session?.user || null,
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
      sessionUser: req.session?.user || null,
      successMsg: null,
      currentPath: req.path
    });
  }
};

exports.submit = async (req, res) => {
  try {
    const user = req.session?.user;
    if (!user) {
      return res.redirect('/auth/login');
    }

    const { rating, content, service_label, customer_type } = req.body;

    if (!content || !content.trim()) {
      return res.redirect('/feedback?error=empty');
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.redirect('/feedback?error=rating');
    }

    // Use stored display_name or user's name
    const displayName = user.name || 'Ẩn danh';
    const type = customer_type || user.user_type || 'individual';

    await db.query(`
      INSERT INTO feedbacks (user_id, customer_type, display_name, service_label, rating, content, is_approved)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `, [user.id, type, displayName, service_label || null, parseInt(rating), content.trim()]);

    req.session.feedbackSuccess = true;
    res.redirect('/feedback');
  } catch (err) {
    console.error('Feedback submit error:', err);
    res.redirect('/feedback?error=server');
  }
};
