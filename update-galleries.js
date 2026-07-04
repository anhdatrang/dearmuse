const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  const absoluteDir = path.resolve(__dirname, dir);
  if (!fs.existsSync(absoluteDir)) return [];
  const files = fs.readdirSync(absoluteDir);
  return files
    .filter(f => f.match(/\.(jpg|jpeg|png|webp)$/i))
    .map(f => ('/source/' + dir.replace('public/source/', '') + '/' + f).replace(/\\/g, '/'));
}

const conceptsMap = {
  'event-basic': 'public/source/DOANH NGHIỆP/PREMIUM',
  'event-premium': 'public/source/DOANH NGHIỆP/PREMIUM',
  'portrait-ao-dai': 'public/source/CÁ NHÂN/ÁO DÀI',
  'portrait-concept': 'public/source/CÁ NHÂN/CONCEPT',
  'portrait-profile': 'public/source/CÁ NHÂN/PROFILE',
  'portrait-ky-yeu': 'public/source/CÁ NHÂN/KỶ YẾU',
  'concept-cham': 'public/source/MỞ RỘNG/SẢN PHẨM',
  'concept-khac': 'public/source/MỞ RỘNG/SẢN PHẨM',
  'concept-an': 'public/source/MỞ RỘNG/SẢN PHẨM'
};

const conceptsPath = path.resolve(__dirname, 'data/concepts.js');
// Read the existing file and execute it to get the concepts array
const conceptsCode = fs.readFileSync(conceptsPath, 'utf8');
const match = conceptsCode.match(/const concepts = (\[[\s\S]*?\]);\s*module.exports/);
let concepts;
if (match) {
  concepts = eval(match[1]);
} else {
  // If parsing fails, use require (might be risky if we just overwrote it poorly)
  concepts = require('./data/concepts.js').concepts;
}

// Ensure portrait-ky-yeu exists
const existingIds = concepts.map(c => c.id);
if (!existingIds.includes('portrait-ky-yeu')) {
  concepts.push({
    id: 'portrait-ky-yeu',
    name: 'Kỷ Yếu',
    category: 'ca-nhan',
    categoryLabel: 'Cá Nhân',
    subtitle: 'Ghi lại cột mốc thanh xuân rực rỡ và những kỷ niệm đáng nhớ',
    coverImage: '/source/CÁ NHÂN/KỶ YẾU/IMG6799.jpg',
    description: 'Chụp ảnh kỷ yếu cùng Dear Musé không chỉ là những bức ảnh kỷ niệm, mà là một trải nghiệm thanh xuân. Chúng tôi tập trung vào cảm xúc thật, những nụ cười trong trẻo và khoảnh khắc đáng nhớ nhất của tuổi học trò.',
    gallery: [],
    pricing: [
      {
        packageName: 'Gói Kỷ Yếu',
        price: '1.800.000đ',
        inclusions: [
          'Chụp ngoại cảnh hoặc studio',
          'Hỗ trợ trang phục kỷ yếu',
          'Trả toàn bộ file gốc',
          'Retouch 15 ảnh đặc sắc'
        ]
      }
    ],
    addons: []
  });
}

// Update galleries
concepts.forEach(c => {
  const folder = conceptsMap[c.id];
  if (folder) {
    const files = getFiles(folder);
    if (files.length > 0) {
      // Encode URL segments so it matches what we have
      c.gallery = files.map(f => f.split('/').map(segment => encodeURIComponent(segment)).join('/').replace(/%2F/g, '/'));
      // Update cover image to first one if needed, or leave it.
      if (c.id === 'portrait-ky-yeu') {
         // find IMG6799
         const match = c.gallery.find(img => img.includes('IMG6799'));
         if (match) c.coverImage = match;
      }
    }
  }
});

const newContent = `// data/concepts.js
// Dữ liệu chi tiết cho 9 Concept chụp ảnh của Dear Musé Studio (Đã cập nhật cấu trúc Cá Nhân mới)

const concepts = ${JSON.stringify(concepts, null, 2)};

module.exports = {
  concepts,
  findById: (id) => concepts.find(c => c.id === id),
  findByCategory: (category) => concepts.filter(c => c.category === category)
};
`;

fs.writeFileSync(conceptsPath, newContent);
console.log('Successfully updated concepts.js');
