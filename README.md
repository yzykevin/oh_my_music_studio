# OMS (Oh My Music Studio)

A desktop application for analyzing local music production tools, system information, with real-time display via a Web frontend.

[**中文介绍 · Chinese README**](README_zh.md)

---

## 功能特性 · Features

| | |
|---|---|
| **系统信息检测** | 实时显示 macOS/Windows 系统信息（平台、CPU、内存、运行时间） |
| **System Info Detection** | Real-time macOS/Windows system info (platform, CPU, memory, uptime) |
| **DAW 检测** | 自动识别已安装的数字音频工作站 |
| **DAW Detection** | Auto-detect installed Digital Audio Workstations |
| **插件扫描** | 扫描并分类显示 VST、VST3、AU、AAX 插件，同名插件自动合并多格式 |
| **Plugin Scanning** | Scan and categorize VST, VST3, AU, AAX plugins, auto-merge same plugin across formats |
| **辅助工具识别** | 检测吉他效果器、母带工具、音高修正等辅助软件 |
| **Auxiliary Tool Detection** | Detect guitar amp sims, mastering, pitch correction and more |
| **驱动软件检测** | 显示音频接口驱动状态 |
| **Driver Detection** | Display audio interface driver status |
| **iLok 支持** | 检测 iLok License Manager |
| **iLok Support** | Detect iLok License Manager |
| **中英双语** | 支持中文/英文界面切换 |
| **Bilingual UI** | Chinese/English interface toggle |
| **深色/浅色主题** | 一键切换明暗主题 |
| **Dark/Light Theme** | One-click light/dark theme toggle |
| **硬件面板** | 音频设备、MIDI 设备、蓝牙音频、运行中的 DAW、开机启动项 |
| **Hardware Panel** | Audio devices, MIDI devices, Bluetooth audio, running DAWs, login items |
| **报告导出** | 导出软件扫描报告为 JSON 或 PDF |
| **Report Export** | Export software scan report as JSON or PDF |

---

## 技术栈 · Tech Stack

| | |
|---|---|
| **前端** | Next.js 14 + React + TypeScript |
| **Frontend** | Next.js 14 + React + TypeScript |
| **桌面** | Electron 28 |
| **Desktop** | Electron 28 |
| **构建** | electron-builder |
| **Build** | electron-builder |

---

## 开发 · Development

### 环境要求 · Requirements

- Node.js 18+
- npm 9+

### 安装 · Installation

```bash
npm install
```

### 开发模式 · Development Mode

```bash
npm run electron:dev
```

这会同时启动 Next.js 开发服务器 (http://localhost:3000) 和 Electron 桌面应用。

This starts both the Next.js dev server (http://localhost:3000) and the Electron app concurrently.

### 构建 · Build

```bash
# 构建前端 · Build frontend
npm run build

# 构建主进程 · Build main process
npm run build:main        # 主进程 main process
npm run build:preload     # preload 脚本 preload script
npm run build:all          # 两者 all

# 构建 Electron 应用 · Build Electron app
npm run electron:build
```

### 代码检查 · Lint

```bash
npm run lint        # 检查 check
npm run lint:fix    # 修复 auto-fix
```

---

## 项目结构 · Project Structure

```
src/
├── main/                    # Electron 主进程 · Electron main process
│   ├── index.ts             # 入口、窗口管理、IPC · Entry, window, IPC
│   └── services/             # 检测服务 · Detection services
│       ├── software-detector.ts  # 软件扫描 · Software scanning
│       └── audio-detector.ts     # 硬件检测 · Hardware detection
├── app/                     # Next.js 前端 · Next.js frontend
│   ├── page.tsx             # 主页面 · Main page
│   ├── layout.tsx           # 根布局 · Root layout
│   ├── page.module.css      # 页面样式 · Page styles
│   ├── globals.css          # 全局样式 · Global styles
│   ├── i18n.ts             # 国际化翻译 · Internationalization
│   ├── vendor-logos.tsx    # 厂商 Logo · Vendor logos
│   ├── context/             # React Context
│   │   └── ThemeContext.tsx # 主题上下文 · Theme context
│   └── components/           # UI 组件 · UI components
│       ├── HardwarePanel.tsx    # 硬件面板 · Hardware panel
│       ├── SummaryCards.tsx     # 汇总卡片 · Summary cards
│       ├── Charts.tsx          # 图表（饼图/厂商图）· Charts
│       ├── ExportMenu.tsx      # 导出菜单（JSON/PDF）· Export menu
│       └── ThemeInit.tsx       # 主题初始化 · Theme init
├── preload/                  # Electron preload 脚本 · preload script
│   └── index.ts             # contextBridge API 暴露 · Expose API
└── shared/                  # 共享类型定义 · Shared type definitions
```

---

## 支持的平台 · Supported Platforms

| | |
|---|---|
| macOS 12+ | ✅ |
| Windows 10+ | ✅ |

---

## 许可证 · License

MIT
