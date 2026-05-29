const formatTime = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const showError = (title, content) => {
  wx.showModal({
    title: title || '提示',
    content: content || '操作失败，请稍后重试',
    showCancel: false
  });
};

module.exports = {
  formatTime,
  showError
};
