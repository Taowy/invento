const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

function ensureUploadDir() {
  if (!fs.existsSync(config.uploadDir)) {
    fs.mkdirSync(config.uploadDir, { recursive: true });
  }
}

async function saveLocal(file) {
  ensureUploadDir();
  const ext = path.extname(file.originalname) || '.jpg';
  const filename = `${Date.now()}-${uuidv4()}${ext}`;
  const dest = path.join(config.uploadDir, filename);
  fs.renameSync(file.path, dest);
  const url = `/uploads/${filename}`;
  return { url, key: filename };
}

async function deleteLocal(key) {
  const filePath = path.join(config.uploadDir, key);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

module.exports = { saveLocal, deleteLocal, ensureUploadDir };
