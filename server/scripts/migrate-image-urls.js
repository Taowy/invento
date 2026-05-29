/**
 * 将 products.images 中失效的自定义域名 URL 批量改为 OSS 默认域名
 * 用法：cd server && node scripts/migrate-image-urls.js
 */
require('dotenv').config();
const { getPool } = require('../src/db');
const { normalizePublicUrl } = require('../src/storage/oss');

const BROKEN_HOST = 'invento-photo.cn-hangzhou.taihangtop.cn';

async function main() {
  const pool = getPool();
  const [rows] = await pool.query('SELECT id, images FROM products');

  let updated = 0;
  for (const row of rows) {
    const images = typeof row.images === 'string' ? JSON.parse(row.images || '[]') : (row.images || []);
    if (!images.some((url) => url && url.includes(BROKEN_HOST))) continue;

    const fixed = images.map((url) => normalizePublicUrl(url));
    await pool.query('UPDATE products SET images = ? WHERE id = ?', [JSON.stringify(fixed), row.id]);
    updated += 1;
    console.log(`#${row.id} 已更新`);
  }

  console.log(updated ? `\n共更新 ${updated} 条商品` : '\n无需更新');
  process.exit(0);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
