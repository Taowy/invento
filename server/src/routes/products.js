const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getPool } = require('../db');
const { authRequired, managerRequired } = require('../middleware/auth');
const { saveImage, mapProductImages } = require('../storage');
const config = require('../config');

const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, '../../tmp'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  }
});

function ensureTmpDir() {
  const tmpDir = path.join(__dirname, '../../tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
}

router.post('/upload', authRequired, managerRequired, (req, res) => {
  ensureTmpDir();
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message || '上传失败' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: '请选择图片' });
    }
    try {
      const saved = await saveImage(req.file);
      const url = saved.url.startsWith('http')
        ? saved.url
        : `${req.protocol}://${req.get('host')}${saved.url}`;
      res.json({ success: true, url, key: saved.key });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, message: '图片保存失败' });
    }
  });
});

router.get('/', authRequired, async (req, res) => {
  try {
    const keyword = (req.query.keyword || '').trim();
    const pool = getPool();
    let rows;

    if (keyword) {
      [rows] = await pool.query(
        `SELECT p.*, u.nick_name AS creator_name
         FROM products p
         LEFT JOIN users u ON p.created_by = u.id
         WHERE p.name LIKE ?
         ORDER BY p.updated_at DESC
         LIMIT 50`,
        [`%${keyword}%`]
      );
    } else {
      [rows] = await pool.query(
        `SELECT p.*, u.nick_name AS creator_name
         FROM products p
         LEFT JOIN users u ON p.created_by = u.id
         ORDER BY p.updated_at DESC
         LIMIT 50`
      );
    }

    const list = rows.map((item) => {
      const mapped = mapProductImages(req, item);
      return {
        id: mapped.id,
        name: mapped.name,
        price: mapped.price,
        spec: mapped.spec,
        stock: mapped.stock,
        remark: mapped.remark,
        images: mapped.images,
        creatorName: item.creator_name,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      };
    });

    res.json({ success: true, list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '查询失败' });
  }
});

router.get('/:id', authRequired, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT p.*, u.nick_name AS creator_name
       FROM products p
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '货物不存在' });
    }
    const mapped = mapProductImages(req, rows[0]);
    res.json({
      success: true,
      product: {
        id: mapped.id,
        name: mapped.name,
        price: mapped.price,
        spec: mapped.spec,
        stock: mapped.stock,
        remark: mapped.remark,
        images: mapped.images,
        creatorName: rows[0].creator_name,
        createdAt: rows[0].created_at,
        updatedAt: rows[0].updated_at
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取详情失败' });
  }
});

router.post('/', authRequired, managerRequired, async (req, res) => {
  try {
    const { name, price, spec, stock, remark, images, imageKeys } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: '请填写货物名称' });
    }
    if (price === undefined || price === null || price === '') {
      return res.status(400).json({ success: false, message: '请填写价格' });
    }

    const pool = getPool();
    const [result] = await pool.query(
      `INSERT INTO products (name, price, spec, stock, remark, images, image_keys, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(name).trim(),
        parseFloat(price) || 0,
        spec || '',
        parseInt(stock, 10) || 0,
        remark || '',
        JSON.stringify(images || []),
        JSON.stringify(imageKeys || []),
        req.user.id
      ]
    );

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '保存失败' });
  }
});

module.exports = router;
