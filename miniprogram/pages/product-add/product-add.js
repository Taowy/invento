const { request, uploadImage } = require('../../utils/api');
const { showError } = require('../../utils/util');
const { getThemeColors } = require('../../utils/theme');

Page({
  behaviors: [require('../../behaviors/theme')],

  data: {
    themeColors: getThemeColors(),
    images: [],
    imageKeys: [],
    name: '',
    price: '',
    spec: '',
    stock: '',
    remark: '',
    submitting: false
  },

  onNameInput(e) { this.setData({ name: e.detail.value }); },
  onPriceInput(e) { this.setData({ price: e.detail.value }); },
  onSpecInput(e) { this.setData({ spec: e.detail.value }); },
  onStockInput(e) { this.setData({ stock: e.detail.value }); },
  onRemarkInput(e) { this.setData({ remark: e.detail.value }); },

  chooseImage() {
    const remain = 3 - this.data.images.length;
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sizeType: ['compressed'],
      success: async (res) => {
        wx.showLoading({ title: '上传中...', mask: true });
        try {
          for (const file of res.tempFiles) {
            const result = await uploadImage(file.tempFilePath);
            this.setData({
              images: [...this.data.images, result.url],
              imageKeys: [...this.data.imageKeys, result.key]
            });
          }
        } catch (err) {
          showError('上传失败', err.message);
        } finally {
          wx.hideLoading();
        }
      }
    });
  },

  removeImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.images];
    const imageKeys = [...this.data.imageKeys];
    images.splice(index, 1);
    imageKeys.splice(index, 1);
    this.setData({ images, imageKeys });
  },

  previewImage(e) {
    wx.previewImage({
      current: e.currentTarget.dataset.url,
      urls: this.data.images
    });
  },

  async submit() {
    if (this.data.submitting) return;
    const { name, price, images, imageKeys, spec, stock, remark } = this.data;

    if (!name.trim()) {
      wx.showToast({ title: '请填写货物名称', icon: 'none' });
      return;
    }
    if (!price) {
      wx.showToast({ title: '请填写价格', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      const result = await request({
        url: '/api/products',
        method: 'POST',
        data: { name: name.trim(), price, spec, stock, remark, images, imageKeys }
      });

      if (result.success) {
        wx.showToast({ title: '保存成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 800);
      } else {
        showError('保存失败', result.message);
      }
    } catch (err) {
      showError('保存失败', err.message);
    } finally {
      this.setData({ submitting: false });
    }
  }
});
