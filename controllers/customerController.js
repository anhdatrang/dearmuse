const db = require('../config/db');
const { ZipArchive } = require('archiver');
const path = require('path');
const fs = require('fs');
const faceService = require('../services/faceService');

exports.dashboard = async (req, res) => {
  const userId = req.session.userId;
  try {
    const [albums] = await db.query(`
      SELECT ca.*, (SELECT COUNT(*) FROM album_images ai WHERE ai.album_id = ca.id) as photo_count,
             (SELECT thumbnail_url FROM album_images ai WHERE ai.album_id = ca.id LIMIT 1) as cover_thumb
      FROM customer_albums ca WHERE user_id = ? ORDER BY created_at DESC
    `, [userId]);

    res.render('customer/dashboard', {
      title: 'Bộ Ảnh Của Tôi - Dear Musé',
      albums
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
};

exports.albumDetail = async (req, res) => {
  const userId = req.session.userId;
  const albumId = req.params.id;

  try {
    const [albums] = await db.query('SELECT * FROM customer_albums WHERE id = ? AND user_id = ?', [albumId, userId]);
    if (albums.length === 0) return res.status(404).render('404');

    const [photos] = await db.query('SELECT * FROM album_images WHERE album_id = ? ORDER BY uploaded_at ASC', [albumId]);

    res.render('customer/album-detail', {
      title: `${albums[0].title} - Dear Musé`,
      album: albums[0],
      photos
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
};

exports.downloadAlbum = async (req, res) => {
  const userId = req.session.userId;
  const albumId = req.params.id;

  try {
    const [albums] = await db.query('SELECT * FROM customer_albums WHERE id = ? AND user_id = ?', [albumId, userId]);
    if (albums.length === 0) return res.status(403).send('Không có quyền truy cập');

    const [photos] = await db.query('SELECT * FROM album_images WHERE album_id = ?', [albumId]);
    if (photos.length === 0) return res.status(404).send('Album trống');

    // Mức nén = 0 (Chỉ đóng gói, không nén lại). Do ảnh JPG/PNG đã nén sẵn, nén thêm chỉ làm treo CPU VPS mà không giảm được dung lượng.
    const archive = new ZipArchive({ zlib: { level: 0 }, store: true });

    res.attachment(`${albums[0].title.replace(/\s+/g, '_')}_DearMuse.zip`);
    archive.pipe(res);

    for (const photo of photos) {
      const filePath = path.join(__dirname, '../public', photo.original_url);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: photo.file_name || path.basename(filePath) });
      }
    }

    await archive.finalize();
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
};

exports.myBookings = async (req, res) => {
  const userId = req.session.userId;
  try {
    const Booking = require('../models/Booking');
    const bookings = await Booking.findByUserId(userId);

    res.render('customer/bookings', {
      title: 'Lịch sử đặt lịch - Dear Musé',
      bookings,
      activeTab: 'my-bookings'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
};

exports.filterFace = async (req, res) => {
  const albumId = req.params.id;
  const userId = req.session.userId;
  
  if (!req.file) return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ảnh' });

  try {
    const [albums] = await db.query('SELECT id FROM customer_albums WHERE id = ? AND user_id = ?', [albumId, userId]);
    if (albums.length === 0) return res.status(403).json({ success: false, message: 'Không có quyền' });

    const result = await faceService.findMatchingImages(req.file.buffer, albumId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

exports.downloadCustom = async (req, res) => {
  const albumId = req.params.id;
  const userId = req.session.userId;
  // Parse array of imageIds from body
  let imageIds = req.body.imageIds;
  if (typeof imageIds === 'string') {
    imageIds = imageIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
  } else if (!Array.isArray(imageIds)) {
    imageIds = [imageIds];
  }

  try {
    const [albums] = await db.query('SELECT * FROM customer_albums WHERE id = ? AND user_id = ?', [albumId, userId]);
    if (albums.length === 0) return res.status(403).send('Không có quyền truy cập');

    if (!imageIds || imageIds.length === 0) {
      return res.status(400).send('Không có ảnh nào được chọn');
    }

    const [photos] = await db.query('SELECT * FROM album_images WHERE album_id = ? AND id IN (?)', [albumId, imageIds]);
    if (photos.length === 0) return res.status(404).send('Không tìm thấy ảnh');

    const archive = new ZipArchive({ zlib: { level: 0 }, store: true });
    res.attachment(`${albums[0].title.replace(/\s+/g, '_')}_Selected_DearMuse.zip`);
    archive.pipe(res);

    for (const photo of photos) {
      const filePath = path.join(__dirname, '../public', photo.original_url);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: photo.file_name || path.basename(filePath) });
      }
    }

    await archive.finalize();
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
};

// ==========================================
// LOYALTY SYSTEM UI CONTROLLERS
// ==========================================

exports.createCard = async (req, res) => {
  try {
    const LoyaltyService = require('../services/loyaltyService');
    const { full_name, dob } = req.body;
    
    if (!full_name || !dob) {
      req.flash('error', 'Vui lòng điền đầy đủ thông tin');
      return res.redirect('/loyalty');
    }

    // Auto-generate ID card: DM + Year + Random 6 digits (e.g. DM26492318)
    const year = new Date().getFullYear().toString().slice(-2);
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const id_card = `DM${year}${randomDigits}`;

    const member = await LoyaltyService.ensureMember(req.session.userId);
    
    if (member.is_card_active) {
      req.flash('error', 'Thẻ của bạn đã được kích hoạt từ trước');
      return res.redirect('/customer/my-card');
    }
    
    // Update member info and activate card
    await db.query(`
      UPDATE members 
      SET full_name = ?, dob = ?, id_card = ?, is_card_active = 1
      WHERE id = ?
    `, [full_name, dob, id_card, member.id]);

    // Give 30 points for creating card
    await LoyaltyService.addManhSang(member.id, 30, 'register_bonus', 'Mở thẻ thành viên thành công');

    req.flash('success', 'Tạo thẻ thành viên thành công! Bạn nhận được 30 Mảnh Sáng.');
    res.redirect('/customer/my-card');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi khi tạo thẻ: ' + err.message);
    res.redirect('/loyalty');
  }
};

exports.myCard = async (req, res) => {
  try {
    const LoyaltyService = require('../services/loyaltyService');
    const member = await LoyaltyService.ensureMember(req.session.userId);
    
    res.render('customer/loyalty/my-card', {
      title: 'Thẻ Của Tôi - Dear Musé',
      member,
      activeTab: 'my-card'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
};

exports.redeem = async (req, res) => {
  try {
    const LoyaltyService = require('../services/loyaltyService');
    const member = await LoyaltyService.ensureMember(req.session.userId);
    
    const [vouchers] = await db.query('SELECT * FROM vouchers WHERE is_active = 1 AND voucher_type = "redeem"');
    const [myVouchers] = await db.query(
      `SELECT mv.*, v.name, v.discount_type, v.discount_value 
       FROM member_vouchers mv 
       JOIN vouchers v ON mv.voucher_id = v.id 
       WHERE mv.member_id = ? ORDER BY mv.created_at DESC`,
      [member.id]
    );

    res.render('customer/loyalty/redeem', {
      title: 'Đổi Quà - Dear Musé',
      member,
      vouchers,
      myVouchers,
      activeTab: 'redeem'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
};

exports.loyaltyHistory = async (req, res) => {
  try {
    const LoyaltyService = require('../services/loyaltyService');
    const member = await LoyaltyService.ensureMember(req.session.userId);
    
    const [transactions] = await db.query(
      'SELECT * FROM manh_sang_transactions WHERE member_id = ? ORDER BY created_at DESC LIMIT 50',
      [member.id]
    );

    res.render('customer/loyalty/history', {
      title: 'Lịch Sử Điểm - Dear Musé',
      member,
      transactions,
      activeTab: 'history'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
};
