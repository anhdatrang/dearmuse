const Service = require('../models/Service');
const Portfolio = require('../models/Portfolio');

// Photo data from public/source — classified from studio photos
const allSourceImages = {
  'Cá Nhân': [
    { src: '/source/N%C3%A0ng%20th%C6%A1/H%C6%B0%E1%BB%9Bng%20d%C6%B0%C6%A1ng%20001_.webp', category: 'ca-nhan', alt: 'Chân dung hướng dương' },
    { src: '/source/C%C3%81%20NH%C3%82N/CONCEPT/SU207836(1).JPEG', category: 'ca-nhan', alt: 'Concept nghệ thuật' },
    { src: '/source/C%C3%81%20NH%C3%82N/%C3%81O%20D%C3%80I/IMG_6382.webp', category: 'ca-nhan', alt: 'Áo dài nghệ thuật' },
    { src: '/source/N%C3%A0ng%20th%C6%A1/N%C3%A0ng%20th%C6%A1%20001.webp', category: 'ca-nhan', alt: 'Nàng thơ chân dung' },
    { src: '/source/N%C3%A0ng%20th%C6%A1/N%C3%A0ng%20th%C6%A1%20002.webp', category: 'ca-nhan', alt: 'Portrait nghệ thuật' },
    { src: '/source/N%C3%A0ng%20th%C6%A1/Qu%E1%BA%A3%20chanh%20001.webp', category: 'ca-nhan', alt: 'Concept studio' },
    { src: '/source/N%C3%A0ng%20th%C6%A1/Xanh%20Xanh%20002.webp', category: 'ca-nhan', alt: 'Chân dung studio' },
    { src: '/source/C%C3%81%20NH%C3%82N/PROFILE/IMG_4925.webp', category: 'ca-nhan', alt: 'Chân dung profile' },
  ],
  'Doanh Nghiệp': [
    { src: '/source/DOANH%20NGHI%E1%BB%86P/PREMIUM/IMG_4319.webp', category: 'doanh-nghiep', alt: 'Sự kiện doanh nghiệp' },
    { src: '/source/DOANH%20NGHI%E1%BB%86P/PREMIUM/IMG_8774.webp', category: 'doanh-nghiep', alt: 'Gala doanh nghiệp' },
    { src: '/source/DOANH%20NGHI%E1%BB%86P/PREMIUM/IMG_8785.webp', category: 'doanh-nghiep', alt: 'Chân dung doanh nhân' },
    { src: '/source/DOANH%20NGHI%E1%BB%86P/PREMIUM/IMG_9947.webp', category: 'doanh-nghiep', alt: 'Sự kiện ký kết' },
    { src: '/source/DOANH%20NGHI%E1%BB%86P/PREMIUM/IMG_4271.webp', category: 'doanh-nghiep', alt: 'Hội thảo doanh nghiệp' },
  ],
  'Mở Rộng': [
    { src: '/source/M%E1%BB%9E%20R%E1%BB%98NG/S%E1%BA%A2N%20PH%E1%BA%A8M/IMG_4613.webp', category: 'mo-rong', alt: 'Chụp ảnh sản phẩm' },
    { src: '/source/M%E1%BB%9E%20R%E1%BB%98NG/S%E1%BA%A2N%20PH%E1%BA%A8M/IMG_4615.webp', category: 'mo-rong', alt: 'Lookbook thời trang' },
    { src: '/source/M%E1%BB%9E%20R%E1%BB%98NG/S%E1%BA%A2N%20PH%E1%BA%A8M/IMG_4691.webp', category: 'mo-rong', alt: 'Sản phẩm tối giản' },
    { src: '/source/M%E1%BB%9E%20R%E1%BB%98NG/S%E1%BA%A2N%20PH%E1%BA%A8M/IMG_4695.webp', category: 'mo-rong', alt: 'Nghệ thuật sắp đặt' },
  ]
};

// Hero images (best shots for fullscreen - 24 images from all 3 collections)
const heroImages = [
  // Cá Nhân
  '/source/C%C3%81%20NH%C3%82N/%C3%81O%20D%C3%80I/IMG_6366.webp',
  '/source/C%C3%81%20NH%C3%82N/%C3%81O%20D%C3%80I/IMG_6368.webp',
  '/source/C%C3%81%20NH%C3%82N/%C3%81O%20D%C3%80I/IMG_6371.webp',
  '/source/C%C3%81%20NH%C3%82N/%C3%81O%20D%C3%80I/IMG_6382.webp',
  '/source/C%C3%81%20NH%C3%82N/CONCEPT/SU207836(1).JPEG',
  '/source/C%C3%81%20NH%C3%82N/CONCEPT/SU207938(1).JPEG',
  '/source/N%C3%A0ng%20th%C6%A1/N%C3%A0ng%20th%C6%A1%20001.webp',
  '/source/N%C3%A0ng%20th%C6%A1/N%C3%A0ng%20th%C6%A1%20002.webp',
  '/source/N%C3%A0ng%20th%C6%A1/Xanh%20Xanh%20002.webp',
  '/source/C%C3%81%20NH%C3%82N/PROFILE/IMG_4925.webp',
  // Doanh Nghiệp
  '/source/DOANH%20NGHI%E1%BB%86P/PREMIUM/IMG_4319.webp',
  '/source/DOANH%20NGHI%E1%BB%86P/PREMIUM/IMG_8774.webp',
  '/source/DOANH%20NGHI%E1%BB%86P/PREMIUM/IMG_8785.webp',
  '/source/DOANH%20NGHI%E1%BB%86P/PREMIUM/IMG_9947.webp',
  '/source/DOANH%20NGHI%E1%BB%86P/PREMIUM/IMG_4271.webp',
  '/source/DOANH%20NGHI%E1%BB%86P/PREMIUM/IMG_4303.webp',
  '/source/DOANH%20NGHI%E1%BB%86P/PREMIUM/IMG_4316.webp',
  '/source/DOANH%20NGHI%E1%BB%86P/PREMIUM/IMG_8778.webp',
  // Mở Rộng
  '/source/M%E1%BB%9E%20R%E1%BB%98NG/S%E1%BA%A2N%20PH%E1%BA%A8M/IMG_4613.webp',
  '/source/M%E1%BB%9E%20R%E1%BB%98NG/S%E1%BA%A2N%20PH%E1%BA%A8M/IMG_4615.webp',
  '/source/M%E1%BB%9E%20R%E1%BB%98NG/S%E1%BA%A2N%20PH%E1%BA%A8M/IMG_4691.webp',
  '/source/M%E1%BB%9E%20R%E1%BB%98NG/S%E1%BA%A2N%20PH%E1%BA%A8M/IMG_4693.webp',
  '/source/M%E1%BB%9E%20R%E1%BB%98NG/S%E1%BA%A2N%20PH%E1%BA%A8M/IMG_4695.webp',
  '/source/M%E1%BB%9E%20R%E1%BB%98NG/S%E1%BA%A2N%20PH%E1%BA%A8M/IMG_5582.webp',
];

// Featured gallery: 15 images, mix categories
const featuredImages = [
  allSourceImages['Cá Nhân'][0],
  allSourceImages['Doanh Nghiệp'][0],
  allSourceImages['Mở Rộng'][0],
  allSourceImages['Cá Nhân'][2],
  allSourceImages['Doanh Nghiệp'][1],
  allSourceImages['Mở Rộng'][1],
  allSourceImages['Cá Nhân'][3],
  allSourceImages['Doanh Nghiệp'][2],
  allSourceImages['Mở Rộng'][2],
  allSourceImages['Cá Nhân'][1],
  allSourceImages['Doanh Nghiệp'][3],
  allSourceImages['Mở Rộng'][3],
  allSourceImages['Cá Nhân'][4],
  allSourceImages['Doanh Nghiệp'][4],
  allSourceImages['Cá Nhân'][5],
];

const aboutImage = '/source/C%C3%81%20NH%C3%82N/CONCEPT/SU207836(1).JPEG';

exports.home = async (req, res) => {
  try {
    const services = await Service.findFeatured();
    res.render('home', {
      title: 'Dear Musé — Studio Nhiếp Ảnh Nghệ Thuật tại Hà Nội',
      metaDescription: 'Dear Musé là studio nhiếp ảnh nghệ thuật chuyên nghiệp tại Hà Nội. Chuyên chụp ảnh chân dung nghệ thuật (Portrait), chụp ảnh sự kiện (Event), chụp ảnh thương hiệu & kỷ yếu cá nhân. Lưu giữ khoảnh khắc bằng ánh sáng tự nhiên và góc nhìn điện ảnh.',
      heroImages,
      featuredImages,
      services,
      aboutImage,
    });
  } catch (err) {
    console.error(err);
    res.render('home', {
      title: 'Dear Musé — Studio Nhiếp Ảnh Nghệ Thuật tại Hà Nội',
      metaDescription: 'Dear Musé là studio nhiếp ảnh nghệ thuật chuyên nghiệp tại Hà Nội. Chuyên chụp ảnh chân dung nghệ thuật (Portrait), chụp ảnh sự kiện (Event), chụp ảnh thương hiệu & kỷ yếu cá nhân. Lưu giữ khoảnh khắc bằng ánh sáng tự nhiên và góc nhìn điện ảnh.',
      heroImages,
      featuredImages,
      services: [],
      aboutImage,
    });
  }
};
