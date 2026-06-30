const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/concepts.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace extensions
content = content.replace(/\.JPG/g, '.webp')
                 .replace(/\.JPEG/g, '.webp')
                 .replace(/\.jpg/g, '.webp')
                 .replace(/\.jpeg/g, '.webp');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed extensions in concepts.js');
