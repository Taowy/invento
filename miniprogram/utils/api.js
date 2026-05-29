const appConfig = require('../config');

function getToken() {
  return wx.getStorageSync('token') || '';
}

function request(options) {
  const { url, method = 'GET', data = {}, needAuth = true } = options;

  return new Promise((resolve, reject) => {
    const header = { 'Content-Type': 'application/json' };
    if (needAuth) {
      const token = getToken();
      if (token) header.Authorization = `Bearer ${token}`;
    }

    wx.request({
      url: `${appConfig.baseUrl}${url}`,
      method,
      data,
      header,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          wx.reLaunch({ url: '/pages/login/login' });
          reject(new Error(res.data.message || '登录已过期'));
        } else {
          reject(new Error((res.data && res.data.message) || '请求失败'));
        }
      },
      fail() {
        reject(new Error('网络错误，请检查 ECS IP 和安全组是否放行端口'));
      }
    });
  });
}

function wxLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(res) {
        if (res.code) resolve(res.code);
        else reject(new Error('微信登录失败'));
      },
      fail: reject
    });
  });
}

function uploadImage(filePath) {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${appConfig.baseUrl}/api/products/upload`,
      filePath,
      name: 'file',
      header: { Authorization: `Bearer ${getToken()}` },
      success(res) {
        try {
          const data = JSON.parse(res.data);
          if (data.success) resolve(data);
          else reject(new Error(data.message || '上传失败'));
        } catch (e) {
          reject(new Error('上传响应解析失败'));
        }
      },
      fail: () => reject(new Error('图片上传失败'))
    });
  });
}

module.exports = { request, wxLogin, uploadImage, getToken };
