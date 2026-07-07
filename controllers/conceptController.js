// controllers/conceptController.js
const conceptsData = require('../data/concepts');

exports.detail = async (req, res) => {
  try {
    const slug = req.params.slug;
    const concept = conceptsData.concepts.find(c => c.id === slug);

    if (!concept) {
      console.log(`Concept not found for slug: ${slug}, redirecting to /services`);
      return res.redirect('/services');
    }

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
    const conceptsData = require('../data/concepts');
    const concept = conceptsData.concepts.find(c => c.id === slug);

    if (!concept) {
      console.log(`Concept not found for slug: ${slug}, redirecting to /services`);
      return res.redirect('/services');
    }

    const mappedConcept = {
      ...concept,
      coverImage: `/cdn/image?w=1920&src=${encodeURIComponent(concept.coverImage)}`,
      gallery: concept.gallery.map(img => `/cdn/image?w=800&src=${encodeURIComponent(img)}`)
    };

    res.render('concept-shared-details', {
      title: `Chi Tiết Concept ${concept.name} - Dear Musé`,
      metaDescription: `${concept.subtitle}. Xem bộ sưu tập ảnh thực tế của concept ${concept.name} tại Dear Musé.`,
      concept: mappedConcept
    });
  } catch (err) {
    console.error('Error rendering package detail:', err);
    res.redirect('/services');
  }
};
