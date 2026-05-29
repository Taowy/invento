const { request } = require('../../utils/api');
const { showError } = require('../../utils/util');

Page({
  data: {
    keyword: '',
    list: [],
    searched: false,
    loading: false
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
    wx.navigateTo({ url: `/pages/product-detail/product-detail?id=${id}` });
  }
});
