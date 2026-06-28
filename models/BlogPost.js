const db = require('../config/db');

class BlogPost {
  static async findAll(category) {
    let query = `SELECT * FROM blog_posts WHERE status = 'published'`;
    const params = [];
    if (category && category !== 'all') {
      query += ` AND category = ?`;
      params.push(category);
    }
    query += ` ORDER BY created_at DESC`;
    const [rows] = await db.execute(query, params);
    return rows;
  }

  // To display all including drafts in admin panel
  static async findAllAdmin() {
    const [rows] = await db.execute(`SELECT * FROM blog_posts ORDER BY created_at DESC`);
    return rows;
  }

  static async findFeatured(limit = 3) {
    const [rows] = await db.execute(
      `SELECT * FROM blog_posts WHERE is_featured = 1 AND status = 'published' ORDER BY created_at DESC LIMIT ?`,
      [limit]
    );
    return rows;
  }

  static async findBySlug(slug) {
    const [rows] = await db.execute(`SELECT * FROM blog_posts WHERE slug = ?`, [slug]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.execute(`SELECT * FROM blog_posts WHERE id = ?`, [id]);
    return rows[0];
  }

  static async create(data) {
    const [result] = await db.execute(
      `INSERT INTO blog_posts (title, slug, category, subtitle, client_name, location, photographer, concept, quote, summary, content, content_outro, content_blocks, cover_image, images, is_featured, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.title,
        data.slug,
        data.category || 'news',
        data.subtitle || null,
        data.client_name || null,
        data.location || null,
        data.photographer || null,
        data.concept || null,
        data.quote || null,
        data.summary,
        data.content,
        data.content_outro || null,
        JSON.stringify(data.content_blocks || []),
        data.cover_image,
        JSON.stringify(data.images || []),
        data.is_featured || 0,
        data.status || 'published'
      ]
    );
    return result.insertId;
  }

  static async update(id, data) {
    await db.execute(
      `UPDATE blog_posts SET title=?, category=?, subtitle=?, client_name=?, location=?, photographer=?, concept=?, quote=?, summary=?, content=?, content_outro=?, content_blocks=?, cover_image=?, images=?, is_featured=?, status=? WHERE id=?`,
      [
        data.title,
        data.category || 'news',
        data.subtitle || null,
        data.client_name || null,
        data.location || null,
        data.photographer || null,
        data.concept || null,
        data.quote || null,
        data.summary,
        data.content,
        data.content_outro || null,
        JSON.stringify(data.content_blocks || []),
        data.cover_image,
        JSON.stringify(data.images || []),
        data.is_featured || 0,
        data.status || 'published',
        id
      ]
    );
  }

  static async delete(id) {
    await db.execute(`DELETE FROM blog_posts WHERE id = ?`, [id]);
  }
}

module.exports = BlogPost;
