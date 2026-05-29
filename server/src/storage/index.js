const config = require('../config');
const local = require('./local');
const oss = require('./oss');
const { normalizePublicUrl } = oss;

async function saveImage(file) {
  if (config.oss.enabled) {
    return oss.saveOss(file);
  }
  return local.saveLocal(file);
}

async function deleteImage(key) {
  if (!key) return;
  if (config.oss.enabled) {
    await oss.deleteOss(key);
  } else {
    await local.deleteLocal(key);
  }
}

function toAbsoluteUrl(req, url) {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return normalizePublicUrl(url);
  }
  const host = config.ecsPublicIp !== 'YOUR_ECS_PUBLIC_IP'
    ? config.ecsPublicIp
    : (req.get('host') || `127.0.0.1:${config.port}`);
  const protocol = req.protocol || 'http';
  return `${protocol}://${host}${url}`;
}

function mapProductImages(req, product) {
  const images = Array.isArray(product.images) ? product.images : JSON.parse(product.images || '[]');
  return {
    ...product,
    images: images.map((url) => toAbsoluteUrl(req, url)),
    imageKeys: product.image_keys
      ? (typeof product.image_keys === 'string' ? JSON.parse(product.image_keys) : product.image_keys)
      : []
  };
}

module.exports = {
  saveImage,
  deleteImage,
  toAbsoluteUrl,
  mapProductImages,
  ensureUploadDir: local.ensureUploadDir
};
