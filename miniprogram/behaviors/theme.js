const { getThemeColors } = require('../utils/theme');

module.exports = Behavior({
  data: {
    themeColors: getThemeColors()
  },

  lifetimes: {
    attached() {
      this._refreshThemeColors = () => {
        this.setData({ themeColors: getThemeColors() });
      };
      wx.onThemeChange(this._refreshThemeColors);
    },
    detached() {
      if (this._refreshThemeColors) {
        wx.offThemeChange(this._refreshThemeColors);
      }
    }
  },

  pageLifetimes: {
    show() {
      this.setData({ themeColors: getThemeColors() });
    }
  }
});
