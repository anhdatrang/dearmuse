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
exports.uploadSingleMiddleware = upload.single('editedPhoto');

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

    const [editRequests] = await db.query(`
      SELECT per.*, ai.original_url as orig_url, ai.thumbnail_url as orig_thumb, ai.file_name
      FROM photo_edit_requests per
      JOIN album_images ai ON per.image_id = ai.id
      WHERE per.album_id = ?
    `, [albumId]);

    res.render('admin/customers/album-photos', {
      title: `Quản lý ảnh: ${albums[0].title}`,
      layout: 'layouts/admin',
      album: albums[0],
      photos,
      editRequests
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

exports.downloadRequestedPhotos = async (req, res) => {
  const albumId = req.params.id;
  try {
    const [albums] = await db.query('SELECT * FROM customer_albums WHERE id = ?', [albumId]);
    if (albums.length === 0) return res.status(404).send('Không tìm thấy Album');

    const [requests] = await db.query(`
      SELECT per.*, ai.original_url, ai.file_name
      FROM photo_edit_requests per
      JOIN album_images ai ON per.image_id = ai.id
      WHERE per.album_id = ?
    `, [albumId]);

    if (requests.length === 0) {
      return res.status(404).send('Album này không có ảnh yêu cầu chỉnh sửa nào.');
    }

    const { ZipArchive } = require('archiver');
    const archive = new ZipArchive({ zlib: { level: 0 }, store: true });

    const zipName = `${albums[0].title.replace(/\s+/g, '_')}_YeuCauSua.zip`;
    res.attachment(zipName);
    archive.pipe(res);

    const fsSync = require('fs');
    for (const r of requests) {
      const filePath = path.join(__dirname, '../public', r.original_url);
      if (fsSync.existsSync(filePath)) {
        archive.file(filePath, { name: r.file_name || path.basename(filePath) });
      }
    }

    await archive.finalize();
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server khi tải ảnh yêu cầu');
  }
};

exports.uploadEditedPhotosBatch = async (req, res) => {
  const albumId = req.params.id;
  try {
    const [albums] = await db.query('SELECT user_id FROM customer_albums WHERE id = ?', [albumId]);
    if (albums.length === 0) {
      req.flash('error', 'Không tìm thấy Album');
      return res.redirect('back');
    }

    if (!req.files || req.files.length === 0) {
      req.flash('error', 'Vui lòng chọn các ảnh đã chỉnh sửa để tải lên.');
      return res.redirect('back');
    }

    const [requests] = await db.query(`
      SELECT per.id as request_id, ai.file_name, ai.id as image_id
      FROM photo_edit_requests per
      JOIN album_images ai ON per.image_id = ai.id
      WHERE per.album_id = ?
    `, [albumId]);

    if (requests.length === 0) {
      req.flash('error', 'Album này không có yêu cầu chỉnh sửa nào từ khách hàng.');
      return res.redirect('back');
    }

    // Helper functions for matching filenames
    const getBase = (fn) => path.basename(fn, path.extname(fn)).toLowerCase();
    const cleanBase = (base) => base.replace(/(_edited|_edit|-edited|-edit|_v\d+|-v\d+)/gi, '').trim();

    // Track matched request IDs
    const matchedRequestIds = new Set();

    for (const file of req.files) {
      const fileBase = getBase(file.originalname);
      const fileClean = cleanBase(fileBase);

      // 1. Try exact cleaned name match
      let matched = requests.find(r => {
        if (matchedRequestIds.has(r.request_id)) return false;
        const rBase = getBase(r.file_name || '');
        const rClean = cleanBase(rBase);
        return rClean === fileClean;
      });

      // 2. Try substring match
      if (!matched) {
        matched = requests.find(r => {
          if (matchedRequestIds.has(r.request_id)) return false;
          const rBase = getBase(r.file_name || '');
          const rClean = cleanBase(rBase);
          return fileClean.includes(rClean) || rClean.includes(fileClean);
        });
      }

      // 3. Fallback to first unmatched request
      if (!matched) {
        matched = requests.find(r => !matchedRequestIds.has(r.request_id));
      }

      if (matched) {
        matchedRequestIds.add(matched.request_id);

        const originalPath = file.path;
        const filename = file.filename;
        const thumbPath = path.join(thumbDir, filename);

        // Generate thumbnail
        await sharp(originalPath)
          .resize({ width: 600 })
          .jpeg({ quality: 70 })
          .toFile(thumbPath);

        const editedUrl = `/uploads/albums/${filename}`;
        const editedThumbnailUrl = `/uploads/albums/thumbs/${filename}`;

        await db.query(`
          UPDATE photo_edit_requests
          SET edited_url = ?, edited_thumbnail_url = ?
          WHERE id = ?
        `, [editedUrl, editedThumbnailUrl, matched.request_id]);
      }
    }

    req.flash('success', `Đã tải lên và tự động phân bổ thành công các ảnh chỉnh sửa.`);
    res.redirect(`/admin/albums/${albumId}/photos`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi server khi tải lên hàng loạt ảnh đã sửa.');
    res.redirect('back');
  }
};

exports.uploadSingleEditedPhoto = async (req, res) => {
  const { id, requestId } = req.params;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Không có file tải lên.' });
    }

    const originalPath = req.file.path;
    const filename = req.file.filename;
    const thumbPath = path.join(thumbDir, filename);

    // Create thumbnail
    await sharp(originalPath)
      .resize({ width: 600 })
      .jpeg({ quality: 70 })
      .toFile(thumbPath);

    const editedUrl = `/uploads/albums/${filename}`;
    const editedThumbnailUrl = `/uploads/albums/thumbs/${filename}`;

    await db.query(`
      UPDATE photo_edit_requests
      SET edited_url = ?, edited_thumbnail_url = ?
      WHERE id = ? AND album_id = ?
    `, [editedUrl, editedThumbnailUrl, requestId, id]);

    res.json({
      success: true,
      message: 'Thay thế ảnh chỉnh sửa thành công.',
      editedUrl,
      editedThumbnailUrl
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server khi thay thế ảnh.' });
  }
};

exports.completeEditRequest = async (req, res) => {
  const albumId = req.params.id;
  try {
    const [albums] = await db.query('SELECT user_id, title FROM customer_albums WHERE id = ?', [albumId]);
    if (albums.length === 0) return res.status(404).send('Không tìm thấy Album');

    const [pendingPhotos] = await db.query('SELECT id FROM photo_edit_requests WHERE album_id = ? AND edited_url IS NULL', [albumId]);
    if (pendingPhotos.length > 0) {
      req.flash('error', `Vui lòng tải lên ảnh đã sửa cho toàn bộ ảnh yêu cầu trước khi bấm hoàn tất. (Còn ${pendingPhotos.length} ảnh chưa tải)`);
      return res.redirect('back');
    }

    await db.query(`UPDATE customer_albums SET edit_status = 'completed', status = 'completed' WHERE id = ?`, [albumId]);

    // Gửi thông báo cá nhân cho khách hàng
    await db.query(`
      INSERT INTO user_notifications (user_id, title, content)
      VALUES (?, ?, ?)
    `, [albums[0].user_id, 'Ảnh đã chỉnh sửa hoàn tất', `Bộ ảnh chỉnh sửa cho Album "${albums[0].title}" đã hoàn tất! Hãy kiểm tra và tải về ngay.`]);

    req.flash('success', 'Đã hoàn tất chỉnh sửa và gửi ảnh cho khách hàng!');
    res.redirect(`/admin/albums/${albumId}/photos`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi khi hoàn tất chỉnh sửa');
    res.redirect('back');
  }
};
