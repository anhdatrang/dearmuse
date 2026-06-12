const db = require('../config/db');

class Analytics {
  /**
   * Log an event into the tracking database
   */
  static async logEvent(eventType, eventValue, ipAddress, location) {
    const [result] = await db.execute(
      `INSERT INTO analytics_events (event_type, event_value, ip_address, location) VALUES (?, ?, ?, ?)`,
      [eventType, eventValue, ipAddress, location]
    );
    return result;
  }

  /**
   * Get total event counts grouped by event type
   */
  static async getSummary() {
    const [rows] = await db.execute(
      `SELECT event_type, COUNT(*) as count FROM analytics_events GROUP BY event_type`
    );
    const summary = { page_view: 0, click_booking: 0, submit_contact: 0, click_concept: 0 };
    rows.forEach(r => {
      if (r.event_type in summary) {
        summary[r.event_type] = r.count;
      }
    });
    return summary;
  }

  /**
   * Get top clicked concepts
   */
  static async getTopConcepts() {
    const [rows] = await db.execute(
      `SELECT event_value as concept, COUNT(*) as count 
       FROM analytics_events 
       WHERE event_type = 'click_concept' 
       GROUP BY event_value 
       ORDER BY count DESC`
    );
    return rows;
  }

  /**
   * Get top locations (provinces)
   */
  static async getTopLocations() {
    const [rows] = await db.execute(
      `SELECT location, COUNT(*) as count 
       FROM analytics_events 
       WHERE location IS NOT NULL AND location != ''
       GROUP BY location 
       ORDER BY count DESC`
    );
    return rows;
  }

  /**
   * Get event timeline for the last 14 days
   */
  static async getTimeline() {
    const [rows] = await db.execute(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(*) as count 
       FROM analytics_events 
       GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d') 
       ORDER BY date ASC 
       LIMIT 14`
    );
    return rows;
  }
}

module.exports = Analytics;
