

const { Storage } = require('@google-cloud/storage');
const fs = require('fs');

const keyFilePath = './service-account.json';
const corsConfigPath = './cors.json';
const bucketName = 'scores4streams-v2.firebasestorage.app';

if (!fs.existsSync(keyFilePath)) {
  console.error('❌ service-account.json not found');
  process.exit(1);
}

if (!fs.existsSync(corsConfigPath)) {
  console.error('❌ cors.json not found');
  process.exit(1);
}

const storage = new Storage({ keyFilename: keyFilePath });

async function setCorsConfiguration() {
  try {
    const corsConfig = JSON.parse(fs.readFileSync(corsConfigPath, 'utf8'));
    await storage.bucket(bucketName).setCorsConfiguration(corsConfig);
    console.log(`✅ CORS configuration applied to bucket: ${bucketName}`);
  } catch (err) {
    console.error('❌ Failed to apply CORS configuration:', err.message);
  }
}

setCorsConfiguration();