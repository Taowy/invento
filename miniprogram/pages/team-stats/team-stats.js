const { request } = require('../../utils/api');
const { showError } = require('../../utils/util');
const { getRoleLabel } = require('../../utils/role');

Page({
  data: {
    list: [],
    loading: false
  },

  onShow() {
    this.loadStats();
  },

  async loadStats() {
    this.setData({ loading: true });
    try {
      const result = await request({ url: '/api/stats/user-activity' });
      const list = (result.list || []).map((item) => ({
        ...item,
        roleLabel: getRoleLabel(item.role)
      }));
      this.setData({ list });
    } catch (err) {
      showError('加载失败', err.message);
    } finally {
      this.setData({ loading: false });
    }
  }
});
