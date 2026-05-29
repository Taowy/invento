const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/;

function validateUsername(username) {
  if (!username || !USERNAME_RE.test(username)) {
    return '用户名需为 3-32 位字母、数字或下划线';
  }
  return null;
}

function validatePassword(password) {
  if (!password || String(password).length < 6) {
    return '密码至少 6 位';
  }
  return null;
}

module.exports = { validateUsername, validatePassword };
