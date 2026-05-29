# Invento

内部团队使用的库存管理微信小程序。管理者录入货物，客服搜索查询。后端部署在 **阿里云 ECS**。

## 项目结构

```
invento/                 ← 项目根目录（微信开发者工具打开此目录）
├── miniprogram/         # 微信小程序前端
│   ├── config.js        # ← 填入 ECS 公网 IP
│   └── pages/
├── server/              # Node.js 后端 API
│   ├── .env.example     # ← 复制为 .env 并填写配置
│   └── src/
├── project.config.json
└── README.md
```

---

## 一、阿里云 OSS（已配置）

| 项 | 值 |
|---|---|
| Bucket | `invento-photo` |
| 地域 | 华东1（杭州）`oss-cn-hangzhou` |
| 外网 Endpoint | `oss-cn-hangzhou.aliyuncs.com` |
| 图片访问域名（当前可用） | `https://invento-photo.oss-cn-hangzhou.aliyuncs.com` |
| 自定义域名（待 CNAME 绑定） | `https://invento-photo.cn-hangzhou.taihangtop.cn` |
| ECS 内网上传 | `oss-cn-hangzhou-internal.aliyuncs.com` |

在 `server/.env` 填入 RAM 的 **AccessKey**，部署在 ECS 上时保留 `OSS_ENDPOINT` 内网地址。**不要**启用 `OSS_USE_CUSTOM_DOMAIN`，除非已在 OSS 控制台完成自定义域名的 CNAME 与 HTTPS 证书绑定（未完成时会返回 403，小程序图片无法显示）。

**微信小程序（正式上线后）** 需在公众平台配置 **downloadFile 合法域名**：

`https://invento-photo.oss-cn-hangzhou.aliyuncs.com`

开发阶段勾选「不校验合法域名」即可。

---

## 二、访问方式

### 阶段一 · IP 开发（当前）

1. `miniprogram/config.js` 填 ECS 公网 IP
2. `server/.env` 填同一个 `ECS_PUBLIC_IP`
3. 微信开发者工具 → **详情 → 本地设置 → 勾选「不校验合法域名」**
4. ECS 安全组放行 **3000** 端口

测试：`http://你的IP:3000/api/health`

### 阶段二 · 域名上线（以后）

微信小程序不允许 IP 作为合法域名。上线时在 `config.js` 启用：

```javascript
useDomain: true,
domain: 'https://你的备案域名.com',
```

---

## 三、部署步骤（ECS）

```bash
# 上传 invento/server 到 ECS，例如 /opt/invento/server
cd /opt/invento/server
cp .env.example .env
# 编辑 .env：IP、AppID、AppSecret、数据库密码等
npm install
npm run init-db
npm start
```

进程守护：

```bash
npm install -g pm2
pm2 start src/app.js --name invento
pm2 save && pm2 startup
```

---

## 四、微信小程序配置

1. [微信公众平台](https://mp.weixin.qq.com) 注册小程序，建议名称 **Invento** 或 **Invento 库存**
2. 获取 **AppID**、**AppSecret** → 写入 `server/.env`
3. `project.config.json` 里填 **AppID**
4. 微信开发者工具 → **导入项目 → 选择 `invento` 根目录**
5. 管理者验证码默认 `invento2024`（`.env` 的 `MANAGER_CODE` 可改）

---

## 五、API 一览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/health | 健康检查 |
| POST | /api/auth/register | 注册 |
| GET | /api/auth/me | 当前用户 |
| GET | /api/products?keyword= | 搜索 |
| GET | /api/products/:id | 详情 |
| POST | /api/products | 新增（管理者） |
| POST | /api/products/upload | 上传图片（管理者） |

---

## 六、角色说明

- **客服**：注册时选「客服」，可搜索、查看详情
- **管理者**：注册时需输入 `MANAGER_CODE` 验证码，可录入货物

---

## 七、未来识图匹配

数据库 `products.image_keys` 已预留 OSS 对象 key。后续可对接阿里云图像搜索，届时开启 OSS 即可。

---

## 八、本地开发（Windows）

```powershell
cd invento\server
copy .env.example .env
npm install
npm run init-db
npm run dev
```

用微信开发者工具打开 **`invento` 根目录**（不是 miniprogram 子目录）。
