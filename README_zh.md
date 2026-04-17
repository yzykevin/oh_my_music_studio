# OMS (Oh My Music Studio)

一款用于分析本地音乐制作工具、系统信息，并通过 Web 前端实时展示的桌面应用。

[**English README · 英文介绍**](README.md)

---

## 功能特性

| 功能 | 说明 |
|---|---|
| **系统信息检测** | 实时显示 macOS/Windows 系统信息（平台、CPU、内存、运行时间） |
| **DAW 检测** | 自动识别已安装的数字音频工作站 |
| **插件扫描** | 扫描并分类显示 VST、VST3、AU、AAX 插件，同名插件自动合并多格式 |
| **辅助工具识别** | 检测吉他效果器、母带工具、音高修正等辅助软件 |
| **驱动软件检测** | 显示音频接口驱动状态 |
| **iLok 支持** | 检测 iLok License Manager |
| **硬件面板** | 音频设备、MIDI 设备、蓝牙音频、运行中的 DAW、开机启动项 |
| **中英双语** | 支持中文/英文界面切换 |
| **深色/浅色主题** | 一键切换明暗主题 |
| **报告导出** | 导出软件扫描报告为 JSON 或 PDF |

---

## 技术栈

| 类别 | 技术 |
|---|---|
| **前端** | Next.js 14 + React + TypeScript |
| **桌面** | Electron 28 |
| **构建** | electron-builder |

---

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

同时启动 Next.js 开发服务器 (http://localhost:3000) 和 Electron 桌面应用。

### 构建

```bash
# 构建前端
npm run build

# 构建主进程
npm run build:main        # 主进程
npm run build:preload     # preload 脚本
npm run build:all          # 两者

# 构建 Electron 应用
npm run electron:build
```

### 代码检查

```bash
npm run lint        # 检查
npm run lint:fix    # 修复
```

---

## 项目结构

```
src/
├── main/                    # Electron 主进程
│   ├── index.ts             # 入口、窗口管理、IPC
│   └── services/             # 检测服务
│       ├── software-detector.ts  # 软件扫描
│       └── audio-detector.ts     # 硬件检测
├── app/                     # Next.js 前端
│   ├── page.tsx             # 主页面
│   ├── layout.tsx           # 根布局
│   ├── page.module.css      # 页面样式
│   ├── globals.css          # 全局样式
│   ├── i18n.ts              # 国际化翻译
│   ├── vendor-logos.tsx     # 厂商 Logo
│   ├── context/              # React Context
│   │   └── ThemeContext.tsx # 主题上下文
│   └── components/          # UI 组件
│       ├── HardwarePanel.tsx    # 硬件面板
│       ├── SummaryCards.tsx     # 汇总卡片
│       ├── Charts.tsx           # 图表
│       ├── ExportMenu.tsx       # 导出菜单（JSON/PDF）
│       └── ThemeInit.tsx        # 主题初始化
├── preload/                  # Electron preload 脚本
│   └── index.ts             # contextBridge API 暴露
└── shared/                   # 共享类型定义
```

---

## 支持的平台

| 平台 | 状态 |
|---|---|
| macOS 12+ | ✅ |
| Windows 10+ | ✅ |

---

## 许可证

MIT
