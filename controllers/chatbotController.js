const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/db');

// Helper to get setting from database with fallback to process.env
async function getSetting(key) {
  try {
    const [rows] = await db.query('SELECT setting_value FROM settings WHERE setting_key = ?', [key]);
    if (rows.length > 0 && rows[0].setting_value) {
      return rows[0].setting_value.trim();
    }
  } catch (error) {
    console.error(`Error fetching setting ${key} from DB:`, error);
  }
  
  // Fallback to process.env
  const envKey = key.toUpperCase();
  return process.env[envKey] || '';
}

// Text normalization helper for Vietnamese
function normalizeText(text) {
  if (!text) return '';
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accent marks
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s]/g, '') // keep only alphanumeric and spaces
    .trim();
}

// Calculate Jaccard similarity index between two strings (word-based)
function getJaccardSimilarity(str1, str2) {
  const words1 = new Set(normalizeText(str1).split(/\s+/).filter(Boolean));
  const words2 = new Set(normalizeText(str2).split(/\s+/).filter(Boolean));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

// Search for the best match in the local FAQ JSON database
function findBestLocalMatch(message, threshold = 0.35) {
  const faqPath = path.join(__dirname, '../chatbot_data/faqs.json');
  if (!fs.existsSync(faqPath)) {
    console.warn(`Local FAQs file not found at: ${faqPath}`);
    return null;
  }

  try {
    const faqs = JSON.parse(fs.readFileSync(faqPath, 'utf8'));
    let bestMatch = null;
    let highestScore = 0;

    for (const faq of faqs) {
      for (const pattern of faq.patterns) {
        const score = getJaccardSimilarity(message, pattern);
        if (score > highestScore) {
          highestScore = score;
          bestMatch = faq;
        }
      }
    }

    if (highestScore >= threshold) {
      console.log(`🎯 Local FAQ match found! Intent: ${bestMatch.intent}, Score: ${highestScore.toFixed(3)} (Threshold: ${threshold})`);
      return bestMatch.response;
    }
  } catch (err) {
    console.error('Error matching local FAQs:', err);
  }
  return null;
}

// Format history for Gemini SDK
function formatHistoryForGemini(history) {
  let formattedHistory = [];
  if (Array.isArray(history)) {
    const recentHistory = history.slice(-10);
    formattedHistory = recentHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));
    
    // Google Generative AI requires history to start with a 'user' message
    while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
      formattedHistory.shift();
    }
  }
  return formattedHistory;
}

// Call Google Generative AI Gemini API
async function callGemini(apiKey, message, formattedHistory, fullSystemInstruction) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    systemInstruction: fullSystemInstruction
  });

  const chatSession = model.startChat({
    history: formattedHistory
  });

  const result = await chatSession.sendMessage(message);
  const response = await result.response;
  return response.text();
}

// Call Groq Llama 3 API
async function callGroq(apiKey, message, history, fullSystemInstruction) {
  let messages = [
    { role: 'system', content: fullSystemInstruction }
  ];
  
  if (Array.isArray(history)) {
    const recentHistory = history.slice(-10);
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      });
    });
  }
  
  messages.push({ role: 'user', content: message });

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: messages,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  if (data.choices && data.choices[0] && data.choices[0].message) {
    return data.choices[0].message.content;
  }
  throw new Error('Invalid response from Groq API');
}

// Auto link package names mentioned in chatbot responses to their respective detail pages
function autoLinkPackages(text) {
  if (!text) return text;
  
  const packageLinks = [
    { name: 'Gói Concept Áo Dài - Cổ Đô (Premium)', url: '/services/portrait-concept' },
    { name: 'Gói Concept Áo Dài - Cổ Đô', url: '/services/portrait-concept' },
    { name: 'Concept Áo Dài - Cổ Đô', url: '/services/portrait-concept' },
    
    { name: 'Gói Concept Nghệ Thuật - Tinh Sương (Premium)', url: '/services/portrait-concept' },
    { name: 'Gói Concept Nghệ Thuật - Tinh Sương', url: '/services/portrait-concept' },
    { name: 'Concept Nghệ Thuật - Tinh Sương', url: '/services/portrait-concept' },
    
    { name: 'Gói Concept Áo Dài - Nhánh Sen (Basic)', url: '/services/portrait-concept' },
    { name: 'Gói Concept Áo Dài - Nhánh Sen', url: '/services/portrait-concept' },
    { name: 'Concept Áo Dài - Nhánh Sen', url: '/services/portrait-concept' },
    
    { name: 'Gói Concept Nghệ Thuật - Nhành Thơ (Basic)', url: '/services/portrait-concept' },
    { name: 'Gói Concept Nghệ Thuật - Nhành Thơ', url: '/services/portrait-concept' },
    { name: 'Concept Nghệ Thuật - Nhành Thơ', url: '/services/portrait-concept' },
    
    { name: 'Gói Profile Basic (Cá Nhân)', url: '/services/portrait-profile' },
    { name: 'Gói Profile Basic', url: '/services/portrait-profile' },
    { name: 'Profile Basic', url: '/services/portrait-profile' },
    
    { name: 'Gói Executive Profile (Premium)', url: '/services/portrait-profile' },
    { name: 'Gói Executive Profile', url: '/services/portrait-profile' },
    { name: 'Executive Profile', url: '/services/portrait-profile' },
    
    { name: 'Gói Chạm Sáng', url: '/services/concept-cham' },
    { name: 'Gói Chạm', url: '/services/concept-cham' },
    
    { name: 'Gói Khắc Họa Chân Dung', url: '/services/concept-khac' },
    { name: 'Gói Khắc', url: '/services/concept-khac' },
    
    { name: 'Gói Ấn Tượng Siêu Thực', url: '/services/concept-an' },
    { name: 'Gói Ấn', url: '/services/concept-an' },
    
    { name: 'Gói Kỷ Yếu', url: '/services/portrait-ky-yeu' },
    
    { name: 'Gói Nửa Ngày (4 Tiếng)', url: '/services/event-basic' },
    { name: 'Gói Cả Ngày (8 Tiếng)', url: '/services/event-basic' },
    { name: 'Gói Nửa Ngày', url: '/services/event-basic' },
    { name: 'Gói Cả Ngày', url: '/services/event-basic' },
    
    { name: 'Gói Gold (Nửa Ngày)', url: '/services/event-premium' },
    { name: 'Gói Platinum (Cả Ngày)', url: '/services/event-premium' },
    { name: 'Gói Gold', url: '/services/event-premium' },
    { name: 'Gói Platinum', url: '/services/event-premium' }
  ];
  
  let linkedText = text;
  
  for (const item of packageLinks) {
    const escapedName = item.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    // regex matches the name when it is not part of a markdown link [**name**](url) or similar
    const regex = new RegExp(`(?<!\\[\\*\\*|\\*\\*)${escapedName}(?!\\*\\*|\\s*\\*\\*\\s*\\]\\()`, 'gi');
    
    linkedText = linkedText.replace(regex, (match) => {
      return `[**${match}**](${item.url})`;
    });
  }
  
  return linkedText;
}

exports.chat = async (req, res) => {
  const { message, history } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  // 1. Kiểm tra từ khóa cục bộ có độ khớp cao trước (Local FAQ Match - High Threshold)
  // để tối ưu tốc độ, tiết kiệm token và đảm bảo độ chính xác
  let localReply = findBestLocalMatch(message, 0.35);
  if (localReply) {
    localReply = autoLinkPackages(localReply);
    return res.json({ response: localReply });
  }

  try {
    // Đọc System Prompt hướng dẫn
    const systemPromptPath = path.join(__dirname, '../chatbot_data/system_prompt.txt');
    let systemPrompt = '';
    if (fs.existsSync(systemPromptPath)) {
      systemPrompt = fs.readFileSync(systemPromptPath, 'utf8');
    }

    // Đọc toàn bộ các file kiến thức trong thư mục knowledge
    const knowledgeDir = path.join(__dirname, '../chatbot_data/knowledge');
    let knowledgeData = '\n\nDỮ LIỆU KIẾN THỨC CỦA CỬA HÀNG (CHỈ TRẢ LỜI DỰA TRÊN THÔNG TIN NÀY):\n';
    
    if (fs.existsSync(knowledgeDir)) {
      const files = fs.readdirSync(knowledgeDir);
      for (const file of files) {
        if (file.endsWith('.txt')) {
          const filePath = path.join(knowledgeDir, file);
          const content = fs.readFileSync(filePath, 'utf8');
          knowledgeData += `\n--- [Bắt đầu tệp: ${file}] ---\n${content}\n--- [Kết thúc tệp: ${file}] ---\n`;
        }
      }
    }

    // Gộp prompt chỉ thị hệ thống và dữ liệu cửa hàng làm ngữ cảnh duy nhất
    const fullSystemInstruction = systemPrompt + knowledgeData;

    // Đọc các API Key từ DB
    const primaryGeminiKey = await getSetting('gemini_api_key');
    const fallbackGeminiKey = await getSetting('gemini_api_key_fallback');
    const groqKey = await getSetting('groq_api_key');

    let replyText = '';
    let success = false;

    // A. Thử Gemini API Key chính
    if (primaryGeminiKey && primaryGeminiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
      try {
        console.log('🤖 Thử gọi Gemini API chính...');
        const formattedHistory = formatHistoryForGemini(history);
        replyText = await callGemini(primaryGeminiKey, message, formattedHistory, fullSystemInstruction);
        success = true;
        console.log('✅ Gemini API chính trả lời thành công!');
      } catch (err) {
        console.error('❌ Lỗi Gemini API chính:', err.message);
      }
    }

    // B. Thử Gemini API Key phụ
    if (!success && fallbackGeminiKey && fallbackGeminiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
      try {
        console.log('🤖 Thử gọi Gemini API phụ (Fallback)...');
        const formattedHistory = formatHistoryForGemini(history);
        replyText = await callGemini(fallbackGeminiKey, message, formattedHistory, fullSystemInstruction);
        success = true;
        console.log('✅ Gemini API phụ trả lời thành công!');
      } catch (err) {
        console.error('❌ Lỗi Gemini API phụ:', err.message);
      }
    }

    // C. Thử Groq API
    if (!success && groqKey) {
      try {
        console.log('🤖 Thử gọi Groq API (Fallback)...');
        replyText = await callGroq(groqKey, message, history, fullSystemInstruction);
        success = true;
        console.log('✅ Groq API trả lời thành công!');
      } catch (err) {
        console.error('❌ Lỗi Groq API:', err.message);
      }
    }

    // D. Xử lý khi toàn bộ API đều lỗi
    if (!success) {
      console.warn('⚠️ Toàn bộ API AI đều lỗi, thử tìm so khớp mềm từ khóa cục bộ...');
      
      // Thử tìm kiếm cục bộ với ngưỡng thấp hơn để cứu vớt hội thoại
      const fallbackLocalReply = findBestLocalMatch(message, 0.15);
      if (fallbackLocalReply) {
        replyText = fallbackLocalReply;
      } else {
        // Trả lời mặc định lịch sự
        replyText = `Dạ, hiện tại hệ thống AI tư vấn tự động của Dear Musé đang trong quá trình bảo trì và cập nhật. 

Bạn vui lòng liên hệ nhanh với bên em qua:
• Hotline/Zalo hỗ trợ 24/7: **0912 345 678**
• Hoặc để lại lời nhắn trực tiếp tại trang **[Liên Hệ](/contact)** để nhân viên tư vấn hỗ trợ mình nhanh nhất nhé!

Dear Musé rất xin lỗi vì sự bất tiện này và chúc bạn một ngày tốt lành! 🥰`;
      }
    }

    // Tự động chuyển các tên gói chụp thành link liên kết trước khi trả về
    replyText = autoLinkPackages(replyText);

    res.json({ response: replyText });

  } catch (error) {
    console.error('Chatbot Controller Critical error:', error);
    res.status(500).json({ 
      response: 'Dạ, em gặp một chút trục trặc khi xử lý tin nhắn. Bạn vui lòng thử lại sau nhé! 😭' 
    });
  }
};



