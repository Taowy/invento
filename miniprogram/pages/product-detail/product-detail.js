const { request } = require('../../utils/api');
const { showError } = require('../../utils/util');
const { canWriteProducts } = require('../../utils/role');

Page({
  data: {
    product: null,
    canEdit: false
  },

  onLoad(options) {
    if (options.id) {
      const userInfo = wx.getStorageSync('userInfo');
      this.setData({ canEdit: canWriteProducts(userInfo && userInfo.role) });
      this.loadDetail(options.id);
    }
  },

  async loadDetail(id) {
    wx.showLoading({ title: '加载中' });
    try {
      const result = await request({ url: `/api/products/${id}` });
      if (result.success) {
        this.setData({ product: result.product });
      } else {
        showError('加载失败', result.message);
      }
    } catch (err) {
      showError('加载失败', err.message);
    } finally {
      wx.hideLoading();
    }
  },

  goEdit() {
    if (!this.data.product) return;
    wx.navigateTo({ url: `/pages/product-edit/product-edit?id=${this.data.product.id}` });
  },

  previewImage(e) {
    wx.previewImage({
      current: e.currentTarget.dataset.url,
      urls: this.data.product.images
    });
  }
});
