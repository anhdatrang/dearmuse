const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const db = require('../config/db');
const faceService = require('../services/faceService');

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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
    cb(null, filename);
  }
});
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

    req.flash('success', `Đang tải lên và xử lý ${req.files.length} ảnh trong nền. Quá trình này sẽ mất vài phút, bạn có thể tải lại trang (F5) để xem tiến độ.`);
    res.redirect(`/admin/albums/${albumId}/photos`);

    // Chạy ngầm xử lý ảnh để tránh lỗi 504 Gateway Timeout của Cloudflare
    (async () => {
      let ok = 0;
      for (let file of req.files) {
        try {
          const originalPath = file.path;
          const filename = file.filename;
          const thumbPath = path.join(thumbDir, filename);

          // Tạo bản thu nhỏ (Thumbnail) để web mượt
          await sharp(originalPath)
            .resize({ width: 600 })
            .jpeg({ quality: 70 })
            .toFile(thumbPath);

          const originalUrl = `/uploads/albums/${filename}`;
          const thumbnailUrl = `/uploads/albums/thumbs/${filename}`;
          const [result] = await db.query(`
            INSERT INTO album_images (album_id, original_url, thumbnail_url, file_name, file_size)
            VALUES (?, ?, ?, ?, ?)
          `, [albumId, originalUrl, thumbnailUrl, file.originalname, file.size]);

          const imageId = result.insertId;
          
          // Chạy AI nhận diện khuôn mặt
          await faceService.processImageFaces(imageId, thumbPath);
          ok++;
        } catch (e) {
          console.error("Lỗi xử lý ảnh chạy nền:", e);
        }
      }
      console.log(`✅ Hoàn tất upload và AI cho ${ok}/${req.files.length} ảnh của album ${albumId}`);
    })();
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

exports.reprocessFaces = async (req, res) => {
  const albumId = req.params.id;
  try {
    const [albums] = await db.query('SELECT * FROM customer_albums WHERE id = ?', [albumId]);
    if (albums.length === 0) return res.redirect('/admin/customers');

    const [photos] = await db.query('SELECT * FROM album_images WHERE album_id = ?', [albumId]);
    
    // Xóa descriptors cũ của album này trước
    const photoIds = photos.map(p => p.id);
    if (photoIds.length > 0) {
      await db.query('DELETE FROM face_descriptors WHERE image_id IN (?)', [photoIds]);
    }

    req.flash('success', `Đang xử lý AI cho ${photos.length} ảnh... (chạy nền, mất vài phút)`);
    res.redirect(`/admin/albums/${albumId}/photos`);

    // Chạy ngầm sau khi redirect
    (async () => {
      let ok = 0, fail = 0;
      for (const photo of photos) {
        try {
          const thumbPath = path.join(__dirname, '../public', photo.thumbnail_url);
          await faceService.processImageFaces(photo.id, thumbPath);
          ok++;
        } catch (e) {
          fail++;
          console.error(`AI reprocess error for image ${photo.id}:`, e.message);
        }
      }
      console.log(`✅ Reprocess xong album ${albumId}: ${ok} OK, ${fail} lỗi`);
    })();

  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi xử lý lại AI');
    res.redirect(`/admin/albums/${albumId}/photos`);
  }
};
