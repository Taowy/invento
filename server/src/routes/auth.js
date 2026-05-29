const express = require('express');
const { getPool } = require('../db');
const { signToken, authRequired } = require('../middleware/auth');
const { code2Session } = require('../services/wechat');
const config = require('../config');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: '缺少 code' });
    }

    const session = await code2Session(code);
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM users WHERE openid = ?', [session.openid]);

    if (rows.length === 0) {
      return res.json({
        success: true,
        registered: false,
        openid: session.openid
      });
    }

    const user = rows[0];
    const token = signToken({ id: user.id, openid: user.openid, role: user.role, nickName: user.nick_name });
    res.json({
      success: true,
      registered: true,
      token,
      userInfo: {
        id: user.id,
        openid: user.openid,
        nickName: user.nick_name,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || '登录失败' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { code, nickName, role, managerCode } = req.body;

    if (!code || !nickName || !role) {
      return res.status(400).json({ success: false, message: '请填写完整信息' });
    }

    if (!['manager', 'service'].includes(role)) {
      return res.status(400).json({ success: false, message: '角色无效' });
    }

    if (role === 'manager' && managerCode !== config.managerCode) {
      return res.status(403).json({ success: false, message: '管理者验证码错误' });
    }

    const session = await code2Session(code);
    const pool = getPool();

    const [existing] = await pool.query('SELECT * FROM users WHERE openid = ?', [session.openid]);
    if (existing.length > 0) {
      const user = existing[0];
      const token = signToken({ id: user.id, openid: user.openid, role: user.role, nickName: user.nick_name });
      return res.json({
        success: true,
        token,
        userInfo: {
          id: user.id,
          openid: user.openid,
          nickName: user.nick_name,
          role: user.role
        }
      });
    }

    const [result] = await pool.query(
      'INSERT INTO users (openid, nick_name, role) VALUES (?, ?, ?)',
      [session.openid, nickName.trim(), role]
    );

    const userInfo = {
      id: result.insertId,
      openid: session.openid,
      nickName: nickName.trim(),
      role
    };

    const token = signToken({ id: userInfo.id, openid: userInfo.openid, role, nickName: userInfo.nickName });

    res.json({ success: true, token, userInfo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || '注册失败' });
  }
});

router.get('/me', authRequired, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT id, openid, nick_name, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    const user = rows[0];
    res.json({
      success: true,
      userInfo: {
        id: user.id,
        openid: user.openid,
        nickName: user.nick_name,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
});

module.exports = router;
