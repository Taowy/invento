/** 真机可靠主题色（不依赖 WXSS @变量 在按钮上的兼容性） */
const PALETTE = {
  light: {
    accent: '#0071e3',
    accentDisabled: '#99caff',
    accentText: '#ffffff',
    segmentTrack: '#c7c7cc',
    segmentActive: '#ffffff',
    segmentBorder: '#aeaeb2',
    segmentActiveText: '#1d1d1f',
    segmentInactiveText: '#6e6e73',
    roleTileBg: '#e5e5ea',
    roleTileBorder: '#d1d1d6',
    roleTileSelectedBg: '#e8f2fc',
    roleTileSelectedBorder: '#0071e3',
    roleName: '#1d1d1f'
  },
  dark: {
    accent: '#0a84ff',
    accentDisabled: '#3d6a99',
    accentText: '#ffffff',
    segmentTrack: '#2c2c2e',
    segmentActive: '#636366',
    segmentBorder: '#48484a',
    segmentActiveText: '#ffffff',
    segmentInactiveText: '#98989d',
    roleTileBg: '#3a3a3c',
    roleTileBorder: '#48484a',
    roleTileSelectedBg: '#1a2836',
    roleTileSelectedBorder: '#0a84ff',
    roleName: '#f5f5f7'
  }
};

function getTheme() {
  try {
    const info = wx.getAppBaseInfo ? wx.getAppBaseInfo() : wx.getSystemInfoSync();
    return info.theme === 'dark' ? 'dark' : 'light';
  } catch (e) {
    return 'light';
  }
}

function getThemeColors(theme) {
  const key = theme || getTheme();
  return { ...(PALETTE[key] || PALETTE.light), theme: key };
}

module.exports = { getTheme, getThemeColors, PALETTE };
