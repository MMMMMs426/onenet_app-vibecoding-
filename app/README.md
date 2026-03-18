# OneNet IoT 监控 App

跨平台（iOS / Android）移动应用，通过 OneNet 物联网平台实时接收传感器数据。

## 监控指标

| 传感器 | 类型 | 说明 |
|--------|------|------|
| 液体温度 | 数值 | 带渐变色温度条 |
| 滴速 | 数值 | 滴/分 |
| 水泵 | 开关 | 运行状态指示 |
| 风扇 | 开关 | 运行状态指示 |
| PTC 加热器 | 开关 | 运行状态指示 |
| 消毒灯带 | 开关 | 运行状态指示 |

## 技术栈

- **框架**: React Native + Expo
- **语言**: TypeScript
- **导航**: React Navigation (Bottom Tabs)
- **通讯**: OneNet Studio HTTP API + Token 鉴权
- **存储**: AsyncStorage（本地配置持久化）

## 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) 18+
- 手机安装 **Expo Go** 应用（[iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)）

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npx expo start
```

### 3. 手机扫码运行

打开手机上的 Expo Go，扫描终端中显示的二维码即可运行。

### 4. 配置 OneNet

在 App 底部切换到「设置」标签页，填入：

- **产品 ID** — OneNet 控制台中的产品ID
- **设备名称** — 你的设备名称
- **Access Key** — 产品或设备的 AccessKey

点击「保存配置」后切回「监控面板」即可看到实时数据。

## OneNet 属性标识符

App 默认使用以下属性标识符查询设备数据，可在设置中自定义：

| 数据项 | 默认标识符 |
|--------|-----------|
| 液体温度 | `liquid_temp` |
| 滴速 | `drip_rate` |
| 水泵 | `pump_switch` |
| 风扇 | `fan_switch` |
| PTC加热器 | `ptc_heater` |
| 消毒灯带 | `uv_light` |

请确保这些标识符与 OneNet 物模型中定义的属性标识符一致。

## 构建发布版本

```bash
# 构建 Android APK
npx expo build:android

# 构建 iOS IPA
npx expo build:ios
```

或使用 EAS Build：

```bash
npx eas build --platform all
```
