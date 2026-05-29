const appConfig = require('../../config');
const { request, wxLogin } = require('../../utils/api');
const { showError } = require('../../utils/util');

Page({
  data: {
    serverUrl: appConfig.baseUrl,
    registered: false,
    userInfo: null,
    nickName: '',
    role: 'service',
    managerCode: '',
    loading: false
  },

  onLoad() {
    const userInfo = wx.getStorageSync('userInfo') || null;
    this.setData({ registered: !!userInfo, userInfo });
  },

  onNickNameInput(e) {
    this.setData({ nickName: e.detail.value.trim() });
  },

  onRoleChange(e) {
    this.setData({ role: e.detail.value });
  },

  onManagerCodeInput(e) {
    this.setData({ managerCode: e.detail.value.trim() });
  },

  async handleRegister() {
    const { nickName, role, managerCode } = this.data;

    if (!nickName) {
      wx.showToast({ title: '请填写昵称', icon: 'none' });
      return;
    }
    if (role === 'manager' && !managerCode) {
      wx.showToast({ title: '管理者需要验证码', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    try {
      const code = await wxLogin();
      const result = await request({
        url: '/api/auth/register',
        method: 'POST',
        data: { code, nickName, role, managerCode },
        needAuth: false
      });

      if (!result.success) {
        showError('注册失败', result.message);
        return;
      }

      wx.setStorageSync('token', result.token);
      wx.setStorageSync('userInfo', result.userInfo);
      getApp().globalData.userInfo = result.userInfo;

      wx.showToast({ title: '注册成功', icon: 'success' });
      setTimeout(() => wx.reLaunch({ url: '/pages/index/index' }), 500);
    } catch (err) {
      showError('注册失败', err.message);
    } finally {
      this.setData({ loading: false });
    }
  },

  async enterApp() {
    this.setData({ loading: true });
    try {
      const result = await request({ url: '/api/auth/me' });
      if (result.success && result.userInfo) {
        wx.setStorageSync('userInfo', result.userInfo);
        getApp().globalData.userInfo = result.userInfo;
        wx.reLaunch({ url: '/pages/index/index' });
      } else {
        wx.removeStorageSync('token');
        wx.removeStorageSync('userInfo');
        this.setData({ registered: false, userInfo: null });
      }
    } catch (err) {
      wx.removeStorageSync('token');
      wx.removeStorageSync('userInfo');
      this.setData({ registered: false, userInfo: null });
      showError('登录失败', err.message);
    } finally {
      this.setData({ loading: false });
    }
  }
});
