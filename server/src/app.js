const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const { ensureUploadDir } = require('./storage');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

ensureUploadDir();
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'invento server is running',
    storage: config.oss.enabled ? 'oss' : 'local',
    ecsIp: config.ecsPublicIp
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Invento 后端已启动: http://0.0.0.0:${config.port}`);
  console.log(`公网访问地址: http://${config.ecsPublicIp}:${config.port}`);
  console.log(`图片存储模式: ${config.oss.enabled ? '阿里云 OSS' : 'ECS 本地磁盘'}`);
});
