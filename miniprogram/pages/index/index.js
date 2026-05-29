Page({
  data: {
    userInfo: null,
    resetCount: 0
  },

  onShow() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }
    this.setData({ userInfo });
    if (userInfo.role === 'manager') {
      this.loadResetCount();
    } else {
      this.setData({ resetCount: 0 });
    }
  },

  async loadResetCount() {
    try {
      const { request } = require('../../utils/api');
      const result = await request({ url: '/api/auth/reset-requests/count' });
      this.setData({ resetCount: result.count || 0 });
    } catch (err) {
      this.setData({ resetCount: 0 });
    }
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/product-add/product-add' });
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/product-search/product-search' });
  },

  goResetRequests() {
    wx.navigateTo({ url: '/pages/reset-requests/reset-requests' });
  },

  logout() {
    wx.showModal({
      title: '退出登录',
      content: '退出后需重新输入用户名和密码登录',
      success(res) {
        if (res.confirm) {
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('token');
          wx.reLaunch({ url: '/pages/login/login' });
        }
      }
    });
  }
});
