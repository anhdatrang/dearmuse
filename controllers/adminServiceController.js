const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload dir exists
const uploadDir = path.join(__dirname, '../public/uploads/services');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + ext);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

exports.uploadMiddleware = upload.single('cover_image');

exports.listServices = async (req, res) => {
  try {
    const [services] = await db.query('SELECT * FROM services ORDER BY sort_order ASC, id DESC');
    res.render('admin/services/index', {
      title: 'Quản lý Gói Dịch Vụ',
      layout: 'layouts/admin',
      services
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
};

exports.createServicePage = (req, res) => {
  res.render('admin/services/form', {
    title: 'Thêm Gói Dịch Vụ',
    layout: 'layouts/admin',
    service: {},
    isEdit: false
  });
};

exports.createService = async (req, res) => {
  const { name, slug, description, short_desc, price_from, duration_minutes, is_featured, sort_order } = req.body;
  let features = [];
  if (req.body.features) {
    features = Array.isArray(req.body.features) ? req.body.features : [req.body.features];
    features = features.filter(f => f.trim() !== '');
  }
  
  const cover_image = req.file ? `/uploads/services/${req.file.filename}` : null;
  const isFeat = is_featured === 'on' || is_featured === '1' ? 1 : 0;

  try {
    await db.query(`
      INSERT INTO services (name, slug, description, short_desc, price_from, duration_minutes, cover_image, features, is_featured, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, slug, description, short_desc, price_from || 0, duration_minutes || 0, 
      cover_image, JSON.stringify(features), isFeat, sort_order || 0
    ]);
    req.flash('success', 'Đã thêm gói dịch vụ thành công');
    res.redirect('/admin/services');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi: ' + err.message);
    res.redirect('/admin/services/create');
  }
};

exports.editServicePage = async (req, res) => {
  try {
    const [services] = await db.query('SELECT * FROM services WHERE id = ?', [req.params.id]);
    if (services.length === 0) return res.status(404).send('Không tìm thấy');
    
    // Parse features if string
    let service = services[0];
    if (typeof service.features === 'string') {
      try { service.features = JSON.parse(service.features); } catch(e) { service.features = []; }
    }
    if (!service.features) service.features = [];

    res.render('admin/services/form', {
      title: 'Sửa Gói Dịch Vụ',
      layout: 'layouts/admin',
      service,
      isEdit: true
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server');
  }
};

exports.updateService = async (req, res) => {
  const id = req.params.id;
  const { name, slug, description, short_desc, price_from, duration_minutes, is_featured, sort_order } = req.body;
  
  let features = [];
  if (req.body.features) {
    features = Array.isArray(req.body.features) ? req.body.features : [req.body.features];
    features = features.filter(f => f.trim() !== '');
  }

  const isFeat = is_featured === 'on' || is_featured === '1' ? 1 : 0;

  try {
    if (req.file) {
      const cover_image = `/uploads/services/${req.file.filename}`;
      await db.query(`
        UPDATE services SET name=?, slug=?, description=?, short_desc=?, price_from=?, duration_minutes=?, cover_image=?, features=?, is_featured=?, sort_order=? WHERE id=?
      `, [name, slug, description, short_desc, price_from, duration_minutes, cover_image, JSON.stringify(features), isFeat, sort_order, id]);
    } else {
      await db.query(`
        UPDATE services SET name=?, slug=?, description=?, short_desc=?, price_from=?, duration_minutes=?, features=?, is_featured=?, sort_order=? WHERE id=?
      `, [name, slug, description, short_desc, price_from, duration_minutes, JSON.stringify(features), isFeat, sort_order, id]);
    }
    req.flash('success', 'Đã cập nhật gói dịch vụ');
    res.redirect('/admin/services');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi cập nhật: ' + err.message);
    res.redirect(`/admin/services/${id}/edit`);
  }
};

exports.deleteService = async (req, res) => {
  try {
    await db.query('DELETE FROM services WHERE id = ?', [req.params.id]);
    req.flash('success', 'Đã xóa gói dịch vụ');
    res.redirect('/admin/services');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Lỗi xóa gói dịch vụ');
    res.redirect('/admin/services');
  }
};
