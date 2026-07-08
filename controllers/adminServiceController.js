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

// Allow dynamic cover image, gallery images, and package-specific gallery uploads
exports.uploadMiddleware = upload.any();

exports.listServices = async (req, res) => {
  try {
    const [services] = await db.query('SELECT * FROM services ORDER BY sort_order ASC, id DESC');
    
    // Parse pricing for index view summary
    const parsed = services.map(s => {
      let pricing = [];
      if (s.pricing) {
        try {
          pricing = typeof s.pricing === 'string' ? JSON.parse(s.pricing) : s.pricing;
        } catch (e) {
          pricing = [];
        }
      }
      return { ...s, pricing: Array.isArray(pricing) ? pricing : [] };
    });

    res.render('admin/services/index', {
      title: 'Quản lý Gói Dịch Vụ',
      layout: 'layouts/admin',
      services: parsed
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
    service: {
      gallery: [],
      pricing: [],
      addons: []
    },
    isEdit: false
  });
};

exports.createService = async (req, res) => {
  const { name, slug, description, subtitle, category, category_label, price_from, duration_minutes, is_featured, sort_order } = req.body;
  
  // Parse pricing packages
  const pricing = [];
  if (req.body.pricing_name) {
    const names = Array.isArray(req.body.pricing_name) ? req.body.pricing_name : [req.body.pricing_name];
    const prices = Array.isArray(req.body.pricing_price) ? req.body.pricing_price : [req.body.pricing_price];
    const inclusionsText = Array.isArray(req.body.pricing_inclusions) ? req.body.pricing_inclusions : [req.body.pricing_inclusions];
    const pricingIds = Array.isArray(req.body.pricing_id) ? req.body.pricing_id : [req.body.pricing_id];
    const galleryJsons = Array.isArray(req.body.pricing_gallery_json) ? req.body.pricing_gallery_json : [req.body.pricing_gallery_json];
    
    for (let i = 0; i < names.length; i++) {
      if (!names[i] || !names[i].trim()) continue;
      const incs = inclusionsText[i]
        ? inclusionsText[i].split('\n').map(line => line.trim()).filter(line => line !== '')
        : [];
      
      const pkgId = pricingIds[i];
      let pkgGallery = [];
      if (galleryJsons[i]) {
        try {
          pkgGallery = JSON.parse(galleryJsons[i]);
        } catch (e) {
          pkgGallery = [];
        }
      }
      
      // Look for newly uploaded files for this package
      if (req.files && pkgId) {
        const pkgFiles = req.files.filter(f => f.fieldname === `package_files_${pkgId}`);
        if (pkgFiles.length > 0) {
          const newPhotos = pkgFiles.map(file => `/uploads/services/${file.filename}`);
          pkgGallery = pkgGallery.concat(newPhotos);
        }
      }
      
      pricing.push({
        packageName: names[i].trim(),
        price: prices[i] ? prices[i].trim() : 'Liên hệ',
        inclusions: incs,
        gallery: pkgGallery,
        coverImage: pkgGallery[0] || null
      });
    }
  }

  // Parse addons
  const addons = [];
  if (req.body.addon_name) {
    const names = Array.isArray(req.body.addon_name) ? req.body.addon_name : [req.body.addon_name];
    const prices = Array.isArray(req.body.addon_price) ? req.body.addon_price : [req.body.addon_price];
    
    for (let i = 0; i < names.length; i++) {
      if (!names[i] || !names[i].trim()) continue;
      addons.push({
        name: names[i].trim(),
        price: prices[i] ? prices[i].trim() : 'Liên hệ'
      });
    }
  }

  // Handle files under upload.any()
  let cover_image = null;
  const coverImageFile = req.files ? req.files.find(f => f.fieldname === 'cover_image') : null;
  if (coverImageFile) {
    cover_image = `/uploads/services/${coverImageFile.filename}`;
  }

  let gallery = [];
  if (req.files) {
    const galleryFiles = req.files.filter(f => f.fieldname === 'gallery_images');
    gallery = galleryFiles.map(file => `/uploads/services/${file.filename}`);
  }

  const isFeat = is_featured === 'on' || is_featured === '1' ? 1 : 0;
  // Features map to first package inclusions for backward-compatibility
  const features = pricing[0] ? pricing[0].inclusions : [];

  try {
    await db.query(`
      INSERT INTO services (name, slug, description, short_desc, price_from, duration_minutes, cover_image, features, is_featured, sort_order, category, category_label, subtitle, gallery, pricing, addons)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, slug, description, subtitle, price_from || 0, duration_minutes || 0,
      cover_image, JSON.stringify(features), isFeat, sort_order || 0,
      category || 'ca-nhan', category_label || 'Cá Nhân', subtitle,
      JSON.stringify(gallery), JSON.stringify(pricing), JSON.stringify(addons)
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

    let service = services[0];
    
    // Parse JSON safely
    if (typeof service.gallery === 'string') {
      try { service.gallery = JSON.parse(service.gallery); } catch (e) { service.gallery = []; }
    }
    if (!service.gallery) service.gallery = [];

    if (typeof service.pricing === 'string') {
      try { service.pricing = JSON.parse(service.pricing); } catch (e) { service.pricing = []; }
    }
    if (!service.pricing) service.pricing = [];

    if (typeof service.addons === 'string') {
      try { service.addons = JSON.parse(service.addons); } catch (e) { service.addons = []; }
    }
    if (!service.addons) service.addons = [];

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
  const { name, slug, description, subtitle, category, category_label, price_from, duration_minutes, is_featured, sort_order } = req.body;

  // Parse pricing packages
  const pricing = [];
  if (req.body.pricing_name) {
    const names = Array.isArray(req.body.pricing_name) ? req.body.pricing_name : [req.body.pricing_name];
    const prices = Array.isArray(req.body.pricing_price) ? req.body.pricing_price : [req.body.pricing_price];
    const inclusionsText = Array.isArray(req.body.pricing_inclusions) ? req.body.pricing_inclusions : [req.body.pricing_inclusions];
    const pricingIds = Array.isArray(req.body.pricing_id) ? req.body.pricing_id : [req.body.pricing_id];
    const galleryJsons = Array.isArray(req.body.pricing_gallery_json) ? req.body.pricing_gallery_json : [req.body.pricing_gallery_json];
    
    for (let i = 0; i < names.length; i++) {
      if (!names[i] || !names[i].trim()) continue;
      const incs = inclusionsText[i]
        ? inclusionsText[i].split('\n').map(line => line.trim()).filter(line => line !== '')
        : [];
      
      const pkgId = pricingIds[i];
      let pkgGallery = [];
      if (galleryJsons[i]) {
        try {
          pkgGallery = JSON.parse(galleryJsons[i]);
        } catch (e) {
          pkgGallery = [];
        }
      }
      
      // Look for newly uploaded files for this package
      if (req.files && pkgId) {
        const pkgFiles = req.files.filter(f => f.fieldname === `package_files_${pkgId}`);
        if (pkgFiles.length > 0) {
          const newPhotos = pkgFiles.map(file => `/uploads/services/${file.filename}`);
          pkgGallery = pkgGallery.concat(newPhotos);
        }
      }
      
      pricing.push({
        packageName: names[i].trim(),
        price: prices[i] ? prices[i].trim() : 'Liên hệ',
        inclusions: incs,
        gallery: pkgGallery,
        coverImage: pkgGallery[0] || null
      });
    }
  }

  // Parse addons
  const addons = [];
  if (req.body.addon_name) {
    const names = Array.isArray(req.body.addon_name) ? req.body.addon_name : [req.body.addon_name];
    const prices = Array.isArray(req.body.addon_price) ? req.body.addon_price : [req.body.addon_price];
    
    for (let i = 0; i < names.length; i++) {
      if (!names[i] || !names[i].trim()) continue;
      addons.push({
        name: names[i].trim(),
        price: prices[i] ? prices[i].trim() : 'Liên hệ'
      });
    }
  }

  // Gallery (keep existing images minus deleted ones, then concat new ones)
  let gallery = [];
  if (req.body.keep_gallery) {
    gallery = Array.isArray(req.body.keep_gallery) ? req.body.keep_gallery : [req.body.keep_gallery];
  }
  if (req.files) {
    const galleryFiles = req.files.filter(f => f.fieldname === 'gallery_images');
    const newPhotos = galleryFiles.map(file => `/uploads/services/${file.filename}`);
    gallery = gallery.concat(newPhotos);
  }

  const isFeat = is_featured === 'on' || is_featured === '1' ? 1 : 0;
  const features = pricing[0] ? pricing[0].inclusions : [];

  // Cover image
  const coverImageFile = req.files ? req.files.find(f => f.fieldname === 'cover_image') : null;
  const cover_image = coverImageFile ? `/uploads/services/${coverImageFile.filename}` : null;

  try {
    if (cover_image) {
      await db.query(`
        UPDATE services SET name=?, slug=?, description=?, short_desc=?, price_from=?, duration_minutes=?, cover_image=?, features=?, is_featured=?, sort_order=?, category=?, category_label=?, subtitle=?, gallery=?, pricing=?, addons=? WHERE id=?
      `, [name, slug, description, subtitle, price_from || 0, duration_minutes || 0, cover_image, JSON.stringify(features), isFeat, sort_order || 0, category || 'ca-nhan', category_label || 'Cá Nhân', subtitle, JSON.stringify(gallery), JSON.stringify(pricing), JSON.stringify(addons), id]);
    } else {
      await db.query(`
        UPDATE services SET name=?, slug=?, description=?, short_desc=?, price_from=?, duration_minutes=?, features=?, is_featured=?, sort_order=?, category=?, category_label=?, subtitle=?, gallery=?, pricing=?, addons=? WHERE id=?
      `, [name, slug, description, subtitle, price_from || 0, duration_minutes || 0, JSON.stringify(features), isFeat, sort_order || 0, category || 'ca-nhan', category_label || 'Cá Nhân', subtitle, JSON.stringify(gallery), JSON.stringify(pricing), JSON.stringify(addons), id]);
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
