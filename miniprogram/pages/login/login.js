const appConfig = require('../../config');
const { request, wxLogin } = require('../../utils/api');
const { showError } = require('../../utils/util');

Page({
  data: {
    serverUrl: appConfig.baseUrl,
    mode: 'login',
    loading: false,
    checkingSession: true,
    username: '',
    password: '',
    confirmPassword: '',
    nickName: '',
    role: 'service',
    managerCode: '',
    forgotUsername: '',
    roleImages: appConfig.roleImages
  },

  onLoad() {
    this.tryRestoreSession();
  },

  async tryRestoreSession() {
    const token = wx.getStorageSync('token');
    if (!token) {
      this.setData({ checkingSession: false });
      return;
    }
    try {
      const result = await request({ url: '/api/auth/me' });
      if (result.success && result.userInfo) {
        wx.setStorageSync('userInfo', result.userInfo);
        getApp().globalData.userInfo = result.userInfo;
        wx.reLaunch({ url: '/pages/index/index' });
        return;
      }
    } catch (err) {
      wx.removeStorageSync('token');
      wx.removeStorageSync('userInfo');
    }
    this.setData({ checkingSession: false });
  },

  switchMode(e) {
    this.setData({ mode: e.currentTarget.dataset.mode });
  },

  onUsernameInput(e) { this.setData({ username: e.detail.value.trim() }); },
  onPasswordInput(e) { this.setData({ password: e.detail.value }); },
  onConfirmPasswordInput(e) { this.setData({ confirmPassword: e.detail.value }); },
  onNickNameInput(e) { this.setData({ nickName: e.detail.value.trim() }); },
  onForgotUsernameInput(e) { this.setData({ forgotUsername: e.detail.value.trim() }); },

  selectRole(e) {
    this.setData({ role: e.currentTarget.dataset.role });
  },

  onManagerCodeInput(e) {
    this.setData({ managerCode: e.detail.value.trim() });
  },

  async handleLogin() {
    const { username, password } = this.data;
    if (!username || !password) {
      wx.showToast({ title: '请填写用户名和密码', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    try {
      let code = '';
      try { code = await wxLogin(); } catch (e) { /* openid 绑定可选 */ }

      const result = await request({
        url: '/api/auth/login',
        method: 'POST',
        data: { username, password, code },
        needAuth: false
      });

      if (!result.success) {
        showError('登录失败', result.message);
        return;
      }

      wx.setStorageSync('token', result.token);
      wx.setStorageSync('userInfo', result.userInfo);
      getApp().globalData.userInfo = result.userInfo;
      wx.reLaunch({ url: '/pages/index/index' });
    } catch (err) {
      showError('登录失败', err.message);
    } finally {
      this.setData({ loading: false });
    }
  },

  async handleRegister() {
    const { username, password, confirmPassword, nickName, role, managerCode } = this.data;

    if (!username || !password) {
      wx.showToast({ title: '请填写用户名和密码', icon: 'none' });
      return;
    }
    if (password !== confirmPassword) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' });
      return;
    }
    if (role === 'manager' && !managerCode) {
      wx.showToast({ title: '管理者需要验证码', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    try {
      let code = '';
      try { code = await wxLogin(); } catch (e) { /* optional */ }

      const result = await request({
        url: '/api/auth/register',
        method: 'POST',
        data: { username, password, nickName, role, managerCode, code },
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

  async handleForgotPassword() {
    const { forgotUsername } = this.data;
    if (!forgotUsername) {
      wx.showToast({ title: '请填写用户名', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    try {
      const result = await request({
        url: '/api/auth/forgot-password',
        method: 'POST',
        data: { username: forgotUsername },
        needAuth: false
      });
      wx.showModal({
        title: '申请已提交',
        content: result.message || '请等待管理员处理',
        showCancel: false,
        success: () => this.setData({ mode: 'login', forgotUsername: '' })
      });
    } catch (err) {
      showError('提交失败', err.message);
    } finally {
      this.setData({ loading: false });
    }
  }
});
