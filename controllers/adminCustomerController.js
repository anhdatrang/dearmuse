const db = require('../config/db');

exports.listCustomers = async (req, res) => {
  try {
    const [users] = await db.query('SELECT * FROM users ORDER BY created_at DESC');
    res.render('admin/customers/index', {
      title: 'Quản lý Khách Hàng',
      layout: 'layouts/admin', // assume admin layout
      users
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
};

exports.customerAlbums = async (req, res) => {
  const userId = req.params.id;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) return res.status(404).send('Không tìm thấy KH');
    
    const [albums] = await db.query(`
      SELECT ca.*, (SELECT COUNT(*) FROM album_images ai WHERE ai.album_id = ca.id) as photo_count
      FROM customer_albums ca WHERE user_id = ? ORDER BY created_at DESC
    `, [userId]);

    res.render('admin/customers/albums', {
      title: 'Album của Khách Hàng',
      layout: 'layouts/admin',
      user: users[0],
      albums
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
};

exports.createAlbum = async (req, res) => {
  const { user_id, title, description, status, shoot_date } = req.body;
  try {
    await db.query(`
      INSERT INTO customer_albums (user_id, title, description, status, shoot_date)
      VALUES (?, ?, ?, ?, ?)
    `, [user_id, title, description, status, shoot_date || null]);
    req.flash('success', 'Đã tạo album mới');
    res.redirect(`/admin/customers/${user_id}/albums`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi tạo album');
    res.redirect(`/admin/customers/${user_id}/albums`);
  }
};

exports.updateAlbumStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const [albums] = await db.query('SELECT user_id FROM customer_albums WHERE id = ?', [id]);
    if (albums.length === 0) return res.status(404).send('Không tìm thấy Album');

    await db.query('UPDATE customer_albums SET status = ? WHERE id = ?', [status, id]);
    req.flash('success', 'Đã cập nhật trạng thái album');
    res.redirect(`/admin/customers/${albums[0].user_id}/albums`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi cập nhật');
    res.redirect('/admin/customers');
  }
};

exports.deleteAlbum = async (req, res) => {
  const { id } = req.params;
  const fs = require('fs').promises;
  const path = require('path');
  try {
    const [albums] = await db.query('SELECT user_id FROM customer_albums WHERE id = ?', [id]);
    if (albums.length === 0) return res.redirect('/admin/customers');
    
    // Xóa file ảnh trên disk
    const [photos] = await db.query('SELECT original_url, thumbnail_url FROM album_images WHERE album_id = ?', [id]);
    for (const p of photos) {
      try { await fs.unlink(path.join(__dirname, '../public', p.original_url)); } catch (e) {}
      try { await fs.unlink(path.join(__dirname, '../public', p.thumbnail_url)); } catch (e) {}
    }
    
    // DB cascade delete sẽ tự xóa records trong album_images
    await db.query('DELETE FROM customer_albums WHERE id = ?', [id]);
    req.flash('success', 'Đã xóa toàn bộ Album và ảnh');
    res.redirect(`/admin/customers/${albums[0].user_id}/albums`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi xóa album');
    res.redirect('/admin/customers');
  }
};
