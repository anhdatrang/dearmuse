require('dotenv').config();
const mysql = require('mysql2/promise');

async function addApiSettings() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_NAME || 'dear_muse',
      charset: 'utf8mb4',
    });

    console.log('⏳ Đang thêm các cài đặt API Key vào bảng settings...');

    const settingsToInsert = [
      {
        key: 'gemini_api_key',
        value: process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE',
        desc: 'Gemini API Key chính dùng cho chatbot',
      },
      {
        key: 'gemini_api_key_fallback',
        value: '',
        desc: 'Gemini API Key dự phòng khi key chính hết hạn mức',
      },
      {
        key: 'groq_api_key',
        value: '',
        desc: 'Groq API Key dùng làm AI dự phòng (Llama 3)',
      }
    ];

    for (const setting of settingsToInsert) {
      // Check if setting already exists
      const [rows] = await conn.query('SELECT id FROM settings WHERE setting_key = ?', [setting.key]);
      if (rows.length === 0) {
        await conn.query(
          'INSERT INTO settings (setting_key, setting_value, description) VALUES (?, ?, ?)',
          [setting.key, setting.value, setting.desc]
        );
        console.log(`✅ Đã thêm cài đặt: ${setting.key}`);
      } else {
        console.log(`ℹ️ Cài đặt ${setting.key} đã tồn tại trong database.`);
      }
    }

    await conn.end();
    console.log('🎉 Hoàn thành cấu hình settings!');
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  }
}

addApiSettings();
