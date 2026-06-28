const db = require('../config/db');

function fixPath(str) {
  if (typeof str !== 'string') return str;
  let newStr = str;
  // 1. Fix Nàng Thơ -> Nàng thơ
  newStr = newStr.replace(/\/source\/Nàng Thơ\//g, '/source/Nàng thơ/');
  newStr = newStr.replace(/\/source\/N%C3%A0ng%20Th%C6%A1\//g, '/source/N%C3%A0ng%20th%C6%A1/');
  
  // 2. Fix ÁO DÀI -> CÁ NHÂN/ÁO DÀI
  newStr = newStr.replace(/\/source\/ÁO DÀI\//g, '/source/CÁ NHÂN/ÁO DÀI/');
  newStr = newStr.replace(/\/source\/%C3%81O%20D%C3%80I\//g, '/source/C%C3%81%20NH%C3%82N/%C3%81O%20D%C3%80I/');
  return newStr;
}

async function run() {
  try {
    console.log('🔄 Đang bắt đầu cập nhật đường dẫn ảnh trong cơ sở dữ liệu...');

    // 1. Cập nhật bảng services
    const [services] = await db.execute('SELECT id, name, cover_image FROM services');
    console.log(`\n📂 Bảng services: Tìm thấy ${services.length} bản ghi`);
    for (const service of services) {
      if (service.cover_image) {
        const fixed = fixPath(service.cover_image);
        if (fixed !== service.cover_image) {
          await db.execute('UPDATE services SET cover_image = ? WHERE id = ?', [fixed, service.id]);
          console.log(`   ✅ Đã cập nhật ảnh bìa dịch vụ "${service.name}": \n      ${service.cover_image} ➡️ ${fixed}`);
        }
      }
    }

    // 2. Cập nhật bảng portfolio
    const [portfolios] = await db.execute('SELECT id, title, cover_image, images FROM portfolio');
    console.log(`\n📂 Bảng portfolio: Tìm thấy ${portfolios.length} bản ghi`);
    for (const item of portfolios) {
      let isUpdated = false;
      let fixedCover = item.cover_image;
      if (item.cover_image) {
        fixedCover = fixPath(item.cover_image);
        if (fixedCover !== item.cover_image) {
          isUpdated = true;
        }
      }

      let fixedImages = item.images;
      try {
        let imgsArray = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
        if (Array.isArray(imgsArray)) {
          let hasImageChange = false;
          const updatedImgs = imgsArray.map(img => {
            const fixed = fixPath(img);
            if (fixed !== img) hasImageChange = true;
            return fixed;
          });
          if (hasImageChange) {
            fixedImages = updatedImgs;
            isUpdated = true;
          }
        }
      } catch (e) {
        console.error(`   ❌ Lỗi phân tích mảng images của portfolio id ${item.id}:`, e.message);
      }

      if (isUpdated) {
        await db.execute(
          'UPDATE portfolio SET cover_image = ?, images = ? WHERE id = ?',
          [fixedCover, typeof fixedImages === 'string' ? fixedImages : JSON.stringify(fixedImages || []), item.id]
        );
        console.log(`   ✅ Đã cập nhật portfolio "${item.title}" (id ${item.id})`);
      }
    }

    // 3. Cập nhật bảng blog_posts
    const [posts] = await db.execute('SELECT id, title, cover_image, images, content_blocks FROM blog_posts');
    console.log(`\n📂 Bảng blog_posts: Tìm thấy ${posts.length} bản ghi`);
    for (const post of posts) {
      let isUpdated = false;
      let fixedCover = post.cover_image;
      if (post.cover_image) {
        fixedCover = fixPath(post.cover_image);
        if (fixedCover !== post.cover_image) {
          isUpdated = true;
        }
      }

      let fixedImages = post.images;
      try {
        let imgsArray = typeof post.images === 'string' ? JSON.parse(post.images) : post.images;
        if (Array.isArray(imgsArray)) {
          let hasImageChange = false;
          const updatedImgs = imgsArray.map(img => {
            const fixed = fixPath(img);
            if (fixed !== img) hasImageChange = true;
            return fixed;
          });
          if (hasImageChange) {
            fixedImages = updatedImgs;
            isUpdated = true;
          }
        }
      } catch (e) {
        console.error(`   ❌ Lỗi phân tích mảng images của blog id ${post.id}:`, e.message);
      }

      let fixedBlocks = post.content_blocks;
      try {
        let blocksArray = typeof post.content_blocks === 'string' ? JSON.parse(post.content_blocks) : post.content_blocks;
        if (Array.isArray(blocksArray)) {
          let hasBlockChange = false;
          const updatedBlocks = blocksArray.map(block => {
            if (block.type === 'image' && block.value) {
              const fixed = fixPath(block.value);
              if (fixed !== block.value) {
                block.value = fixed;
                hasBlockChange = true;
              }
            } else if (block.type === '3' && block.images && Array.isArray(block.images)) {
              // Custom layout grids of images
              block.images = block.images.map(imgObj => {
                if (imgObj.url) {
                  const fixed = fixPath(imgObj.url);
                  if (fixed !== imgObj.url) {
                    imgObj.url = fixed;
                    hasBlockChange = true;
                  }
                }
                return imgObj;
              });
            } else if (block.images && Array.isArray(block.images)) {
              // General list of images in a block (e.g. grids / sections)
              block.images = block.images.map(img => {
                if (typeof img === 'string') {
                  const fixed = fixPath(img);
                  if (fixed !== img) {
                    hasBlockChange = true;
                    return fixed;
                  }
                } else if (img && img.image) {
                  const fixed = fixPath(img.image);
                  if (fixed !== img.image) {
                    hasBlockChange = true;
                    img.image = fixed;
                  }
                }
                return img;
              });
            }
            if (block.image) {
              const fixed = fixPath(block.image);
              if (fixed !== block.image) {
                block.image = fixed;
                hasBlockChange = true;
              }
            }
            return block;
          });
          if (hasBlockChange) {
            fixedBlocks = updatedBlocks;
            isUpdated = true;
          }
        }
      } catch (e) {
        console.error(`   ❌ Lỗi phân tích content_blocks của blog id ${post.id}:`, e.message);
      }

      if (isUpdated) {
        await db.execute(
          'UPDATE blog_posts SET cover_image = ?, images = ?, content_blocks = ? WHERE id = ?',
          [
            fixedCover, 
            typeof fixedImages === 'string' ? fixedImages : JSON.stringify(fixedImages || []), 
            typeof fixedBlocks === 'string' ? fixedBlocks : JSON.stringify(fixedBlocks || []), 
            post.id
          ]
        );
        console.log(`   ✅ Đã cập nhật bài viết blog "${post.title}" (id ${post.id})`);
      }
    }

    console.log('\n🎉 Hoàn thành cập nhật đường dẫn ảnh trong cơ sở dữ liệu!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Lỗi khi cập nhật cơ sở dữ liệu:', error);
    process.exit(1);
  }
}

run();
