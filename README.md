# Oh My Music Studio

一个桌面应用程序，用于分析本地音乐制作工具、系统信息，并通过 Web 前端实时展示。

## 功能特性

- **系统信息检测** - 实时显示 macOS/Windows 系统信息
- **DAW 检测** - 自动识别已安装的数字音频工作站
- **插件扫描** - 扫描并分类显示 VST、VST3、AU、AAX 插件
- **辅助工具识别** - 检测吉他效果器、母带工具、音高修正等辅助软件
- **驱动软件检测** - 显示音频接口驱动状态
- **iLok 支持** - 检测 iLok License Manager
- **中英双语** - 支持中文/英文界面切换

## 技术栈

- **前端**: Next.js 14 + React + TypeScript
- **桌面**: Electron 28
- **构建**: electron-builder

## 开发

### 环境要求

- Node.js 18+
- npm 9+

### 安装

```bash
npm install
```

### 开发模式

```bash
npm run electron:dev
```

这会同时启动：
- Next.js 开发服务器 (http://localhost:3000)
- Electron 桌面应用

### 构建

```bash
# 构建前端
npm run build

# 构建主进程
npm run build:main
npm run build:preload
npm run build:all

# 构建 Electron 应用
npm run electron:build
```

### 代码检查

```bash
npm run lint
npm run lint:fix
```

## 项目结构

```
src/
├── main/              # Electron 主进程
│   ├── index.ts       # 入口文件
│   └── services/      # 检测服务
├── app/               # Next.js 前端
│   ├── page.tsx       # 主页面
│   ├── layout.tsx     # 布局
│   └── i18n.ts       # 国际化
├── preload/           # Electron preload 脚本
└── shared/            # 共享类型
```

## 支持的平台

- macOS 12+
- Windows 10+

## 许可证

MIT
