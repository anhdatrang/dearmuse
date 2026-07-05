const db = require('../config/db');

class Contact {
  static async create(data) {
    const [result] = await db.execute(
      `INSERT INTO contacts (name, phone, email, subject, message) VALUES (?, ?, ?, ?, ?)`,
      [data.name, data.phone || null, data.email || null, data.subject || null, data.message]
    );
    return result.insertId;
  }

  static async findAll(onlyUnread = false) {
    let query = `SELECT * FROM contacts`;
    if (onlyUnread) query += ` WHERE is_read = 0`;
    query += ` ORDER BY created_at DESC`;
    const [rows] = await db.execute(query);
    return rows;
  }

  static async markRead(id) {
    await db.execute(`UPDATE contacts SET is_read = 1 WHERE id = ?`, [id]);
  }

  static async countUnread() {
    const [rows] = await db.execute(`SELECT COUNT(*) as count FROM contacts WHERE is_read = 0`);
    return rows[0].count;
  }

  static async updateNotes(id, admin_note, assigned_to) {
    await db.execute(`UPDATE contacts SET admin_note = ?, assigned_to = ? WHERE id = ?`, [admin_note, assigned_to, id]);
  }
}

module.exports = Contact;
