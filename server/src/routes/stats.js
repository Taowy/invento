const express = require('express');
const { getPool } = require('../db');
const { authRequired, managerRequired } = require('../middleware/auth');

const router = express.Router();

router.get('/user-activity', authRequired, managerRequired, async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT u.id, u.username, u.nick_name, u.role,
              COALESCE(SUM(CASE WHEN l.action = 'query' THEN 1 ELSE 0 END), 0) AS queryCount,
              COALESCE(SUM(CASE WHEN l.action = 'create' THEN 1 ELSE 0 END), 0) AS createCount,
              COALESCE(SUM(CASE WHEN l.action = 'update' THEN 1 ELSE 0 END), 0) AS updateCount
       FROM users u
       LEFT JOIN user_activity_logs l
         ON l.user_id = u.id AND l.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       WHERE u.role IN ('service', 'recorder')
       GROUP BY u.id, u.username, u.nick_name, u.role
       ORDER BY u.role, u.nick_name`
    );

    res.json({
      success: true,
      list: rows.map((row) => ({
        id: row.id,
        username: row.username,
        nickName: row.nick_name,
        role: row.role,
        queryCount: Number(row.queryCount),
        createCount: Number(row.createCount),
        updateCount: Number(row.updateCount)
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '获取统计失败' });
  }
});

module.exports = router;
