/**
 * Face Recognition Service
 * Sử dụng face-api.js + @tensorflow/tfjs-backend-cpu (Pure JS, không cần C++ native)
 */

// Dùng đúng phiên bản TF.js mà face-api.js được build (v1.7.x)
const tf = require('@tensorflow/tfjs');
const faceapi = require('face-api.js');
const canvas = require('canvas');
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const path = require('path');
const fs = require('fs').promises;
const db = require('../config/db');

// Models được đóng gói sẵn trong @vladmandic/face-api
const modelPath = path.join(__dirname, '../node_modules/@vladmandic/face-api/model');

let modelsLoaded = false;

async function loadModels() {
  if (modelsLoaded) return;
  try {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
    modelsLoaded = true;
    console.log('✅ Face Recognition models loaded');
  } catch (err) {
    console.error('❌ Error loading face models:', err.message);
    throw err;
  }
}

// Chạy ngầm khi Admin upload ảnh - trích xuất và lưu face descriptors vào DB
exports.processImageFaces = async (imageId, thumbnailPath) => {
  try {
    await loadModels();

    const buffer = await fs.readFile(thumbnailPath);
    const img = await canvas.loadImage(buffer);

    const detections = await faceapi
      .detectAllFaces(img)
      .withFaceLandmarks()
      .withFaceDescriptors();

    for (const detection of detections) {
      const descriptorArray = Array.from(detection.descriptor);
      await db.query(
        'INSERT INTO face_descriptors (image_id, descriptor) VALUES (?, ?)',
        [imageId, JSON.stringify(descriptorArray)]
      );
    }

    if (detections.length > 0) {
      console.log(`✅ Trích xuất ${detections.length} khuôn mặt cho ảnh ID: ${imageId}`);
    }
  } catch (err) {
    console.error(`❌ Lỗi trích xuất khuôn mặt ảnh ${imageId}:`, err.message);
  }
};

// Tìm ảnh khớp với selfie trong album
exports.findMatchingImages = async (selfieBuffer, albumId) => {
  try {
    await loadModels();

    const img = await canvas.loadImage(selfieBuffer);

    const detection = await faceapi
      .detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return { success: false, message: 'Không tìm thấy khuôn mặt nào trong ảnh bạn tải lên.' };
    }

    const selfieDescriptor = detection.descriptor;

    // Lấy tất cả face descriptors của album từ DB
    const [rows] = await db.query(`
      SELECT fd.image_id, fd.descriptor
      FROM face_descriptors fd
      JOIN album_images ai ON fd.image_id = ai.id
      WHERE ai.album_id = ?
    `, [albumId]);

    if (rows.length === 0) {
      return { success: false, message: 'Album này chưa được xử lý nhận diện khuôn mặt. Admin cần upload lại ảnh.' };
    }

    const matchingImageIds = new Set();
    const allScores = {};
    
    // Thu thập tất cả kết quả khoảng cách cho từng ảnh
    const imageDistances = {};
    for (const row of rows) {
      try {
        let descriptorArray = row.descriptor;
        if (typeof descriptorArray === 'string') {
          descriptorArray = JSON.parse(descriptorArray);
        }
        const stored = new Float32Array(descriptorArray);
        const distance = faceapi.euclideanDistance(selfieDescriptor, stored);
        // Lưu khoảng cách nhỏ nhất cho mỗi ảnh (1 ảnh có thể có nhiều mặt)
        if (!imageDistances[row.image_id] || distance < imageDistances[row.image_id]) {
          imageDistances[row.image_id] = distance;
        }
      } catch (e) {
        console.error(`Lỗi xử lý descriptor của ảnh ${row.image_id}:`, e.message);
      }
    }

    // Điều chỉnh ngưỡng: chặt chẽ hơn để tránh lạn ảnh người khác
    const THRESHOLD = 0.40;
    for (const [imageId, distance] of Object.entries(imageDistances)) {
      if (distance <= THRESHOLD) {
        matchingImageIds.add(parseInt(imageId));
      }
    }

    return { success: true, matchedIds: Array.from(matchingImageIds), allScores: imageDistances };


  } catch (err) {
    console.error('Lỗi tìm ảnh khuôn mặt:', err.message);
    return { success: false, message: 'Lỗi xử lý ảnh. Vui lòng thử lại.' };
  }
};
