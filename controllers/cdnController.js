const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Helper to find file case-insensitively and unicode-safely on Linux
function resolveRealFilePath(baseDir, relativePath) {
  const parts = relativePath.split(/[/\\]/).filter(p => p);
  let currentPath = baseDir;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!fs.existsSync(currentPath)) return null;
    
    const exactPath = path.join(currentPath, part);
    if (fs.existsSync(exactPath)) {
      currentPath = exactPath;
      continue;
    }
    
    const entries = fs.readdirSync(currentPath);
    const lowerPartNFC = part.normalize('NFC').toLowerCase();
    const lowerPartNFD = part.normalize('NFD').toLowerCase();
    
    let match = entries.find(e => {
      const eNFC = e.normalize('NFC').toLowerCase();
      const eNFD = e.normalize('NFD').toLowerCase();
      return eNFC === lowerPartNFC || eNFD === lowerPartNFD || e.toLowerCase() === part.toLowerCase();
    });
    
    // Fallback: If it's the last part (a file) and not found, try replacing the extension with .webp
    if (!match && i === parts.length - 1) {
      const parsedPart = path.parse(part);
      if (parsedPart.ext && parsedPart.ext.toLowerCase() !== '.webp') {
        const webpPart = parsedPart.name + '.webp';
        const webpLowerNFC = webpPart.normalize('NFC').toLowerCase();
        const webpLowerNFD = webpPart.normalize('NFD').toLowerCase();
        
        match = entries.find(e => {
          const eNFC = e.normalize('NFC').toLowerCase();
          const eNFD = e.normalize('NFD').toLowerCase();
          return eNFC === webpLowerNFC || eNFD === webpLowerNFD || e.toLowerCase() === webpPart.toLowerCase();
        });
      }
    }
    
    if (match) {
      currentPath = path.join(currentPath, match);
    } else {
      return null;
    }
  }
  return currentPath;
}

exports.serveImage = async (req, res) => {
  const src = req.query.src;
  const w = parseInt(req.query.w) || 800;
  
  if (!src) return res.status(400).send('Missing src parameter');

  // Decode URI component just in case
  const decodedSrc = decodeURIComponent(src);

  // Construct absolute path to the original file
  const publicDir = path.join(__dirname, '../public');
  
  // Resolve path safely
  const normalizedSrc = path.normalize(decodedSrc).replace(/^(\.\.[\/\\])+/, '');
  
  // Security check: ensure it doesn't traverse out
  const intendedPath = path.join(publicDir, normalizedSrc);
  if (!intendedPath.startsWith(publicDir)) {
    return res.status(403).send('Forbidden');
  }

  // Smart resolve for Linux (Case-insensitive & NFC/NFD safe)
  const originalPath = resolveRealFilePath(publicDir, normalizedSrc);

  if (!originalPath) {
    return res.status(404).send('Image not found');
  }

  // Create cache directory if it doesn't exist
  const cacheDir = path.join(publicDir, 'cache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  // Generate a unique filename for the cached version
  // Example: /source/Nàng thơ/001.webp -> Nàng thơ_001_800.webp
  const fileName = path.basename(originalPath, path.extname(originalPath));
  const ext = path.extname(originalPath);
  
  // Use a simple hash or just replace slashes to make it unique across folders
  const safePathStr = normalizedSrc.replace(/[\/\\]/g, '_');
  const cacheFile = path.join(cacheDir, `${w}_${safePathStr}`);

  // Check if cached file exists
  if (fs.existsSync(cacheFile)) {
    // Send cached file and set long cache headers
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.sendFile(cacheFile);
  }

  try {
    // Generate new cached image
    await sharp(originalPath)
      .resize({ width: w, withoutEnlargement: true })
      .toFile(cacheFile);
      
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.sendFile(cacheFile);
  } catch (err) {
    console.error('Image CDN Error:', err);
    // Fallback to original image if sharp fails
    res.sendFile(originalPath);
  }
};
