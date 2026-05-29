const { request } = require('../../utils/api');
const { showError } = require('../../utils/util');

Page({
  data: {
    product: null
  },

  onLoad(options) {
    if (options.id) {
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

  previewImage(e) {
    wx.previewImage({
      current: e.currentTarget.dataset.url,
      urls: this.data.product.images
    });
  }
});
