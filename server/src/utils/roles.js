const ROLES = {
  MANAGER: 'manager',
  RECORDER: 'recorder',
  SERVICE: 'service'
};

function isManager(role) {
  return role === ROLES.MANAGER;
}

function canWriteProducts(role) {
  return role === ROLES.MANAGER || role === ROLES.RECORDER;
}

module.exports = { ROLES, isManager, canWriteProducts };
