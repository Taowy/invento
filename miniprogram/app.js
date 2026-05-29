const appConfig = require('./config');

App({
  globalData: {
    userInfo: null,
    baseUrl: appConfig.baseUrl,
    theme: 'light'
  },

  onLaunch() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }
    this.syncTheme();
  },

  onThemeChange(res) {
    this.globalData.theme = res.theme;
  },

  syncTheme() {
    try {
      const info = wx.getAppBaseInfo ? wx.getAppBaseInfo() : wx.getSystemInfoSync();
      this.globalData.theme = info.theme || 'light';
    } catch (e) {
      this.globalData.theme = 'light';
    }
  }
});
