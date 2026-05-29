const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getPool } = require('../db');
const { authRequired, recorderOrManagerRequired } = require('../middleware/auth');
const { saveImage, mapProductImages } = require('../storage');
const { logActivity } = require('../utils/activity');

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

function mapListItem(req, item) {
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
}

router.post('/upload', authRequired, recorderOrManagerRequired, (req, res) => {
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

    await logActivity(pool, req.user.id, 'query');

    const list = rows.map((item) => mapListItem(req, item));
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

    await logActivity(pool, req.user.id, 'query', Number(req.params.id));

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
        imageKeys: mapped.imageKeys,
        creatorName: rows[0].creator_name,
        createdAt: rows[0].created_at,
        updatedAt: rows[0].updated_at
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取详情失败' });
  }
});

router.post('/', authRequired, recorderOrManagerRequired, async (req, res) => {
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
      `INSERT INTO products (name, price, spec, stock, remark, images, image_keys, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(name).trim(),
        parseFloat(price) || 0,
        spec || '',
        parseInt(stock, 10) || 0,
        remark || '',
        JSON.stringify(images || []),
        JSON.stringify(imageKeys || []),
        req.user.id,
        req.user.id
      ]
    );

    await logActivity(pool, req.user.id, 'create', result.insertId);

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '保存失败' });
  }
});

router.put('/:id', authRequired, recorderOrManagerRequired, async (req, res) => {
  try {
    const { name, price, spec, stock, remark, images, imageKeys } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, message: '请填写货物名称' });
    }
    if (price === undefined || price === null || price === '') {
      return res.status(400).json({ success: false, message: '请填写价格' });
    }

    const pool = getPool();
    const [existing] = await pool.query('SELECT id FROM products WHERE id = ?', [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: '货物不存在' });
    }

    await pool.query(
      `UPDATE products
       SET name = ?, price = ?, spec = ?, stock = ?, remark = ?, images = ?, image_keys = ?, updated_by = ?
       WHERE id = ?`,
      [
        String(name).trim(),
        parseFloat(price) || 0,
        spec || '',
        parseInt(stock, 10) || 0,
        remark || '',
        JSON.stringify(images || []),
        JSON.stringify(imageKeys || []),
        req.user.id,
        req.params.id
      ]
    );

    await logActivity(pool, req.user.id, 'update', Number(req.params.id));

    res.json({ success: true, id: Number(req.params.id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '更新失败' });
  }
});

module.exports = router;
