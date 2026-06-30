require('dotenv').config();
const db = require('../config/db');

async function testAPI() {
  try {
    const [rows] = await db.query('SELECT setting_key, setting_value FROM settings');
    const settings = {};
    rows.forEach(r => settings[r.setting_key] = r.setting_value);

    const apiUrl = settings.api_url;
    const password = settings.api_password;
    const token = settings.api_token;
    const stk = settings.bank_account_no;

    console.log('--- Cấu hình hiện tại ---');
    console.log('API URL:', apiUrl);
    console.log('Password:', password ? '***' : 'Chưa nhập');
    console.log('Token:', token ? '***' : 'Chưa nhập');
    console.log('STK:', stk);

    if (!apiUrl || !password || !token || !stk) {
      console.log('❌ Vui lòng điền đủ cấu hình trong Admin.');
      return;
    }

    let finalUrl = apiUrl;
    if (finalUrl.includes('{PASSWORD}')) {
      finalUrl = finalUrl.replace('{PASSWORD}', password).replace('{STK}', stk).replace('{TOKEN}', token);
    } else {
      if (!finalUrl.endsWith('/')) finalUrl += '/';
      finalUrl += `${password}/${stk}/${token}`;
    }

    console.log('\n📡 Đang gọi API tới:', finalUrl.replace(password, '***').replace(token, '***'));
    
    const response = await fetch(finalUrl);
    const data = await response.json();
    
    console.log('\n📩 Kết quả API trả về:');
    console.log(JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('❌ Lỗi:', err.message);
  } finally {
    process.exit(0);
  }
}

testAPI();
