require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  ecsPublicIp: process.env.ECS_PUBLIC_IP || 'YOUR_ECS_PUBLIC_IP',
  wxAppId: process.env.WX_APPID || '',
  wxSecret: process.env.WX_SECRET || '',
  jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
  managerCode: process.env.MANAGER_CODE || 'invento2024',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'invento'
  },
  oss: {
    enabled: process.env.OSS_ENABLED === 'true',
    region: process.env.OSS_REGION || 'oss-cn-hangzhou',
    endpoint: process.env.OSS_ENDPOINT || '',
    accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
    bucket: process.env.OSS_BUCKET || '',
    customDomain: process.env.OSS_CUSTOM_DOMAIN || ''
  },
  uploadDir: require('path').join(__dirname, '../uploads')
};

module.exports = config;
