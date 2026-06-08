const db = require('../config/db');

class Service {
  static async findAll() {
    const [rows] = await db.execute(`SELECT * FROM services ORDER BY sort_order ASC`);
    return rows;
  }

  static async findFeatured() {
    const [rows] = await db.execute(`SELECT * FROM services WHERE is_featured = 1 ORDER BY sort_order ASC`);
    return rows;
  }

  static async findBySlug(slug) {
    const [rows] = await db.execute(`SELECT * FROM services WHERE slug = ?`, [slug]);
    return rows[0];
  }

  static async findById(id) {
    const [rows] = await db.execute(`SELECT * FROM services WHERE id = ?`, [id]);
    return rows[0];
  }
}

module.exports = Service;
