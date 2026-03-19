# OneNet IoT 监控 App

微信扫码即可使用的 IoT 传感器实时监控应用（Web App / PWA），无需安装任何软件。

## 功能

| 传感器 | 显示方式 |
|--------|---------|
| 液体温度 | 大字体 + 渐变色温度条（冷蓝→暖橙→热红） |
| 滴速 | 实时数值（滴/分） |
| 水泵 | 开关状态指示 |
| 风扇 | 开关状态指示 |
| PTC 加热器 | 开关状态指示 |
| 消毒灯带 | 开关状态指示 |

## 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) 18+

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

在手机浏览器中访问终端显示的局域网地址（如 `http://192.168.x.x:5173`）即可使用。

### 3. 构建部署

```bash
npm run build
```

生成的 `dist/` 目录可部署到任意 Web 服务器（Nginx、Vercel、Netlify、GitHub Pages 等）。

## 微信扫码使用

1. 将构建后的 `dist/` 部署到公网服务器
2. 生成该网址的二维码
3. 微信扫码 → 直接在微信内置浏览器中打开
4. iOS / Android 均可使用，无需下载任何 App

> 提示：用户可以在浏览器菜单中选择「添加到主屏幕」，获得类似原生 App 的全屏体验。

## 技术栈

- **框架**: React 18 + TypeScript
- **构建**: Vite
- **通讯**: OneNet Studio HTTP API + HMAC-SHA256 Token 鉴权
- **存储**: localStorage（配置持久化）
- **PWA**: manifest.json（支持添加到主屏幕）

## OneNet 属性标识符

可在设置页面自定义，默认值：

| 数据项 | 默认标识符 |
|--------|-----------|
| 液体温度 | `liquid_temp` |
| 滴速 | `drip_rate` |
| 水泵 | `pump_switch` |
| 风扇 | `fan_switch` |
| PTC加热器 | `ptc_heater` |
| 消毒灯带 | `uv_light` |
