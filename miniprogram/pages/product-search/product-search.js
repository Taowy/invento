const { request } = require('../../utils/api');
const { showError } = require('../../utils/util');
const { canWriteProducts } = require('../../utils/role');

Page({
  data: {
    keyword: '',
    list: [],
    searched: false,
    loading: false,
    editMode: false
  },

  onLoad(options) {
    const editMode = options.mode === 'edit';
    this.setData({ editMode });
    if (editMode) {
      wx.setNavigationBarTitle({ title: '修改' });
    }
  },

  onShow() {
    this.doSearch();
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  async doSearch() {
    if (this.data.loading) return;
    this.setData({ loading: true });

    try {
      const keyword = this.data.keyword.trim();
      const result = await request({
        url: `/api/products?keyword=${encodeURIComponent(keyword)}`
      });
      this.setData({
        list: result.list || [],
        searched: true
      });
    } catch (err) {
      showError('查询失败', err.message);
    } finally {
      this.setData({ loading: false });
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    if (this.data.editMode) {
      const userInfo = wx.getStorageSync('userInfo');
      if (!canWriteProducts(userInfo && userInfo.role)) {
        wx.showToast({ title: '无修改权限', icon: 'none' });
        return;
      }
      wx.navigateTo({ url: `/pages/product-edit/product-edit?id=${id}` });
      return;
    }
    wx.navigateTo({ url: `/pages/product-detail/product-detail?id=${id}` });
  }
});
