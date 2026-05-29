Page({
  data: {
    userInfo: null
  },

  onShow() {
    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }
    this.setData({ userInfo });
  },

  goAdd() {
    wx.navigateTo({ url: '/pages/product-add/product-add' });
  },

  goSearch() {
    wx.navigateTo({ url: '/pages/product-search/product-search' });
  },

  logout() {
    wx.showModal({
      title: '确认退出',
      content: '退出后需要重新进入小程序',
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
