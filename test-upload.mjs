import fs from 'fs';
import path from 'path';

// Create a simple test image
const testImagePath = './test-image.jpg';
const testVideoPath = './test-video.mp4';

// Create simple test files
const imageBuffer = Buffer.from([
  0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
  0x00, 0xFF, 0xD9
]);

const videoBuffer = Buffer.from([
  0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6F, 0x6D,
  0x00, 0x00, 0x00, 0x00, 0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
  0x6D, 0x70, 0x34, 0x31
]);

fs.writeFileSync(testImagePath, imageBuffer);
fs.writeFileSync(testVideoPath, videoBuffer);

console.log('Test files created');
console.log(`Image: ${testImagePath}`);
console.log(`Video: ${testVideoPath}`);

// Now test upload
async function testUpload() {
  const imageFile = fs.readFileSync(testImagePath);
  const videoFile = fs.readFileSync(testVideoPath);

  // Test image upload
  console.log('\nTesting image upload...');
  const formData = new FormData();
  const imageBlob = new Blob([imageFile], { type: 'image/jpeg' });
  formData.append('files', imageBlob, 'test.jpg');
  formData.append('type', 'image');

  try {
    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: {
        // Don't set Content-Type, let fetch handle it
      }
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Wait a bit before testing
setTimeout(testUpload, 2000);
