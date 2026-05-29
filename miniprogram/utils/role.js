const ROLE_LABELS = {
  manager: '管理者',
  recorder: '录入员',
  service: '客服'
};

function getRoleLabel(role) {
  return ROLE_LABELS[role] || role;
}

function canWriteProducts(role) {
  return role === 'manager' || role === 'recorder';
}

function isManager(role) {
  return role === 'manager';
}

module.exports = { getRoleLabel, canWriteProducts, isManager };
