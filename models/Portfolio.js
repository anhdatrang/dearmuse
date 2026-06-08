const db = require('../config/db');

class Portfolio {
  static async findAll(category) {
    let query = `SELECT * FROM portfolio`;
    const params = [];
    if (category && category !== 'all') {
      query += ` WHERE category = ?`;
      params.push(category);
    }
    query += ` ORDER BY sort_order ASC, created_at DESC`;
    const [rows] = await db.execute(query, params);
    return rows;
  }

  static async findFeatured(limit = 9) {
    const [rows] = await db.execute(
      `SELECT * FROM portfolio WHERE is_featured = 1 ORDER BY sort_order ASC LIMIT ?`, [limit]
    );
    return rows;
  }

  static async findBySlug(slug) {
    const [rows] = await db.execute(`SELECT * FROM portfolio WHERE slug = ?`, [slug]);
    return rows[0];
  }

  static async create(data) {
    const [result] = await db.execute(
      `INSERT INTO portfolio (title, slug, category, description, cover_image, images, shoot_date, is_featured, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.title, data.slug, data.category, data.description, data.cover_image,
       JSON.stringify(data.images || []), data.shoot_date, data.is_featured || 0, data.sort_order || 0]
    );
    return result.insertId;
  }

  static async update(id, data) {
    await db.execute(
      `UPDATE portfolio SET title=?, category=?, description=?, cover_image=?, images=?, is_featured=?, sort_order=? WHERE id=?`,
      [data.title, data.category, data.description, data.cover_image,
       JSON.stringify(data.images || []), data.is_featured || 0, data.sort_order || 0, id]
    );
  }

  static async delete(id) {
    await db.execute(`DELETE FROM portfolio WHERE id = ?`, [id]);
  }
}

module.exports = Portfolio;
