const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.chat = async (req, res) => {
  const { message, history } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    return res.json({ 
      response: 'Dạ, hiện tại em chưa kết nối được với não bộ AI (Thiếu Gemini API Key). Bạn vui lòng bổ sung API Key vào cấu hình hệ thống nhé! 🥰' 
    });
  }

  try {
    // 1. Đọc System Prompt hướng dẫn cách trả lời
    const systemPromptPath = path.join(__dirname, '../chatbot_data/system_prompt.txt');
    let systemPrompt = '';
    if (fs.existsSync(systemPromptPath)) {
      systemPrompt = fs.readFileSync(systemPromptPath, 'utf8');
    }

    // 2. Đọc toàn bộ các file kiến thức trong thư mục knowledge
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

    // 3. Khởi tạo mô hình Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction: fullSystemInstruction
    });

    // 4. Format lịch sử trò chuyện nếu có
    let formattedHistory = [];
    if (Array.isArray(history)) {
      // Giới hạn lịch sử khoảng 10 tin nhắn gần nhất để tối ưu dung lượng và tốc độ
      const recentHistory = history.slice(-10);
      formattedHistory = recentHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));
    }

    // 5. Bắt đầu phiên chat và gửi câu hỏi
    const chatSession = model.startChat({
      history: formattedHistory
    });

    const result = await chatSession.sendMessage(message);
    const response = await result.response;
    const replyText = response.text();

    res.json({ response: replyText });

  } catch (error) {
    console.error('Chatbot API error:', error);
    res.status(500).json({ 
      response: 'Dạ, em gặp một chút trục trặc khi kết nối với máy chủ AI. Bạn vui lòng thử lại sau nhé! 😭' 
    });
  }
};
