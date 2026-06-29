const db = require('../config/db');
const { ZipArchive } = require('archiver');
const path = require('path');
const fs = require('fs');

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
