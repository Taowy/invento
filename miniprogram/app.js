const appConfig = require('./config');
const { getThemeColors } = require('./utils/theme');

App({
  globalData: {
    userInfo: null,
    baseUrl: appConfig.baseUrl,
    theme: 'light',
    themeColors: getThemeColors('light')
  },

  onLaunch() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.globalData.userInfo = userInfo;
    }
    this.refreshThemeColors();
    wx.onThemeChange(() => this.refreshThemeColors());
  },

  refreshThemeColors() {
    try {
      const info = wx.getAppBaseInfo ? wx.getAppBaseInfo() : wx.getSystemInfoSync();
      this.globalData.theme = info.theme === 'dark' ? 'dark' : 'light';
    } catch (e) {
      this.globalData.theme = 'light';
    }
    this.globalData.themeColors = getThemeColors(this.globalData.theme);
  }
});
