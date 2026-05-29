/**
 * 从 openid 注册模型迁移到 username + password（模式 3）
 * 已有用户需通过「忘记密码」由管理员重置，或删除后重新注册
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const config = require('../src/config');
const { hashPassword } = require('../src/utils/password');

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

  if (!(await columnExists(conn, 'users', 'username'))) {
    await conn.query(`ALTER TABLE users ADD COLUMN username VARCHAR(64) NULL AFTER id`);
  }
  if (!(await columnExists(conn, 'users', 'password_hash'))) {
    await conn.query(`ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL AFTER username`);
  }

  const [legacyUsers] = await conn.query(
    `SELECT id, nick_name, openid FROM users WHERE username IS NULL OR password_hash IS NULL`
  );

  const unusableHash = await hashPassword(`__migrate__${Date.now()}__`);

  for (const user of legacyUsers) {
    const base = (user.nick_name || 'user').replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 20) || 'user';
    let username = `${base}_${user.id}`;
    let attempt = 0;
    while (attempt < 5) {
      const [dup] = await conn.query('SELECT id FROM users WHERE username = ? AND id <> ?', [username, user.id]);
      if (dup.length === 0) break;
      username = `${base}_${user.id}_${attempt}`;
      attempt += 1;
    }
    await conn.query(
      'UPDATE users SET username = ?, password_hash = ? WHERE id = ?',
      [username, unusableHash, user.id]
    );
    console.log(`已迁移用户 id=${user.id} → 临时用户名 ${username}（需忘记密码由管理员重置）`);
  }

  await conn.query(`
    ALTER TABLE users
      MODIFY username VARCHAR(64) NOT NULL,
      MODIFY password_hash VARCHAR(255) NOT NULL,
      MODIFY openid VARCHAR(64) NULL
  `);

  try {
    await conn.query(`ALTER TABLE users DROP INDEX openid`);
  } catch (e) {
    /* 可能已无 UNIQUE 索引 */
  }
  try {
    await conn.query(`ALTER TABLE users ADD INDEX idx_openid (openid)`);
  } catch (e) {
    /* 索引已存在 */
  }

  await conn.query(`
    CREATE TABLE IF NOT EXISTS password_reset_requests (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      status ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
      requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      resolved_at TIMESTAMP NULL,
      resolved_by INT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_status (status),
      INDEX idx_user_status (user_id, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log('认证模型迁移完成');
  await conn.end();
}

main().catch((err) => {
  console.error('迁移失败:', err.message);
  process.exit(1);
});
