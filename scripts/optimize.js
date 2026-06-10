const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DIRS = [
  path.join(__dirname, '../public/source'),
  path.join(__dirname, '../public/logo'),
  path.join(__dirname, '../public/uploads')
];

const MAX_WIDTH = 1920;

async function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (let entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.endsWith('_backup')) {
         await processDirectory(fullPath);
      }
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        await optimizeImage(fullPath, ext);
      }
    }
  }
}

async function optimizeImage(filePath, ext) {
  try {
    const tempPath = filePath + '.tmp';
    
    // Read metadata to check width
    const metadata = await sharp(filePath).metadata();
    
    let pipeline = sharp(filePath);
    
    // Resize if too wide
    if (metadata.width > MAX_WIDTH) {
      pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
    }
    
    // Compress
    if (ext === '.jpg' || ext === '.jpeg') {
      pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true });
    } else if (ext === '.png') {
      pipeline = pipeline.png({ quality: 80, compressionLevel: 8 });
    }

    await pipeline.toFile(tempPath);
    
    // Replace original
    fs.renameSync(tempPath, filePath);
    console.log(`Optimized: ${filePath}`);
  } catch (err) {
    console.error(`Error processing ${filePath}:`, err);
  }
}

async function main() {
  console.log('Starting optimization...');
  for (const dir of DIRS) {
    console.log(`Processing directory: ${dir}`);
    await processDirectory(dir);
  }
  console.log('Optimization complete!');
}

main();
