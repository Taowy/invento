/**
 * 将角色插图上传到 OSS，供小程序通过 URL 引用（避免包体过大）
 *
 * 用法：
 *   1. 压缩：powershell -File scripts/compress-role-assets.ps1（Windows）
 *      或 npm run compress-role-assets（ECS，需 sharp）
 *   2. 上传：cd server && npm run upload-role-assets
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const OSS = require('ali-oss');
const config = require('../src/config');

const ASSETS_DIR = path.join(__dirname, '../../miniprogram/assets/roles');
const OSS_PREFIX = 'invento/static/roles';

const FILES = [
  { file: 'role-service.jpg', key: 'role-service.jpg' },
  { file: 'role-recorder.jpg', key: 'role-recorder.jpg' },
  { file: 'role-manager.jpg', key: 'role-manager.jpg' }
];

function getClient() {
  const options = {
    region: config.oss.region,
    accessKeyId: config.oss.accessKeyId,
    accessKeySecret: config.oss.accessKeySecret,
    bucket: config.oss.bucket
  };
  if (config.oss.endpoint) options.endpoint = config.oss.endpoint;
  return new OSS(options);
}

function buildPublicUrl(key) {
  if (config.oss.customDomain) {
    const domain = config.oss.customDomain.replace(/\/$/, '');
    return `${domain}/${key}`;
  }
  return `https://${config.oss.bucket}.${config.oss.region}.aliyuncs.com/${key}`;
}

async function main() {
  if (!config.oss.accessKeyId || !config.oss.bucket) {
    console.error('请在 server/.env 中配置 OSS');
    process.exit(1);
  }

  const client = getClient();
  const urls = {};

  for (const item of FILES) {
    const localPath = path.join(ASSETS_DIR, item.file);
    if (!fs.existsSync(localPath)) {
      console.error('文件不存在:', localPath);
      process.exit(1);
    }
    const ossKey = `${OSS_PREFIX}/${item.key}`;
    await client.put(ossKey, localPath);
    const url = buildPublicUrl(ossKey);
    const role = item.key.replace('role-', '').replace(/\.(png|jpg)$/, '');
    urls[role] = url;
    console.log(`${role}: ${url}`);
  }

  console.log('\n将以下配置复制到 miniprogram/config.js 的 roleImages：');
  console.log(JSON.stringify(urls, null, 2));
}

main().catch((err) => {
  console.error('上传失败:', err.message);
  process.exit(1);
});
