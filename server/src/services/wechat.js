const https = require('https');
const config = require('../config');

function wxRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

async function code2Session(code) {
  if (!config.wxAppId || !config.wxSecret) {
    throw new Error('请在 .env 中配置 WX_APPID 和 WX_SECRET');
  }
  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${config.wxAppId}&secret=${config.wxSecret}&js_code=${code}&grant_type=authorization_code`;
  const result = await wxRequest(url);
  if (result.errcode) {
    throw new Error(result.errmsg || '微信登录失败');
  }
  return result;
}

module.exports = { code2Session };
