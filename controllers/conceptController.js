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
      title: `${concept.name} — Gói Dịch Vụ Nghệ Thuật — Dear Musé`,
      metaDescription: `${concept.subtitle}. Xem chi tiết gói chụp, bảng giá chi tiết các hạng mục và bộ sưu tập ảnh thực tế của concept ${concept.name} tại Dear Musé.`,
      concept: mappedConcept
    });
  } catch (err) {
    console.error('Error rendering concept detail:', err);
    res.redirect('/services');
  }
};
