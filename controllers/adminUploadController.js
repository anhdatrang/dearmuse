const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const db = require('../config/db');

// Đảm bảo thư mục upload tồn tại
const uploadDir = path.join(__dirname, '../public/uploads/albums');
const thumbDir = path.join(__dirname, '../public/uploads/albums/thumbs');

const initDirs = async () => {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.mkdir(thumbDir, { recursive: true });
  } catch (err) {
    console.error('Không tạo được thư mục upload:', err);
  }
};
initDirs();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB per file
});

exports.uploadMiddleware = upload.array('photos', 500);

exports.uploadPhotos = async (req, res) => {
  const albumId = req.params.id;
  try {
    const [albums] = await db.query('SELECT user_id FROM customer_albums WHERE id = ?', [albumId]);
    if (albums.length === 0) return res.status(404).send('Không tìm thấy Album');

    if (!req.files || req.files.length === 0) {
      req.flash('error', 'Vui lòng chọn ảnh');
      return res.redirect(`/admin/customers/${albums[0].user_id}/albums`);
    }

    for (let file of req.files) {
      const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
      const originalPath = path.join(uploadDir, filename);
      const thumbPath = path.join(thumbDir, filename);

      // Lưu ĐÚNG BẢN GỐC (không dùng Sharp can thiệp để giữ nguyên chất lượng và dung lượng)
      await fs.writeFile(originalPath, file.buffer);

      // Tạo bản thu nhỏ (Thumbnail) để web mượt
      await sharp(file.buffer)
        .resize({ width: 600 })
        .jpeg({ quality: 70 })
        .toFile(thumbPath);

      const originalUrl = `/uploads/albums/${filename}`;
      const thumbnailUrl = `/uploads/albums/thumbs/${filename}`;
      await db.query(`
        INSERT INTO album_images (album_id, original_url, thumbnail_url, file_name, file_size)
        VALUES (?, ?, ?, ?, ?)
      `, [albumId, originalUrl, thumbnailUrl, file.originalname, file.size]);
    }

    req.flash('success', `Đã tải lên ${req.files.length} ảnh`);
    res.redirect(`/admin/customers/${albums[0].user_id}/albums`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi upload ảnh');
    res.redirect('back');
  }
};

exports.managePhotos = async (req, res) => {
  const albumId = req.params.id;
  try {
    const [albums] = await db.query('SELECT * FROM customer_albums WHERE id = ?', [albumId]);
    if (albums.length === 0) return res.status(404).send('Không tìm thấy Album');

    const [photos] = await db.query('SELECT * FROM album_images WHERE album_id = ? ORDER BY uploaded_at DESC', [albumId]);

    res.render('admin/customers/album-photos', {
      title: `Quản lý ảnh: ${albums[0].title}`,
      layout: 'layouts/admin',
      album: albums[0],
      photos
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
};

exports.deletePhoto = async (req, res) => {
  const { id, photoId } = req.params;
  try {
    const [photos] = await db.query('SELECT * FROM album_images WHERE id = ? AND album_id = ?', [photoId, id]);
    if (photos.length > 0) {
      const photo = photos[0];
      try { await fs.unlink(path.join(__dirname, '../public', photo.original_url)); } catch (e) {}
      try { await fs.unlink(path.join(__dirname, '../public', photo.thumbnail_url)); } catch (e) {}
      await db.query('DELETE FROM album_images WHERE id = ?', [photoId]);
    }
    req.flash('success', 'Đã xoá ảnh');
    res.redirect(`/admin/albums/${id}/photos`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi xoá ảnh');
    res.redirect(`/admin/albums/${id}/photos`);
  }
};
