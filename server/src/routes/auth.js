const express = require('express');
const { getPool } = require('../db');
const { signToken, authRequired, managerRequired } = require('../middleware/auth');
const { code2Session } = require('../services/wechat');
const { hashPassword, verifyPassword } = require('../utils/password');
const { validateUsername, validatePassword } = require('../utils/validate');
const config = require('../config');

const router = express.Router();

function userPayload(user) {
  return {
    id: user.id,
    username: user.username,
    nickName: user.nick_name,
    role: user.role
  };
}

async function optionalOpenid(code) {
  if (!code || !config.wxAppId || !config.wxSecret) return null;
  try {
    const session = await code2Session(code);
    return session.openid;
  } catch (err) {
    console.warn('绑定 openid 失败:', err.message);
    return null;
  }
}

router.post('/login', async (req, res) => {
  try {
    const { username, password, code } = req.body;
    const userErr = validateUsername(username);
    const passErr = validatePassword(password);
    if (userErr || passErr) {
      return res.status(400).json({ success: false, message: userErr || passErr });
    }

    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username.trim()]);
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const user = rows[0];
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const openid = await optionalOpenid(code);
    if (openid && !user.openid) {
      await pool.query('UPDATE users SET openid = ? WHERE id = ?', [openid, user.id]);
    }

    const info = userPayload(user);
    const token = signToken({ id: user.id, username: user.username, role: user.role, nickName: user.nick_name });
    res.json({ success: true, token, userInfo: info });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || '登录失败' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, nickName, role, managerCode, code } = req.body;

    const userErr = validateUsername(username);
    const passErr = validatePassword(password);
    if (userErr || passErr) {
      return res.status(400).json({ success: false, message: userErr || passErr });
    }
    if (!role || !['manager', 'service', 'recorder'].includes(role)) {
      return res.status(400).json({ success: false, message: '请选择角色' });
    }
    if (role === 'manager' && managerCode !== config.managerCode) {
      return res.status(403).json({ success: false, message: '管理者验证码错误' });
    }

    const pool = getPool();
    const [existing] = await pool.query('SELECT id FROM users WHERE username = ?', [username.trim()]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: '用户名已被占用' });
    }

    const passwordHash = await hashPassword(password);
    const displayName = (nickName || username).trim();
    const openid = await optionalOpenid(code);

    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash, nick_name, openid, role) VALUES (?, ?, ?, ?, ?)',
      [username.trim(), passwordHash, displayName, openid, role]
    );

    const userInfo = {
      id: result.insertId,
      username: username.trim(),
      nickName: displayName,
      role
    };
    const token = signToken({
      id: userInfo.id,
      username: userInfo.username,
      role,
      nickName: userInfo.nickName
    });

    res.json({ success: true, token, userInfo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message || '注册失败' });
  }
});

router.get('/me', authRequired, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT id, username, nick_name, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }
    res.json({ success: true, userInfo: userPayload(rows[0]) });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取用户信息失败' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { username } = req.body;
    const userErr = validateUsername(username);
    if (userErr) {
      return res.status(400).json({ success: false, message: userErr });
    }

    const pool = getPool();
    const [rows] = await pool.query('SELECT id FROM users WHERE username = ?', [username.trim()]);

    if (rows.length > 0) {
      const userId = rows[0].id;
      const [pending] = await pool.query(
        `SELECT id FROM password_reset_requests WHERE user_id = ? AND status = 'pending'`,
        [userId]
      );
      if (pending.length === 0) {
        await pool.query(
          `INSERT INTO password_reset_requests (user_id, status) VALUES (?, 'pending')`,
          [userId]
        );
      }
    }

    res.json({
      success: true,
      message: '申请已提交，请等待管理员处理。处理完成后请使用新密码登录。'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '提交失败' });
  }
});

router.get('/reset-requests/count', authRequired, managerRequired, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM password_reset_requests WHERE status = 'pending'`
    );
    res.json({ success: true, count: rows[0].cnt });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取失败' });
  }
});

router.get('/reset-requests', authRequired, managerRequired, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT r.id, r.user_id, r.requested_at, u.username, u.nick_name, u.role
       FROM password_reset_requests r
       JOIN users u ON r.user_id = u.id
       WHERE r.status = 'pending'
       ORDER BY r.requested_at ASC`
    );
    res.json({
      success: true,
      list: rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        username: row.username,
        nickName: row.nick_name,
        role: row.role,
        requestedAt: row.requested_at
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '获取列表失败' });
  }
});

router.post('/reset-requests/:id/resolve', authRequired, managerRequired, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const passErr = validatePassword(newPassword);
    if (passErr) {
      return res.status(400).json({ success: false, message: passErr });
    }

    const pool = getPool();
    const [requests] = await pool.query(
      `SELECT * FROM password_reset_requests WHERE id = ? AND status = 'pending'`,
      [req.params.id]
    );
    if (requests.length === 0) {
      return res.status(404).json({ success: false, message: '申请不存在或已处理' });
    }

    const requestRow = requests[0];
    const passwordHash = await hashPassword(newPassword);

    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, requestRow.user_id]);
    await pool.query(
      `UPDATE password_reset_requests SET status = 'completed', resolved_at = NOW(), resolved_by = ? WHERE id = ?`,
      [req.user.id, requestRow.id]
    );
    await pool.query(
      `UPDATE password_reset_requests SET status = 'cancelled', resolved_at = NOW(), resolved_by = ?
       WHERE user_id = ? AND status = 'pending' AND id <> ?`,
      [req.user.id, requestRow.user_id, requestRow.id]
    );

    res.json({ success: true, message: '密码已重置' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '重置失败' });
  }
});

module.exports = router;
