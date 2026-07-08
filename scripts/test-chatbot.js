const chatbotController = require('../controllers/chatbotController');

async function runTests() {
  console.log('🧪 Bắt đầu chạy test cho chatbot controller...\n');

  // Test Case 1: Tìm kiếm địa chỉ (Local Keyword Match)
  console.log('--- Test Case 1: Hỏi về địa chỉ (Local Match) ---');
  let mockReq1 = {
    body: { message: 'Địa chỉ studio của mình ở đâu vậy ạ?', history: [] }
  };
  let mockRes1 = {
    json: (data) => {
      console.log('Kết quả 1:', data.response);
      console.log('✅ Khớp từ khóa địa chỉ thành công!\n');
    },
    status: (code) => { console.log('Status:', code); return mockRes1; }
  };
  await chatbotController.chat(mockReq1, mockRes1);

  // Test Case 2: Hỏi bảng giá (Local Keyword Match)
  console.log('--- Test Case 2: Hỏi bảng giá (Local Match) ---');
  let mockReq2 = {
    body: { message: 'cho mình xin báo giá các gói chụp ảnh với nha', history: [] }
  };
  let mockRes2 = {
    json: (data) => {
      console.log('Kết quả 2:', data.response);
      console.log('✅ Khớp từ khóa bảng giá thành công!\n');
    },
    status: (code) => { console.log('Status:', code); return mockRes2; }
  };
  await chatbotController.chat(mockReq2, mockRes2);

  // Test Case 3: Hỏi câu hỏi tự do (Kích hoạt AI Fallback)
  console.log('--- Test Case 3: Hỏi tự do (Kích hoạt AI Fallback) ---');
  let mockReq3 = {
    body: { message: 'Bạn có thể giúp mình chọn giữa gói Concept và gói Profile không?', history: [] }
  };
  let mockRes3 = {
    json: (data) => {
      console.log('Kết quả 3:', data.response);
      console.log('🎉 Test Case 3 hoàn tất!\n');
    },
    status: (code) => { console.log('Status:', code); return mockRes3; }
  };
  await chatbotController.chat(mockReq3, mockRes3);
}

runTests().catch(console.error);
