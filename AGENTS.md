# AGENTS.md — 智能编码指南

本文档为在该项目中工作的 AI 智能体提供上下文信息。

---

## 项目概述

**oh_my_music_studio** — 一个桌面应用程序，用于分析本地音乐制作工具、系统信息，并通过 Web 前端实时展示更新。

- **平台**: 桌面端 (macOS, Windows)
- **技术栈**: Electron + React/Next.js (Web 前端展示)
- **目的**: 检测并监控已安装的音乐制作软件，实时展示系统信息

---

## 1. 构建 / Lint / 测试命令

### 核心命令

```bash
# 安装依赖
npm install

# 开发
npm run dev          # 启动 Next.js 开发服务器
npm run electron:dev  # 同时启动前端和 Electron (推荐)

# 构建
npm run build        # 构建 Next.js 前端
npm run build:main   # 编译 Electron 主进程
npm run build:preload # 编译 preload 脚本
npm run build:all    # 编译主进程和 preload
npm run electron:build  # 构建 Electron 应用 (生成 .exe/.app)

# 代码检查
npm run lint         # 运行 ESLint 检查所有文件
npm run lint:fix     # 自动修复 ESLint 问题

# 测试
npm test             # 运行所有测试
npm test -- --watch # 以监听模式运行测试
npm test -- <file>   # 运行单个测试文件
npm test -- --coverage  # 运行测试并生成覆盖率报告
```

### 包管理器

- 本项目使用 **npm** (不使用 yarn/pnpm)
- 拉取新代码后运行 `npm install`

---

## 2. 代码风格指南

### 基本原则

- 编写**清晰可读**的代码 — 清晰优于巧妙
- 保持函数**小而专注** (最多约 50 行)
- 使用**有意义的变量/函数名**
- 注释**原因**，而非内容 — 解释非显而易见的决策
- **不要写 TODO 注释** — 要么现在修复，要么创建 issue

### TypeScript

- **始终使用 TypeScript** — 不使用纯 JavaScript 文件
- 简单类型优先使用 `type` 而非 `interface`
- 为公共函数使用显式返回类型
- 禁止使用 `any` — 如果类型真的未知，使用 `unknown`
- 在 tsconfig.json 中启用严格模式

```typescript
// Good
function getMusicSoftware(): MusicSoftware[] {
  return [];
}

// Bad
function getMusicSoftware() {
  return [];
}
```

### 导入与组织

- 使用**路径别名** (在 tsconfig.json 中配置: `@/`, `@components/` 等)
- 按以下顺序分组导入:
  1. Node 内置模块 (`path`, `fs`, `os`)
  2. 外部库 (`electron`, `react`, `next`)
  3. 内部模块 (`@/utils`, `@components`)
  4. 类型导入 (使用 `type` 关键字)
- 各组内按字母顺序排序

```typescript
import path from 'path';
import { app, BrowserWindow } from 'electron';
import { useState } from 'react';

import { MusicDetector } from '@/core/detector';
import type { MusicSoftware } from '@/types';
```

### 命名约定

| 元素 | 约定 | 示例 |
|------|------|------|
| 文件 (组件) | PascalCase | `MusicDetector.ts`, `SoftwareList.tsx` |
| 文件 (工具函数) | kebab-case | `file-helpers.ts`, `system-info.ts` |
| 函数 | camelCase | `getInstalledSoftware()` |
| 类 | PascalCase | `class MusicDetector` |
| 常量 | UPPER_SNAKE_CASE | `MAX_SCAN_DEPTH = 10` |
| React 组件 | PascalCase | `<SoftwareList />` |
| 布尔变量 | is/has/can 前缀 | `isInstalled`, `hasPermission` |

### React / 前端

- 使用**函数组件**配合 hooks — 不使用类组件
- 为自定义 hooks 使用 **TypeScript 泛型**
- 组件样式与组件放在一起 (使用 CSS modules 或 styled-components)
- 将可复用逻辑提取到**自定义 hooks**
- 使用 `useMemo` / `useCallback` 缓存昂贵计算
- 使用 `eslint-plugin-react-hooks` — 遵循其规则

```typescript
// Good — 带泛型的自定义 hook
function useSoftwareList<T extends Software>(fetcher: () => Promise<T[]>) {
  const [data, setData] = useState<T[]>([]);
  // ...
}
```

### 错误处理

- 永远不要静默吞掉错误 — 始终记录或处理
- 使用**try/catch**配合具体错误处理
- 为领域错误创建自定义错误类
- 禁止使用空 catch 块

```typescript
// Good
try {
  await detectSoftware();
} catch (error) {
  logger.error('Software detection failed', { error });
  return [];
}

// Bad
try {
  await detectSoftware();
} catch (e) {}
```

### 日志记录

- 使用结构化日志 (如 `electron-log`)
- 日志级别: `error`, `warn`, `info`, `debug`
- 日志中包含上下文 — 而非仅消息

```typescript
logger.error('Failed to scan directory', { path, error: err.message });
```

### 测试

- 测试**行为**，而非实现
- 测试文件放在源文件旁边: `utils.ts` → `utils.test.ts`
- 使用描述性测试名: `should return empty array when no software found`
- Mock 外部依赖 (文件系统、shell 命令)
- 核心逻辑最低 **80% 覆盖率**

---

## 3. 架构指南

### 项目结构

```
src/
├── main/              # Electron 主进程
│   └── index.ts       # 入口文件
├── app/               # Next.js 前端 (App Router)
│   ├── layout.tsx     # 根布局
│   ├── page.tsx       # 主页面
│   ├── page.module.css
│   └── globals.css
├── preload/           # Electron preload 脚本
│   └── index.ts
├── renderer/          # 前端组件 (备用)
│   ├── components/
│   ├── hooks/
│   └── lib/
└── shared/            # 主进程/渲染进程共享
    └── types/
```

### IPC 通信 (Electron)

- 使用 **contextBridge** 实现安全的主进程/渲染进程通信
- 将 IPC 通道定义为常量
- 在主进程中验证所有 IPC 输入

```typescript
// 共享通道名
export const IPC_CHANNELS = {
  SCAN_SOFTWARE: 'software:scan',
  GET_SYSTEM_INFO: 'system:info',
  ON_UPDATE: 'software:update',
} as const;
```

### 状态管理

- 使用 **React Context** 管理全局 UI 状态
- 使用 **React Query** (TanStack Query) 管理服务器/API 状态
- 使用 `useState` 管理组件本地状态

---

## 4. Git 工作流

### 提交信息

遵循 [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add VST plugin detector
fix: handle missing registry keys on Windows
chore: update electron to v28
docs: add installation instructions
refactor: simplify software matching logic
```

### 分支命名

- `feature/` — 新功能
- `fix/` — Bug 修复
- `refactor/` — 代码重构
- `chore/` — 维护、更新

示例: `feature/add-asio-support`, `fix/windows-scan-timeout`

---

## 5. 智能体注意事项

### 必须做

- 提交前运行 `npm run lint`
- 尽可能在 macOS 和 Windows 上测试
- 使用 `npm test` 验证更改
- 遵循导入排序规则
- 为新功能编写测试

### 禁止做

- 不要直接提交到 `main` — 使用功能分支
- 不要使用 `any` 类型 — 改用 `unknown`
- 不要在生产代码中留下 console.log
- 不要跳过错误处理
- 不要提交大二进制文件 (添加到 .gitignore)

### 首次设置

```bash
# 克隆仓库
git clone <repo-url>
cd oh_my_music_studio

# 安装依赖
npm install

# 编译主进程和 preload
npm run build:all

# 验证设置
npm run lint
npm test

# 开始开发 (同时运行前端和 Electron)
npm run electron:dev
```

---

## 6. 常用命令参考

```bash
# 分析代码潜在问题
npm run lint

# 运行指定测试文件
npm test -- src/core/detector.test.ts

# 检查 TypeScript 类型但不构建
npx tsc --noEmit

# 列出所有可用脚本
npm run
```
