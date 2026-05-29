async function logActivity(pool, userId, action, productId = null) {
  await pool.query(
    'INSERT INTO user_activity_logs (user_id, action, product_id) VALUES (?, ?, ?)',
    [userId, action, productId]
  );
}

module.exports = { logActivity };
