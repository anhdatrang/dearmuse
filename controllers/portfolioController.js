const Portfolio = require('../models/Portfolio');

const allImages = {
  'ca-nhan': [
    { src: '/source/N%C3%A0ng%20th%C6%A1/H%C6%B0%E1%BB%9Bng%20d%C6%B0%C6%A1ng%20001_.webp', category: 'ca-nhan', alt: 'Chân dung hướng dương', album: 'Nàng Thơ' },
    { src: '/source/N%C3%A0ng%20th%C6%A1/H%C6%B0%E1%BB%9Bng%20d%C6%B0%C6%A1ng%20003.webp', category: 'ca-nhan', alt: 'Nàng thơ hướng dương', album: 'Nàng Thơ' },
    { src: '/source/N%C3%A0ng%20th%C6%A1/N%C3%A0ng%20th%C6%A1%20001.webp', category: 'ca-nhan', alt: 'Nàng thơ trong trẻo', album: 'Nàng Thơ' },
    { src: '/source/N%C3%A0ng%20th%C6%A1/N%C3%A0ng%20th%C6%A1%20002.webp', category: 'ca-nhan', alt: 'Chân dung nghệ thuật', album: 'Nàng Thơ' },
    { src: '/source/C%C3%81%20NH%C3%82N/CONCEPT/SU207836(1).webp', category: 'ca-nhan', alt: 'Concept nàng thơ', album: 'Concept Nghệ Thuật' },
    { src: '/source/C%C3%81%20NH%C3%82N/CONCEPT/SU207938(1).webp', category: 'ca-nhan', alt: 'Chân dung điện ảnh', album: 'Concept Nghệ Thuật' },
    { src: '/source/C%C3%81%20NH%C3%82N/%C3%81O%20D%C3%80I/IMG_6389.webp', category: 'ca-nhan', alt: 'Áo dài truyền thống', album: 'Áo Dài' },
    { src: '/source/C%C3%81%20NH%C3%82N/%C3%81O%20D%C3%80I/IMG_6415.webp', category: 'ca-nhan', alt: 'Áo dài trắng thướt tha', album: 'Áo Dài' },
    { src: '/source/C%C3%81%20NH%C3%82N/PROFILE/IMG_4925.webp', category: 'ca-nhan', alt: 'Profile nghệ thuật', album: 'Profile' },
    { src: '/source/C%C3%81%20NH%C3%82N/PROFILE/IMG_4933.webp', category: 'ca-nhan', alt: 'Chân dung tối giản', album: 'Profile' },
  ],
  'doanh-nghiep': [
    { src: '/source/DOANH%20NGHI%E1%BB%86P/PREMIUM/IMG_4319.webp', category: 'doanh-nghiep', alt: 'Sự kiện ký kết', album: 'Doanh Nghiệp Premium' },
    { src: '/source/DOANH%20NGHI%E1%BB%86P/PREMIUM/IMG_8774.webp', category: 'doanh-nghiep', alt: 'Gala doanh nghiệp', album: 'Doanh Nghiệp Premium' },
    { src: '/source/DOANH%20NGHI%E1%BB%86P/PREMIUM/IMG_8785.webp', category: 'doanh-nghiep', alt: 'Chân dung doanh nhân', album: 'Doanh Nghiệp Premium' },
    { src: '/source/DOANH%20NGHI%E1%BB%86P/PREMIUM/IMG_9947.webp', category: 'doanh-nghiep', alt: 'Sự kiện thương mại', album: 'Doanh Nghiệp Premium' },
    { src: '/source/DOANH%20NGHI%E1%BB%86P/PREMIUM/IMG_4271.webp', category: 'doanh-nghiep', alt: 'Hội nghị cao cấp', album: 'Doanh Nghiệp Premium' },
    { src: '/source/DOANH%20NGHI%E1%BB%86P/PREMIUM/IMG_4303.webp', category: 'doanh-nghiep', alt: 'Teamwork doanh nghiệp', album: 'Doanh Nghiệp Premium' },
    { src: '/source/DOANH%20NGHI%E1%BB%86P/PREMIUM/IMG_4316.webp', category: 'doanh-nghiep', alt: 'Toạ đàm doanh nghiệp', album: 'Doanh Nghiệp Premium' },
    { src: '/source/DOANH%20NGHI%E1%BB%86P/PREMIUM/IMG_8778.webp', category: 'doanh-nghiep', alt: 'Lễ ra mắt sản phẩm', album: 'Doanh Nghiệp Premium' },
  ],
  'mo-rong': [
    { src: '/source/M%E1%BB%9E%20R%E1%BB%98NG/S%E1%BA%A2N%20PH%E1%BA%A8M/IMG_4613.webp', category: 'mo-rong', alt: 'Chụp ảnh sản phẩm', album: 'Sản Phẩm Thương Mại' },
    { src: '/source/M%E1%BB%9E%20R%E1%BB%98NG/S%E1%BA%A2N%20PH%E1%BA%A8M/IMG_4615.webp', category: 'mo-rong', alt: 'Lookbook thời trang', album: 'Sản Phẩm Thương Mại' },
    { src: '/source/M%E1%BB%9E%20R%E1%BB%98NG/S%E1%BA%A2N%20PH%E1%BA%A8M/IMG_4691.webp', category: 'mo-rong', alt: 'Sản phẩm tối giản', album: 'Sản Phẩm Thương Mại' },
    { src: '/source/M%E1%BB%9E%20R%E1%BB%98NG/S%E1%BA%A2N%20PH%E1%BA%A8M/IMG_4693.webp', category: 'mo-rong', alt: 'Chi tiết sản phẩm', album: 'Sản Phẩm Thương Mại' },
    { src: '/source/M%E1%BB%9E%20R%E1%BB%98NG/S%E1%BA%A2N%20PH%E1%BA%A8M/IMG_4695.webp', category: 'mo-rong', alt: 'Nghệ thuật sắp đặt', album: 'Sản Phẩm Thương Mại' },
    { src: '/source/M%E1%BB%9E%20R%E1%BB%98NG/S%E1%BA%A2N%20PH%E1%BA%A8M/IMG_5582.webp', category: 'mo-rong', alt: 'Mỹ phẩm cao cấp', album: 'Sản Phẩm Thương Mại' },
  ]
};

const allPortfolioImages = [
  ...allImages['ca-nhan'],
  ...allImages['doanh-nghiep'],
  ...allImages['mo-rong'],
];

const groupMetadata = {
  'ca-nhan': {
    id: 'ca-nhan',
    title: 'CÁ NHÂN',
    englishTitle: 'PORTRAIT',
    subtitle: 'Nghệ thuật Chân dung & Độc bản',
    imprintTitle: 'CHÂN DUNG NGHỆ THUẬT',
    introText: 'Bộ sưu tập chân dung nghệ thuật được thiết kế nhằm lột tả chiều sâu tâm hồn và cá tính độc bản của mỗi cá nhân. Ánh sáng tự nhiên kết hợp góc máy đậm chất điện ảnh tạo nên những khung hình trường tồn với thời gian.',
    teaserCategory1: 'doanh-nghiep',
    teaserCategory2: 'mo-rong'
  },
  'doanh-nghiep': {
    id: 'doanh-nghiep',
    title: 'DOANH NGHIỆP',
    englishTitle: 'BUSINESS',
    subtitle: 'Nâng tầm Thương hiệu & Sự kiện',
    imprintTitle: 'DOANH NHÂN & SỰ KIỆN',
    introText: 'Ghi lại những khoảnh khắc đắt giá của các hội nghị cao cấp, lễ ký kết và hình ảnh chân dung doanh nhân chuyên nghiệp. Phong cách chụp hiện đại, chỉnh chu giúp khẳng định vị thế và hình ảnh thương hiệu.',
    teaserCategory1: 'ca-nhan',
    teaserCategory2: 'mo-rong'
  },
  'mo-rong': {
    id: 'mo-rong',
    title: 'MỞ RỘNG',
    englishTitle: 'COMMERCIAL',
    subtitle: 'Sản phẩm & Thời trang Lookbook',
    imprintTitle: 'SẢN PHẨM & LOOKBOOK',
    introText: 'Khám phá ngôn ngữ của các thiết kế thời trang và sản phẩm cao cấp dưới lăng kính nghệ thuật tối giản. Từng chi tiết, chất liệu đều được tôn vinh qua cách sắp đặt ánh sáng và bố cục chuẩn mực.',
    teaserCategory1: 'ca-nhan',
    teaserCategory2: 'doanh-nghiep'
  }
};

exports.index = async (req, res) => {
  const category = req.query.category || 'all';

  // Decide which groups to render
  let activeGroups = [];
  if (category === 'all') {
    activeGroups = ['ca-nhan', 'doanh-nghiep', 'mo-rong'];
  } else if (allImages[category]) {
    activeGroups = [category];
  } else {
    return res.redirect('/portfolio');
  }

  // Construct structured data for view
  const magazineGroups = activeGroups.map(catKey => {
    return {
      ...groupMetadata[catKey],
      images: allImages[catKey].map(img => ({
        ...img,
        src: `/cdn/image?w=800&src=${encodeURIComponent(img.src)}`
      }))
    };
  });

  let catLabel = 'Tất cả';
  if (category === 'ca-nhan') catLabel = 'Cá Nhân';
  else if (category === 'doanh-nghiep') catLabel = 'Doanh Nghiệp';
  else if (category === 'mo-rong') catLabel = 'Mở Rộng';

  res.render('portfolio', {
    title: `Portfolio ${catLabel} — Dear Musé`,
    metaDescription: `Khám phá các tác phẩm nhiếp ảnh nghệ thuật nổi bật thuộc danh mục ${catLabel} của Dear Musé Studio. Lưu giữ trọn vẹn những khoảnh khắc và cảm xúc độc bản.`,
    images: category === 'all' ? allPortfolioImages : allImages[category],
    magazineGroups,
    allImages,
    activeCategory: category,
  });
};

exports.detail = async (req, res) => {
  try {
    const portfolio = await Portfolio.findBySlug(req.params.slug);
    if (!portfolio) return res.redirect('/portfolio');

    const descText = portfolio.description
      ? portfolio.description.replace(/<[^>]*>/g, '').substring(0, 155) + '...'
      : `Xem chi tiết bộ ảnh nghệ thuật "${portfolio.title}" được thực hiện bởi Dear Musé Studio.`;

    res.render('portfolio-detail', {
      title: `${portfolio.title} — Tác Phẩm Nghệ Thuật — Dear Musé`,
      metaDescription: descText,
      ogImage: portfolio.cover_image || '',
      portfolio,
    });
  } catch (err) {
    console.error(err);
    res.redirect('/portfolio');
  }
};
