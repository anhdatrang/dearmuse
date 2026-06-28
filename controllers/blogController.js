const BlogPost = require('../models/BlogPost');

exports.index = async (req, res) => {
  try {
    const category = req.query.category || 'all';
    const posts = await BlogPost.findAll(category);

    let catLabel = 'Tất cả';
    if (category === 'news') catLabel = 'Tin tức studio';
    else if (category === 'customer_photos') catLabel = 'Ảnh khách hàng';

    res.render('blog/index', {
      title: `Blog Tin Tức & Hình Ảnh ${catLabel} — Dear Musé`,
      metaDescription: `Cập nhật tin tức mới nhất từ Dear Musé Studio và chiêm ngưỡng những bộ ảnh nghệ thuật, khoảnh khắc đáng nhớ của các nàng thơ và khách hàng của chúng tôi.`,
      posts,
      activeCategory: category,
      pageCss: 'blog.css'
    });
  } catch (err) {
    console.error('Error in blog public index:', err);
    res.redirect('/');
  }
};

exports.detail = async (req, res) => {
  try {
    const post = await BlogPost.findBySlug(req.params.slug);
    if (!post) return res.redirect('/blog');

    // Clean and slice content/summary for meta tags
    const descText = post.summary 
      ? post.summary.substring(0, 155) + '...'
      : `Xem bài viết "${post.title}" đăng tại Blog Dear Musé Studio.`;

    res.render('blog/detail', {
      title: `${post.title} — Blog — Dear Musé`,
      metaDescription: descText,
      ogImage: post.cover_image || '',
      post,
      pageCss: 'blog.css'
    });
  } catch (err) {
    console.error('Error in blog public detail:', err);
    res.redirect('/blog');
  }
};
