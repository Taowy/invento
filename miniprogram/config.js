/**
 * Invento · 库存管理小程序配置
 *
 * 【阶段一 · IP 开发】填入 ECS 公网 IP，开发者工具勾选「不校验合法域名」
 * 【阶段二 · 正式上线】启用 useDomain，改为 HTTPS 备案域名
 */
module.exports = {
  ecsPublicIp: '47.96.99.224',
  port: 3000,

  // useDomain: true,
  // domain: 'https://你的备案域名.com',

  get baseUrl() {
    // if (this.useDomain) return this.domain;
    return `http://${this.ecsPublicIp}:${this.port}`;
  },

  /** 角色插图 OSS 地址（运行 server/scripts/upload-role-assets.js 上传后生效） */
  roleImages: {
    service: 'https://invento-photo.cn-hangzhou.taihangtop.cn/invento/static/roles/role-service.jpg',
    recorder: 'https://invento-photo.cn-hangzhou.taihangtop.cn/invento/static/roles/role-recorder.jpg',
    manager: 'https://invento-photo.cn-hangzhou.taihangtop.cn/invento/static/roles/role-manager.jpg'
  }
};
