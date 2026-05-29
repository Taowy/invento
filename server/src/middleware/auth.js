const jwt = require('jsonwebtoken');
const config = require('../config');

function signToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '30d' });
}

function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) {
    return res.status(401).json({ success: false, message: '请先登录' });
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: '登录已过期，请重新登录' });
  }
}

function managerRequired(req, res, next) {
  if (req.user.role !== 'manager') {
    return res.status(403).json({ success: false, message: '仅管理者可操作' });
  }
  next();
}

module.exports = { signToken, verifyToken, authRequired, managerRequired };
