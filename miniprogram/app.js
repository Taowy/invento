const appConfig = require('./config');

App({
  globalData: {
    userInfo: null,
    baseUrl: appConfig.baseUrl
  },

  onLaunch() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }
  }
});
