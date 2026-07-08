// controllers/conceptController.js
const Service = require('../models/Service');

function parseServiceJSON(service) {
  if (!service) return null;
  
  let gallery = [];
  if (typeof service.gallery === 'string') {
    try { gallery = JSON.parse(service.gallery); } catch (e) { gallery = []; }
  } else if (Array.isArray(service.gallery)) {
    gallery = service.gallery;
  }

  let pricing = [];
  if (typeof service.pricing === 'string') {
    try { pricing = JSON.parse(service.pricing); } catch (e) { pricing = []; }
  } else if (Array.isArray(service.pricing)) {
    pricing = service.pricing;
  }

  let addons = [];
  if (typeof service.addons === 'string') {
    try { addons = JSON.parse(service.addons); } catch (e) { addons = []; }
  } else if (Array.isArray(service.addons)) {
    addons = service.addons;
  }

  return { ...service, gallery, pricing, addons };
}

function mapDbServiceToConcept(service) {
  if (!service) return null;
  const parsed = parseServiceJSON(service);
  return {
    id: parsed.slug,
    name: parsed.name,
    category: parsed.category,
    categoryLabel: parsed.category_label,
    subtitle: parsed.subtitle || parsed.short_desc || '',
    coverImage: parsed.cover_image,
    description: parsed.description,
    gallery: parsed.gallery,
    pricing: parsed.pricing,
    addons: parsed.addons
  };
}

exports.detail = async (req, res) => {
  try {
    const slug = req.params.slug;
    const dbService = await Service.findBySlug(slug);

    if (!dbService) {
      console.log(`Concept not found for slug: ${slug}, redirecting to /services`);
      return res.redirect('/services');
    }

    const concept = mapDbServiceToConcept(dbService);
    const mappedConcept = {
      ...concept,
      coverImage: `/cdn/image?w=1920&src=${encodeURIComponent(concept.coverImage)}`,
      gallery: concept.gallery.map(img => `/cdn/image?w=800&src=${encodeURIComponent(img)}`)
    };

    res.render('concept-detail', {
      title: `${concept.name} - Bảng Giá Dịch Vụ - Dear Musé`,
      metaDescription: `Bảng giá chi tiết các gói chụp của concept ${concept.name}.`,
      concept: mappedConcept
    });
  } catch (err) {
    console.error('Error rendering concept detail:', err);
    res.redirect('/services');
  }
};

exports.packageDetail = async (req, res) => {
  try {
    const slug = req.params.slug;
    const pkgIndex = req.query.pkg;
    const dbService = await Service.findBySlug(slug);

    if (!dbService) {
      console.log(`Concept not found for slug: ${slug}, redirecting to /services`);
      return res.redirect('/services');
    }

    const concept = mapDbServiceToConcept(dbService);

    let currentGallery = concept.gallery;
    let currentName = concept.name;
    let currentSubtitle = concept.subtitle;
    let currentCover = concept.coverImage;

    if (pkgIndex !== undefined && concept.pricing && concept.pricing[pkgIndex]) {
      const pkg = concept.pricing[pkgIndex];
      if (pkg.gallery && pkg.gallery.length > 0) {
        currentGallery = pkg.gallery;
        currentCover = pkg.coverImage || pkg.gallery[0];
      }
      currentName = pkg.packageName;
    }

    const mappedConcept = {
      ...concept,
      name: currentName,
      subtitle: currentSubtitle,
      coverImage: `/cdn/image?w=1920&src=${encodeURIComponent(currentCover)}`,
      gallery: currentGallery.map(img => `/cdn/image?w=800&src=${encodeURIComponent(img)}`)
    };

    res.render('concept-shared-details', {
      title: `Chi Tiết Concept ${currentName} - Dear Musé`,
      metaDescription: `${currentSubtitle}. Xem bộ sưu tập ảnh thực tế của concept ${currentName} tại Dear Musé.`,
      concept: mappedConcept
    });
  } catch (err) {
    console.error('Error rendering package detail:', err);
    res.redirect('/services');
  }
};
