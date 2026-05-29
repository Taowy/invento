const { request } = require('../../utils/api');
const { showError, formatTime } = require('../../utils/util');
const { getThemeColors } = require('../../utils/theme');

Page({
  behaviors: [require('../../behaviors/theme')],

  data: {
    themeColors: getThemeColors(),
    list: [],
    loading: false,
    selectedId: null,
    newPassword: '',
    confirmPassword: '',
    submitting: false
  },

  onShow() {
    this.loadList();
  },

  async loadList() {
    this.setData({ loading: true });
    try {
      const result = await request({ url: '/api/auth/reset-requests' });
      const list = (result.list || []).map((item) => ({
        ...item,
        requestedAtText: formatTime(item.requestedAt)
      }));
      this.setData({ list, selectedId: null, newPassword: '', confirmPassword: '' });
    } catch (err) {
      showError('加载失败', err.message);
    } finally {
      this.setData({ loading: false });
    }
  },

  selectRequest(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({
      selectedId: id === this.data.selectedId ? null : id,
      newPassword: '',
      confirmPassword: ''
    });
  },

  onNewPasswordInput(e) { this.setData({ newPassword: e.detail.value }); },
  onConfirmPasswordInput(e) { this.setData({ confirmPassword: e.detail.value }); },

  async submitReset() {
    if (this.data.submitting) return;
    const { selectedId, newPassword, confirmPassword } = this.data;
    if (!selectedId) {
      wx.showToast({ title: '请选择申请', icon: 'none' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      wx.showToast({ title: '新密码至少 6 位', icon: 'none' });
      return;
    }
    if (newPassword !== confirmPassword) {
      wx.showToast({ title: '两次密码不一致', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      const result = await request({
        url: `/api/auth/reset-requests/${selectedId}/resolve`,
        method: 'POST',
        data: { newPassword }
      });
      if (result.success) {
        wx.showToast({ title: '密码已重置', icon: 'success' });
        this.loadList();
      } else {
        showError('重置失败', result.message);
      }
    } catch (err) {
      showError('重置失败', err.message);
    } finally {
      this.setData({ submitting: false });
    }
  }
});
