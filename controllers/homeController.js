const Service = require('../models/Service');
const Portfolio = require('../models/Portfolio');

// Photo data from public/source — classified from studio photos
const allSourceImages = {
  'Nàng Thơ': [
    { src: '/source/N%C3%A0ng%20Th%C6%A1/H%C6%B0%E1%BB%9Bng%20d%C6%B0%C6%A1ng%20001_.jpeg', category: 'portrait', alt: 'Chân dung hướng dương' },
    { src: '/source/N%C3%A0ng%20Th%C6%A1/H%C6%B0%E1%BB%9Bng%20d%C6%B0%C6%A1ng%20003.jpg', category: 'portrait', alt: 'Nàng thơ hướng dương' },
    { src: '/source/N%C3%A0ng%20Th%C6%A1/H%C6%B0%E1%BB%9Bng%20d%C6%B0%C6%A1ng%20004.JPG', category: 'portrait', alt: 'Portrait hướng dương' },
    { src: '/source/N%C3%A0ng%20Th%C6%A1/N%C3%A0ng%20th%C6%A1%20001.JPG', category: 'portrait', alt: 'Nàng thơ' },
    { src: '/source/N%C3%A0ng%20Th%C6%A1/N%C3%A0ng%20th%C6%A1%20002.JPG', category: 'portrait', alt: 'Chân dung nghệ thuật' },
    { src: '/source/N%C3%A0ng%20Th%C6%A1/Qu%E1%BA%A3%20chanh%20001.JPG', category: 'studio', alt: 'Studio quả chanh' },
    { src: '/source/N%C3%A0ng%20Th%C6%A1/Qu%E1%BA%A3%20chanh%20003.JPG', category: 'studio', alt: 'Studio sắc vàng' },
    { src: '/source/N%C3%A0ng%20Th%C6%A1/Qu%E1%BA%A3%20chanh%20004.JPG', category: 'studio', alt: 'Portrait studio' },
    { src: '/source/N%C3%A0ng%20Th%C6%A1/Xanh%20Xanh%20002.JPG', category: 'studio', alt: 'Studio xanh' },
    { src: '/source/N%C3%A0ng%20Th%C6%A1/Xanh%20xanh%20005.JPG', category: 'studio', alt: 'Chân dung xanh xanh' },
    { src: '/source/N%C3%A0ng%20Th%C6%A1/Xanh%20xanh%20007.JPG', category: 'studio', alt: 'Portrait xanh' },
    { src: '/source/N%C3%A0ng%20Th%C6%A1/Xanh%20xanh%20008.JPG', category: 'studio', alt: 'Nghệ thuật xanh' },
  ],
  'Dạ Hội': [
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/IMG_2324.JPG', category: 'event', alt: 'Dạ hội' },
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/IMG_2325.JPG', category: 'event', alt: 'Khoảnh khắc dạ hội' },
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/IMG_2326.JPG', category: 'event', alt: 'Dạ hội tỏa sáng' },
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/IMG_2330.JPG', category: 'event', alt: 'Ánh sáng dạ hội' },
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/IMG_2331.JPG', category: 'event', alt: 'Dạ hội lung linh' },
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/IMG_2332.JPG', category: 'event', alt: 'Khoảnh khắc đặc biệt' },
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/IMG_2334.JPG', category: 'event', alt: 'Dạ hội rực rỡ' },
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/IMG_2336.JPG', category: 'event', alt: 'Chân dung dạ hội' },
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/IMG_2352.JPG', category: 'event', alt: 'Nét đẹp dạ hội' },
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/Meomeo000.jpg', category: 'event', alt: 'Dạ hội nghệ thuật' },
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/Meomeo001.jpeg', category: 'event', alt: 'Sự kiện đặc biệt' },
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/Meomeo002.jpeg', category: 'event', alt: 'Khoảnh khắc dạ hội' },
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/Meomeo003.jpeg', category: 'event', alt: 'Ánh đèn lung linh' },
    { src: '/source/D%E1%BA%A1%20H%E1%BB%99i/Meomeo004.jpeg', category: 'event', alt: 'Dạ hội tỏa sáng' },
  ],
  'ÁO DÀI': [
    { src: '/source/%C3%81O%20D%C3%80I/IMG_6366.JPG', category: 'portrait', alt: 'Áo dài truyền thống' },
    { src: '/source/%C3%81O%20D%C3%80I/IMG_6368.JPG', category: 'portrait', alt: 'Vẻ đẹp áo dài' },
    { src: '/source/%C3%81O%20D%C3%80I/IMG_6382.JPG', category: 'portrait', alt: 'Áo dài nghệ thuật' },
    { src: '/source/%C3%81O%20D%C3%80I/IMG_6415.JPG', category: 'portrait', alt: 'Chân dung áo dài' },
    { src: '/source/%C3%81O%20D%C3%80I/IMG_6431.JPG', category: 'portrait', alt: 'Khoảnh khắc áo dài' },
  ]
};

// Hero images (best shots for fullscreen - 24 images from all 3 collections)
const heroImages = [
  // Áo Dài
  '/source/%C3%81O%20D%C3%80I/IMG_6366.JPG',
  '/source/%C3%81O%20D%C3%80I/IMG_6368.JPG',
  '/source/%C3%81O%20D%C3%80I/IMG_6371.JPG',
  '/source/%C3%81O%20D%C3%80I/IMG_6382.JPG',
  '/source/%C3%81O%20D%C3%80I/IMG_6383.JPG',
  '/source/%C3%81O%20D%C3%80I/IMG_6386.JPG',
  '/source/%C3%81O%20D%C3%80I/IMG_6390.JPG',
  '/source/%C3%81O%20D%C3%80I/IMG_6415.JPG',
  '/source/%C3%81O%20D%C3%80I/IMG_6417.JPG',
  '/source/%C3%81O%20D%C3%80I/IMG_6422.JPG',
  // Nàng Thơ
  '/source/N%C3%A0ng%20Th%C6%A1/N%C3%A0ng%20th%C6%A1%20001.JPG',
  '/source/N%C3%A0ng%20Th%C6%A1/N%C3%A0ng%20th%C6%A1%20002.JPG',
  '/source/N%C3%A0ng%20Th%C6%A1/Xanh%20Xanh%20002.JPG',
  '/source/N%C3%A0ng%20Th%C6%A1/Xanh%20xanh%20005.JPG',
  '/source/N%C3%A0ng%20Th%C6%A1/Xanh%20xanh%20007.JPG',
  '/source/N%C3%A0ng%20Th%C6%A1/H%C6%B0%E1%BB%9Bng%20d%C6%B0%C6%A1ng%20001_.jpeg',
  '/source/N%C3%A0ng%20Th%C6%A1/H%C6%B0%E1%BB%9Bng%20d%C6%B0%C6%A1ng%20004.JPG',
  '/source/N%C3%A0ng%20Th%C6%A1/Qu%E1%BA%A3%20chanh%20001.JPG',
  // Dạ Hội
  '/source/D%E1%BA%A1%20H%E1%BB%99i/IMG_2324.JPG',
  '/source/D%E1%BA%A1%20H%E1%BB%99i/IMG_2325.JPG',
  '/source/D%E1%BA%A1%20H%E1%BB%99i/IMG_2326.JPG',
  '/source/D%E1%BA%A1%20H%E1%BB%99i/IMG_2330.JPG',
  '/source/D%E1%BA%A1%20H%E1%BB%99i/IMG_2332.JPG',
  '/source/D%E1%BA%A1%20H%E1%BB%99i/IMG_2336.JPG',
];

// Featured gallery: 15 images, mix categories
const featuredImages = [
  allSourceImages['ÁO DÀI'][0],
  allSourceImages['Nàng Thơ'][0],
  allSourceImages['Dạ Hội'][5],
  allSourceImages['ÁO DÀI'][2],
  allSourceImages['Dạ Hội'][7],
  allSourceImages['Nàng Thơ'][3],
  allSourceImages['ÁO DÀI'][3],
  allSourceImages['Nàng Thơ'][5],
  allSourceImages['Dạ Hội'][9],
  allSourceImages['ÁO DÀI'][1],
  allSourceImages['Nàng Thơ'][1],
  allSourceImages['Dạ Hội'][0],
  allSourceImages['ÁO DÀI'][4],
  allSourceImages['Nàng Thơ'][2],
  allSourceImages['Dạ Hội'][2]
];

const aboutImage = '/source/N%C3%A0ng%20Th%C6%A1/N%C3%A0ng%20th%C6%A1%20002.JPG';

exports.home = async (req, res) => {
  try {
    const services = await Service.findFeatured();
    res.render('home', {
      title: 'Dear Musé — Studio Nhiếp Ảnh Nghệ Thuật',
      heroImages,
      featuredImages,
      services,
      aboutImage,
    });
  } catch (err) {
    console.error(err);
    res.render('home', {
      title: 'Dear Musé — Studio Nhiếp Ảnh Nghệ Thuật',
      heroImages,
      featuredImages,
      services: [],
      aboutImage,
    });
  }
};
