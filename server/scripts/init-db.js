require('dotenv').config();
const mysql = require('mysql2/promise');
const config = require('../src/config');

async function main() {
  const conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true
  });

  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${config.db.database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${config.db.database}\``);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      openid VARCHAR(64) NOT NULL UNIQUE,
      nick_name VARCHAR(64) NOT NULL,
      role ENUM('manager', 'service') NOT NULL DEFAULT 'service',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(128) NOT NULL,
      price DECIMAL(10, 2) NOT NULL DEFAULT 0,
      spec VARCHAR(256) DEFAULT '',
      stock INT DEFAULT 0,
      remark TEXT,
      images JSON,
      image_keys JSON COMMENT 'OSS object key，用于识图索引',
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FULLTEXT INDEX ft_name (name),
      INDEX idx_created_at (created_at),
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log('数据库初始化完成:', config.db.database);
  await conn.end();
}

main().catch((err) => {
  console.error('数据库初始化失败:', err.message);
  process.exit(1);
});
