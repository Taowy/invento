const OSS = require('ali-oss');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

let client = null;

function getClient() {
  if (!client) {
    const options = {
      region: config.oss.region,
      accessKeyId: config.oss.accessKeyId,
      accessKeySecret: config.oss.accessKeySecret,
      bucket: config.oss.bucket
    };
    // ECS 与 OSS 同地域时可用内网 Endpoint，省流量、更快
    if (config.oss.endpoint) {
      options.endpoint = config.oss.endpoint;
    }
    client = new OSS(options);
  }
  return client;
}

function buildPublicUrl(key) {
  if (config.oss.customDomain) {
    const domain = config.oss.customDomain.replace(/\/$/, '');
    return `${domain}/${key}`;
  }
  return `https://${config.oss.bucket}.${config.oss.region}.aliyuncs.com/${key}`;
}

async function saveOss(file) {
  const ext = path.extname(file.originalname) || '.jpg';
  const key = `invento/products/${Date.now()}-${uuidv4()}${ext}`;
  const oss = getClient();
  await oss.put(key, file.path);
  return { url: buildPublicUrl(key), key };
}

async function deleteOss(key) {
  const oss = getClient();
  await oss.delete(key);
}

module.exports = { saveOss, deleteOss, buildPublicUrl };
