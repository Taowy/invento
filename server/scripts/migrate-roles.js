/**
 * 增加录入员角色、操作统计表、货物 updated_by 字段
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const config = require('../src/config');

async function columnExists(conn, table, column) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [config.db.database, table, column]
  );
  return rows[0].cnt > 0;
}

async function main() {
  const conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    multipleStatements: true
  });

  await conn.query(`
    ALTER TABLE users
    MODIFY role ENUM('manager', 'recorder', 'service') NOT NULL DEFAULT 'service'
  `);

  if (!(await columnExists(conn, 'products', 'updated_by'))) {
    await conn.query(`ALTER TABLE products ADD COLUMN updated_by INT NULL AFTER created_by`);
    try {
      await conn.query(`
        ALTER TABLE products
        ADD CONSTRAINT fk_products_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
      `);
    } catch (e) {
      console.warn('updated_by 外键可能已存在，跳过');
    }
  }

  await conn.query(`
    CREATE TABLE IF NOT EXISTS user_activity_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      action ENUM('query', 'create', 'update') NOT NULL,
      product_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_action_time (user_id, action, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log('角色与统计迁移完成');
  await conn.end();
}

main().catch((err) => {
  console.error('迁移失败:', err.message);
  process.exit(1);
});
