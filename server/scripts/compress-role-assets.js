/**
 * 压缩角色插图（Linux/ECS，需 sharp）
 * 用法：cd server && npm install sharp --save-dev && node scripts/compress-role-assets.js
 */
const path = require('path');
const fs = require('fs');

const ASSETS_DIR = path.join(__dirname, '../../miniprogram/assets/roles');
const MAX_WIDTH = 480;
const QUALITY = 82;
const ROLES = ['service', 'recorder', 'manager'];

async function main() {
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error('请先安装 sharp: npm install sharp --save-dev');
    process.exit(1);
  }

  for (const role of ROLES) {
    const src = path.join(ASSETS_DIR, `role-${role}.png`);
    const dst = path.join(ASSETS_DIR, `role-${role}.jpg`);
    if (!fs.existsSync(src)) {
      console.error('文件不存在:', src);
      process.exit(1);
    }
    await sharp(src)
      .resize(MAX_WIDTH, null, { withoutEnlargement: true })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: QUALITY, mozjpeg: true })
      .toFile(dst);
    const kb = (fs.statSync(dst).size / 1024).toFixed(1);
    console.log(`role-${role}.jpg  ${kb} KB`);
  }

  console.log('\n完成。请运行: npm run upload-role-assets');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
