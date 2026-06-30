require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'dear_muse',
    charset: 'utf8mb4',
  });

  try {
    console.log('Checking members table...');
    await conn.query(`
      ALTER TABLE members 
      ADD COLUMN full_name VARCHAR(255),
      ADD COLUMN dob DATE,
      ADD COLUMN id_card VARCHAR(50),
      ADD COLUMN is_card_active TINYINT(1) DEFAULT 0
    `);
    console.log('Successfully added full_name, dob, id_card, is_card_active to members table.');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist.');
    } else {
      console.error('Error adding columns:', err);
    }
  }

  await conn.end();
}

migrate();
