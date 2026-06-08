const Portfolio = require('../models/Portfolio');

const allImages = {
  portrait: [
    { src: '/source/N%C3%A0ng%20Th%C6%A1/H%C6%B0%E1%BB%9Bng%20d%C6%B0%C6%A1ng%20001_.jpeg', category: 'portrait', alt: 'Chân dung hướng dương', album: 'Nàng Thơ' },
    { src: '/source/N%C3%A0ng%20Th%C6%A1/H%C6%B0%E1%BB%9Bng%20d%C6%B0%C6%A1ng%20003.jpg', category: 'portrait', alt: 'Nàng thơ hướng dương', album: 'Nàng Thơ' },
    { src: '/source/N%C3%A0ng%20Th%C6%A1/H%C6%B0%E1%BB%9Bng%20d%C6%B0%C6%A1ng%20004.JPG', category: 'portrait', alt: 'Portrait hướng dương', album: 'Nàng Thơ' },
    { src: '/source/N%C3%A0ng%20Th%C6%A1/N%C3%A0ng%20th%C6%A1%20001.JPG', category: 'portrait', alt: 'Nàng thơ', album: 'Nàng Thơ' },
    { src: '/source/N%C3%A0ng%20Th%C6%A1/N%C3%A0ng%20th%C6%A1%20002.JPG', category: 'portrait', alt: 'Chân dung nghệ thuật', album: 'Nàng Thơ' },
  ],
  studio: [
    { src: '/source/N%C3%A0ng%20Th%C6%A1/Qu%E1%BA%A3%20chanh%20001.JPG', category: 'studio', alt: 'Studio quả chanh', album: 'Nàng Thơ' },
    { src: '/source/N%C3%A0ng%20Th%C6%A1/Qu%E1%BA%A3%20chanh%20003.JPG', category: 'studio', alt: 'Studio sắc vàng', album: 'Nàng Thơ' },
    { src: '/source/N%C3%A0ng%20Th%C6%A1/Qu%E1%BA%A3%20chanh%20004.JPG', category: 'studio', alt: 'Portrait studio', album: 'Nàng Thơ' },
    { src: '/source/N%C3%A0ng%20Th%C6%A1/Xanh%20Xanh%20002.JPG', category: 'studio', alt: 'Studio xanh xanh', album: 'Nàng Thơ' },
    { src: '/source/N%C3%A0ng%20Th%C6%A1/Xanh%20xanh%20005.JPG', category: 'studio', alt: 'Chân dung xanh', album: 'Nàng Thơ' },
    { src: '/source/N%C3%A0ng%20Th%C6%A1/Xanh%20xanh%20007.JPG', category: 'studio', alt: 'Portrait xanh', album: 'Nàng Thơ' },
    { src: '/source/N%C3%A0ng%20Th%C6%A1/Xanh%20xanh%20008.JPG', category: 'studio', alt: 'Nghệ thuật xanh', album: 'Nàng Thơ' },
  ],
  event: [
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/IMG_2324.JPG', category: 'event', alt: 'Dạ hội', album: 'Dạ Hội' },
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/IMG_2325.JPG', category: 'event', alt: 'Khoảnh khắc dạ hội', album: 'Dạ Hội' },
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/IMG_2326.JPG', category: 'event', alt: 'Dạ hội tỏa sáng', album: 'Dạ Hội' },
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/IMG_2330.JPG', category: 'event', alt: 'Ánh sáng dạ hội', album: 'Dạ Hội' },
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/IMG_2331.JPG', category: 'event', alt: 'Dạ hội lung linh', album: 'Dạ Hội' },
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/IMG_2332.JPG', category: 'event', alt: 'Khoảnh khắc đặc biệt', album: 'Dạ Hội' },
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/IMG_2334.JPG', category: 'event', alt: 'Dạ hội rực rỡ', album: 'Dạ Hội' },
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/IMG_2336.JPG', category: 'event', alt: 'Chân dung dạ hội', album: 'Dạ Hội' },
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/IMG_2352.JPG', category: 'event', alt: 'Nét đẹp dạ hội', album: 'Dạ Hội' },
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/Meomeo000.jpg', category: 'event', alt: 'Dạ hội nghệ thuật', album: 'Dạ Hội' },
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/Meomeo001.jpeg', category: 'event', alt: 'Sự kiện đặc biệt', album: 'Dạ Hội' },
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/Meomeo002.jpeg', category: 'event', alt: 'Khoảnh khắc dạ hội', album: 'Dạ Hội' },
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/Meomeo003.jpeg', category: 'event', alt: 'Ánh đèn lung linh', album: 'Dạ Hội' },
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/Meomeo004.jpeg', category: 'event', alt: 'Dạ hội tỏa sáng', album: 'Dạ Hội' },
  ]
};

const allPortfolioImages = [
  ...allImages.portrait,
  ...allImages.studio,
  ...allImages.event,
];

exports.index = async (req, res) => {
  const category = req.query.category || 'all';
  let images = category === 'all' ? allPortfolioImages : allImages[category] || allPortfolioImages;

  res.render('portfolio', {
    title: 'Portfolio — Dear Musé',
    images,
    activeCategory: category,
  });
};

exports.detail = async (req, res) => {
  try {
    const portfolio = await Portfolio.findBySlug(req.params.slug);
    if (!portfolio) return res.redirect('/portfolio');
    res.render('portfolio-detail', {
      title: `${portfolio.title} — Dear Musé`,
      portfolio,
    });
  } catch (err) {
    console.error(err);
    res.redirect('/portfolio');
  }
};
