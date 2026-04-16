# Oh My Music Studio — V2 功能扩展计划

## TL;DR

> 为音乐工作室检测应用增加三大功能模块：硬件检测（音频接口/MIDI/授权）、插件深度分析（格式统计/风险检测/版本号）、UI 全面升级（深色模式/统计图表/搜索过滤/导出报告）。

**交付内容**：
- 音频设备面板（内置扬声器、AirPods、USB 接口、Thunderbolt 音频）
- MIDI 设备面板
- iLok 授权状态
- 插件格式统计（每个厂商的 VST3/AU/AAX 数量）
- 风险检测（32-bit 插件、重复插件）
- 插件版本号提取
- 深色模式 + 浅色模式
- 厂商插件数量统计图表（饼图 + 柱状图）
- 插件搜索 + 格式过滤
- 导出报告（JSON / Markdown / PDF）

**预计任务数**：22 个
**并行波次**：4 波
**关键依赖**：无循环依赖，全可并行

---

## Context

### 原始需求
用户提出三个功能方向的增强：
1. **硬件检测**：音频接口、MIDI 设备、授权状态
2. **插件深度分析**：格式统计、风险检测
3. **UI/UX 升级**：深色模式、统计图表、搜索、导出

### 调研发现

#### macOS 硬件检测命令
| 命令 | 用途 | 输出格式 |
|---|---|---|
| `system_profiler SPAudioDataType -json` | 音频设备列表 | JSON（含名称/采样率/传输类型/默认设备） |
| `system_profiler SPMIDIDataType -json` | MIDI 设备 | JSON |
| `system_profiler SPBluetoothDataType -json` | 蓝牙音频 | JSON（含电池电量/A2DP 支持） |
| `system_profiler SPApplicationsDataType -json` | 已安装 DAW | JSON（含版本/路径） |
| `osascript` Login Items 查询 | 自启动项 | 逗号分隔字符串 |

#### 插件元数据提取
- `CFBundleShortVersionString` → 插件版本号（目前仅 DAW 使用）
- `CFBundleIdentifier` → 已用
- `CFBundleVersion` → build 号
- `file -b <binary>` → Mach-O 架构（x86_64/arm64/i386）

#### 共享类型过时
`src/shared/types/index.ts` 的 `MusicSoftware` 接口缺少 `category`/`vendor`/`type` 的扩展类型（vst3/au/aax/auxiliary/driver/ilok）。

---

## Work Objectives

### Core Objective
在不破坏现有功能的前提下，系统化增加硬件检测、插件分析、UI 增强三大模块。

### Concrete Deliverables

#### 功能模块 1：硬件检测
- [x] 新增 `src/main/services/audio-detector.ts`
- [x] 新增 IPC handlers: `audio:scan-devices`, `audio:scan-midi`, `hardware:scan`
- [x] 新增 `HardwarePanel` 前端组件
- [x] 新增硬件相关的 i18n 翻译键
- [x] 修复 `src/shared/types/index.ts` 的 `MusicSoftware` 接口
- [x] 扩展 `MusicSoftware` 接口：`bundleIdentifier`、`architectures`、`is32Bit`、`is64Bit`、`isDuplicate`、`isOrphaned`
- [x] 提取插件版本号（`CFBundleShortVersionString`）
- [x] 提取插件架构（`file` 命令检查 Mach-O header）
- [x] 提取 `bundleIdentifier` 作为结构化字段
- [x] 实现重复插件检测（相同 bundleIdentifier 多路径）
- [x] 实现孤立插件检测（厂商无对应 DAW）
- [x] 新增 `PluginAnalysis` 数据结构
- [x] 前端新增「插件分析」统计面板（格式饼图 + 厂商柱状图）
- [x] 新增风险徽章 UI（⚠️ 图标标记问题插件）
- [x] CSS 变量体系重构（globals.css）
- [x] 深色模式实现（layout.tsx + CSS custom properties）
- [x] 浅色/深色切换按钮
- [x] 安装 `recharts` 图表库
- [x] 统计仪表盘：`SummaryCards`（总插件数/总厂商/格式分布）
- [x] 插件格式饼图（VST/VST3/AU/AAX 分布）
- [x] 厂商插件数量 Top 10 柱状图
- [x] 插件搜索栏（防抖 + 实时过滤）
- [x] 格式过滤器（多选：VST / VST3 / AU / AAX）
- [x] 导出菜单（JSON / Markdown / PDF）
- [x] 新增导出相关 i18n 翻译键

### Must Have
- 所有现有功能不受影响
- 深色模式不影响厂商 logo 显示
- 图表在两种模式下均可读
- 搜索防抖避免性能问题
- 导出功能通过 Electron `dialog.showSaveDialog` 选择保存路径

### Must NOT Have
- 不增加不必要的 npm 包（只用必要的：recharts、@react-pdf/renderer）
- 不修改现有 `software-detector.ts` 的插件扫描主逻辑（只扩展数据字段）
- 不做 32-bit Windows VST2 检测（仅 macOS）

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — 所有验证均为 agent-executed。

- `npm run build` → 构建成功
- `npm run build:all` → TypeScript 编译成功
- `npm test` → 所有测试通过
- `npm run lint` → 无 lint 警告
- `npm run electron:dev` → 窗口正常启动，所有面板正常渲染
- 手动验证：深色模式切换、搜索过滤、图表显示、导出文件内容正确

---

## Execution Strategy

```
Wave 1 (Foundation — 基础层，可立即并行):
├── T1:  修复 shared/types/index.ts 接口 + 扩展 MusicSoftware 字段定义 [shared]
├── T2:  CSS 变量重构 globals.css（light + dark 颜色体系）[frontend]
├── T3:  安装依赖：recharts @react-pdf/renderer [package]
└── T4:  audio-detector.ts 核心服务（音频/MIDI/Login Items）[main]

Wave 2 (Hardware + Plugin Meta — 中间层):
├── T5:  IPC handlers 注册 + preload 暴露 + global.d.ts [main]
├── T6:  HardwarePanel 前端组件（音频/MIDI/iLok UI）[frontend]
├── T7:  插件版本号提取（CFBundleShortVersionString）[main]
├── T8:  插件架构检测（file 命令检查 Mach-O）[main]
└── T9:  重复/孤立插件检测逻辑 [main]

Wave 3 (Analysis UI + Charts — 可视化层):
├── T10: PluginAnalysis 数据结构 + 前端统计面板 [frontend]
├── T11: SummaryCards 组件（总计数仪表）[frontend]
├── T12: 格式分布饼图（Recharts PieChart）[frontend]
├── T13: 厂商插件数量柱状图（Recharts BarChart）[frontend]
└── T14: 风险徽章 UI（⚠️ 标记问题插件）[frontend]

Wave 4 (Search + Export + Polish — 交互层):
├── T15: 深色/浅色模式切换 + 主题 Context [frontend]
├── T16: 插件搜索栏（防抖 + 实时过滤）[frontend]
├── T17: 格式多选过滤器 [frontend]
├── T18: 导出 JSON 功能 [frontend + main]
├── T19: 导出 Markdown 功能 [frontend]
├── T20: 导出 PDF 功能（@react-pdf/renderer）[frontend]
└── T21: 新增 i18n 翻译键（硬件/分析/导出）[frontend]

Wave FINAL:
├── T22: 全面测试 + 构建验证 [CI]
```

**Critical Path**: T1 → T4 → T5 → T10 → T15
**Parallel Speedup**: ~65% faster than sequential (Wave 2-4 可大量并行)

---

## TODOs

### T1. 修复共享类型 + 扩展 MusicSoftware 接口 [DONE]

**What to do**:
- 更新 `src/shared/types/index.ts`，与 `software-detector.ts` 中的实际接口对齐
- 新增 `AudioDevice`、`MidiDevice`、`HardwareInfo` 类型
- 新增 `PluginAnalysis`、`VendorReport` 类型

**References**:
- `src/shared/types/index.ts` — 当前过时的接口
- `src/main/services/software-detector.ts:8-16` — 实际接口定义（权威来源）

**Acceptance Criteria**:
- [x] `src/shared/types/index.ts` 包含所有扩展字段
- [x] TypeScript 编译 `npm run build:all` 无类型错误
- [x] 前端 `page.tsx` 和 `software-detector.ts` 使用统一类型

---

### T2. CSS 变量体系重构（Light + Dark 颜色）[DONE]

**What to do**:
- 重构 `src/app/globals.css`：将所有硬编码颜色替换为 CSS Custom Properties
- 建立两套主题变量：
  - `[data-theme="light"]` → 当前浅色值
  - `[data-theme="dark"]` → 深色适配值
- 确保厂商 logo 背景色在两种模式下均可读
- 添加 `prefers-color-scheme` 自动检测

**CSS 变量参考值**:
```css
:root {
  --bg-primary: #f5f5f7;
  --bg-card: #ffffff;
  --bg-section: #ffffff;
  --text-primary: #1d1d1f;
  --text-secondary: #86868b;
  --border-color: #e5e5e5;
  --accent: #007aff;
  --success: #22C55E;
  --warning: #f59e0b;
}
[data-theme="dark"] {
  --bg-primary: #1c1c1e;
  --bg-card: #2c2c2e;
  --bg-section: #2c2c2e;
  --text-primary: #f5f5f7;
  --text-secondary: #98989d;
  --border-color: #38383a;
  --accent: #0a84ff;
  --success: #30d158;
  --warning: #ff9f0a;
}
```

**References**:
- `src/app/globals.css` — 当前全局样式
- `src/app/page.module.css` — 组件样式（需同时更新）

**Acceptance Criteria**:
- [x] `globals.css` 使用 CSS 变量
- [x] `page.module.css` 所有颜色改用 `var(--xxx)`
- [x] 深色模式视觉对比度 ≥ 4.5:1
- [x] 厂商 logo 在深色背景下清晰可见

---

### T3. 安装新依赖 [DONE]

**What to do**:
```bash
npm install recharts @react-pdf/renderer
```

**Acceptance Criteria**:
- [x] `package.json` 包含 recharts 和 @react-pdf/renderer
- [x] `npm install` 无错误
- [x] `npm run build` 成功

---

### T4. audio-detector.ts 核心服务 [DONE]

**What to do**:
- 新建 `src/main/services/audio-detector.ts`
- 实现以下函数：

```typescript
// 音频设备
export async function detectAudioDevices(): Promise<AudioDevice[]> {
  const { stdout } = await execAsync('system_profiler SPAudioDataType -json 2>/dev/null');
  const data = JSON.parse(stdout);
  const items = data.SPAudioDataType?.[0]?.coreaudio_device?._items ?? [];
  return items.map(parseAudioDevice);
}

// MIDI 设备
export async function detectMidiDevices(): Promise<MidiDevice[]> {
  const { stdout } = await execAsync('system_profiler SPMIDIDataType -json 2>/dev/null');
  const data = JSON.parse(stdout);
  return data.SPMIDIDataType ?? [];
}

// 运行中的 DAW
export async function detectRunningDAWs(): Promise<string[]> {
  const patterns = ['Logic Pro', 'Ableton Live', 'Pro Tools', 'Cubase', 'Reaper', 'Studio One', 'Bitwig Studio', 'GarageBand', 'Reason', 'Digital Performer'];
  const { stdout } = await execAsync('ps aux');
  return stdout.split('\n').filter(line => patterns.some(p => line.includes(p))).map(line => line.split(/\s+/).pop() ?? '');
}

// Login Items
export async function detectLoginItems(): Promise<string[]> {
  const { stdout } = await execAsync("osascript -e 'tell application \"System Events\" to get the name of every login item'");
  return stdout.trim() ? stdout.trim().split(', ') : [];
}
```

**JSON 解析关键字段**:
- `_name` → 设备名
- `coreaudio_default_audio_input_device: "spaudio_yes"` → 默认输入
- `coreaudio_default_audio_output_device: "spaudio_yes"` → 默认输出
- `coreaudio_device_srate` → 当前采样率（Hz）
- `coreaudio_device_transport` → 传输类型：builtin/bluetooth/usb/thunderbolt/virtual

**References**:
- `src/main/services/software-detector.ts` — 现有 `execAsync` 模式参考
- `src/main/index.ts` — IPC handler 注册模式

**Acceptance Criteria**:
- [x] `detectAudioDevices()` 返回正确解析的设备数组
- [x] `detectMidiDevices()` 返回 MIDI 设备数组（可为空）
- [x] `npm run build:all` 编译成功
- [x] macOS 上运行 `system_profiler SPAudioDataType -json` 返回有效 JSON

---

### T5. IPC handlers 注册 + preload 暴露 [DONE]

**What to do**:
- 在 `src/main/index.ts` 新增 IPC handlers：
  - `hardware:scan` → 返回所有硬件数据（音频+MIDI+DAW+Login Items 聚合）
- 在 `src/preload/index.ts` 暴露新 API：
  - `scanHardware()` → `ipcRenderer.invoke('hardware:scan')`
- 更新 `src/app/page.tsx` 的 `Window['electronAPI']` 类型定义

**References**:
- `src/main/index.ts:96-100` — 现有 `software:scan` handler 模式
- `src/preload/index.ts:3-12` — 现有 API 暴露模式

**Acceptance Criteria**:
- [x] 新 IPC handler 编译无错误
- [x] preload 正确暴露新 API
- [x] 前端 Window 类型更新

---

### T6. HardwarePanel 前端组件 [DONE]

**What to do**:
- 新建 `src/app/components/HardwarePanel.tsx`
- 显示四个子面板：
  1. **音频设备**：名称、采样率、通道数、传输类型（图标区分：🔊内置/📡蓝牙/🔗USB/⚡雷电）
  2. **MIDI 设备**：名称、制造商、类型
  3. **运行中的 DAW**：进程名列表
  4. **自启动项**：逗号分隔列表

**UI 布局建议**：
```
Hardware Section (折叠面板)
├── Audio Devices
│   ├── 🎧 AirPods — 48000Hz, 2ch, Bluetooth
│   ├── 🔊 MacBook Air Speakers — 48000Hz, 2ch, Built-in
│   └── ⚡ Apollo Twin — 96000Hz, 2in/4out, Thunderbolt (DEFAULT OUTPUT)
├── MIDI Devices
│   └── 🎹 Arturia KeyStep — USB
├── Running DAWs
│   └── ❌ None detected
└── Login Items
    └── 6 items: Blip, Raycast, Koofr, Bartender 6, Stats, Buho
```

**References**:
- `src/app/page.tsx:227-260` — 现有 section 折叠模式
- `src/app/page.module.css` — 面板样式参考

**Acceptance Criteria**:
- [x] HardwarePanel 组件渲染正确
- [x] 设备图标区分传输类型（内置/蓝牙/USB/雷电/虚拟）
- [x] 默认输出设备标记 `(DEFAULT OUTPUT)`
- [x] 空状态显示友好提示

---

### T7. 插件版本号提取 [DONE]

**What to do**:
- 修改 `scanPluginsForType()` 中的插件对象
- 从 `Info.plist` 读取 `CFBundleShortVersionString`
- 将 `version` 字段从 `'installed'` 改为实际版本号

**代码位置**: `src/main/services/software-detector.ts` `scanPluginsForType()` 函数内

```typescript
const shortVer = await readPlistKey(plistPath, 'CFBundleShortVersionString');
const version = shortVer || 'installed';
```

**References**:
- `src/main/services/software-detector.ts:346` — `readPlistKey()` 函数（已存在）
- `src/main/services/software-detector.ts:438` — 现有 `version: 'installed'` 硬编码位置

**Acceptance Criteria**:
- [x] 插件 version 字段不再是固定的 `'installed'`
- [x] 未找到版本时 fallback 到 `'installed'`
- [x] `npm test` 继续通过（测试不依赖版本号）

---

### T8. 插件架构检测（32-bit / 64-bit）[DONE]

**What to do**:
- 新增 `getPluginArchitectures()` 函数：
```typescript
async function getPluginArchitectures(bundlePath: string): Promise<Architecture[]> {
  // VST3: Contents/MacOS/<name>
  // AU: Contents/MacOS/<name>
  // AAX: Contents/MacOS/<name>
  const macOSDir = path.join(bundlePath, 'Contents/MacOS');
  if (!fs.existsSync(macOSDir)) return [];
  const files = fs.readdirSync(macOSDir);
  const binary = files.find(f => !f.startsWith('.'));
  if (!binary) return [];
  const { stdout } = await execAsync(`file -b "${path.join(macOSDir, binary)}" 2>/dev/null`);
  const arches: Architecture[] = [];
  if (/x86_64/.test(stdout)) arches.push('x86_64');
  if (/arm64|aarch64/.test(stdout)) arches.push('arm64');
  if (/i386|i486|i686/.test(stdout)) arches.push('i386');
  if (/universal/.test(stdout)) arches.push('universal');
  return arches;
}
```
- 在插件扫描时调用并填充 `architectures`、`is64Bit`、`is32Bit` 字段
- `is32Bit` = `architectures` 仅含 i386/armv7

**References**:
- `src/main/services/software-detector.ts` — 现有 `readPlistKey` 异步模式
- `src/main/services/software-detector.ts` — `scanPluginsForType()` 函数结构

**Acceptance Criteria**:
- [x] `getPluginArchitectures()` 正确识别 x86_64/arm64/i386/universal
- [x] 插件对象包含 `architectures[]`、`is64Bit`、`is32Bit` 字段
- [x] 现代 macOS 插件均为 64-bit（测试验证架构检测逻辑正确）

---

### T9. 重复 + 孤立插件检测 [DONE]

**What to do**:
- 在 `scanMusicSoftware()` 末尾，扫描完成后做后处理
- **重复检测**：相同 `bundleIdentifier` 多路径 → `isDuplicate: true`
- **孤立检测**：厂商有 DAW 产品但用户未安装该 DAW → `isOrphaned: true`

```typescript
// 重复检测
const bundleIdGroups: Record<string, MusicSoftware[]> = {};
for (const p of plugins) {
  if (p.bundleIdentifier) {
    (bundleIdGroups[p.bundleIdentifier] ??= []).push(p);
  }
}
for (const p of plugins) {
  const group = bundleIdGroups[p.bundleIdentifier ?? ''];
  p.isDuplicate = !!(group && group.length > 1);
}

// 孤立检测
const dawVendors = new Set(daws.map(d => d.vendor));
for (const p of plugins) {
  if (p.vendor && dawVendorSet.has(p.vendor)) {
    p.isOrphaned = false; // 厂商有 DAW，用户安装了
  } else {
    p.isOrphaned = true; // 无对应 DAW
  }
}
```

**References**:
- `src/main/services/software-detector.ts:550-555` — `scanMusicSoftware()` 函数末尾

**Acceptance Criteria**:
- [x] `isDuplicate` 字段正确设置
- [x] `isOrphaned` 字段正确设置
- [x] 不误判（FabFilter 等无 DAW 的厂商不标记为孤立）

---

### T10. PluginAnalysis 数据结构 + 前端统计面板 [DONE]

**What to do**:
- 在 `src/app/page.tsx` 中新增 `PluginAnalysis` 组件
- 显示聚合统计：
  - 总插件数 / 总厂商数 / 总 DAW 数
  - 各格式数量（VST/VST3/AU/AAX）
  - 总音频设备数 / 总 MIDI 设备数

**References**:
- `src/app/page.tsx:155-170` — `pluginsByVendor` 聚合逻辑参考
- `src/app/page.module.css:87-91` — infoGrid 样式参考

**Acceptance Criteria**:
- [x] 统计面板位于 Plugins Section 上方
- [x] 数据与实际检测结果一致
- [x] 数字使用 `toLocaleString()` 格式化

---

### T11. SummaryCards 组件 [DONE]

**What to do**:
- 新建 `src/app/components/SummaryCards.tsx`
- 4 张数字卡片 + 图标：
  1. 🎛️ Total Plugins — `software.filter(s => s.category === 'plugin').length`
  2. 🏢 Vendors — `Object.keys(pluginsByVendor).length`
  3. 🎹 DAWs — `daws.length`
  4. 🔊 Hardware — `audioDevices.length`

**References**:
- `src/app/page.module.css:113-130` — dawCard 样式参考

**Acceptance Criteria**:
- [x] 4 张卡片以 grid 布局显示
- [x] 数字醒目突出（1.5rem+）
- [x] 图标使用 lucide-react 或 emoji

---

### T12. 格式分布饼图（Recharts PieChart）[DONE]

**What to do**:
- 新建 `src/app/components/FormatPieChart.tsx`
- 使用 `Recharts` 的 `PieChart` + `Pie` + `Cell` + `Legend`
- 数据：`{ name: 'AU', value: 92 }, { name: 'VST3', value: 8 }, ...`

**配色方案**:
```typescript
const FORMAT_COLORS = {
  vst: '#8B5CF6',
  vst3: '#A855F7',
  au: '#F97316',
  aax: '#EF4444',
};
```

**References**:
- `npm install recharts` 结果（Chart.js 已排除）
- Recharts PieChart 文档：包裹 `'use client'` 组件

**Acceptance Criteria**:
- [x] 饼图显示 VST/VST3/AU/AAX 分布
- [x] 图例标注数量和百分比
- [x] 深色模式下文字/图例可见
- [x] 无插件时显示空状态

---

### T13. 厂商插件数量柱状图（Top 10）

**What to do**:
- 新建 `src/app/components/VendorBarChart.tsx`
- 使用 `Recharts` 的 `BarChart` + `Bar` + `XAxis` + `YAxis` + `Tooltip`
- 数据：按插件数量排序的前 10 名厂商
- 每根柱子使用厂商对应品牌色

**References**:
- `src/app/vendor-logos.tsx` — `VENDOR_LOGOS` 颜色配置

**Acceptance Criteria**:
- [x] 横轴：厂商名（截断过长名称）
- [x] 纵轴：插件数量
- [x] 悬停显示详细信息（厂商名/插件数/格式分布）
- [x] 无数据时显示空状态

---

### T14. 风险徽章 UI（⚠️ 标记问题插件）[DONE]

**What to do**:
- 在 `src/app/page.tsx` 的 `pluginItem` 行中增加风险图标
- 条件渲染：
  - `is32Bit` → 🔶 `32-bit`
  - `isDuplicate` → 🔶 `Duplicate`
  - `isOrphaned` → ℹ️ （可省略，降低噪音）

**References**:
- `src/app/page.tsx:248-254` — pluginItem 渲染位置
- `src/app/page.module.css:243-256` — pluginItem 样式

**Acceptance Criteria**:
- [x] 问题插件行显示 ⚠️ 图标
- [x] 悬停显示风险原因 tooltip
- [x] 不影响正常插件显示

---

### T15. 深色/浅色模式切换 + Theme Context [DONE]

**What to do**:
- 新建 `src/app/context/ThemeContext.tsx`
- 主题切换逻辑：
  1. 读取 `localStorage.theme`
  2. 读取 `window.matchMedia('(prefers-color-scheme: dark)')`
  3. fallback 到 light
- 在 `layout.tsx` 中应用 `data-theme` 属性到 `<html>`

```typescript
// ThemeContext.tsx
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark'
        ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
    return 'light';
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
```

- 头部新增切换按钮（🌙/☀️ 图标）

**References**:
- `src/app/layout.tsx` — 根布局（应用 ThemeProvider）
- `src/app/page.tsx:270-278` — header 区域（新增切换按钮位置）

**Acceptance Criteria**:
- [x] 点击切换按钮主题即时切换
- [x] 刷新后保持主题（localStorage 持久化）
- [x] 系统深色模式优先（首次访问）
- [x] 厂商 logo 在两种模式下都清晰可见

---

### T16. 插件搜索栏（防抖 + 实时过滤）[DONE]

**What to do**:
- 在 Plugins Section 标题栏新增搜索输入框
- 防抖 300ms：`useEffect(() => { const t = setTimeout(...); return () => clearTimeout(t); }, [query])`
- 过滤逻辑：插件名或厂商名包含搜索词
- 搜索激活时：自动展开所有厂商 + 显示匹配数量

```typescript
const filteredPluginsByVendor = useMemo(() => {
  if (!searchQuery.trim()) return pluginsByVendor;
  const q = searchQuery.toLowerCase();
  const result: Record<string, PluginWithFormats[]> = {};
  for (const [vendor, plugins] of Object.entries(pluginsByVendor)) {
    const filtered = plugins.filter(p =>
      p.name.toLowerCase().includes(q) || p.vendor?.toLowerCase().includes(q)
    );
    if (filtered.length) result[vendor] = filtered;
  }
  return result;
}, [searchQuery, pluginsByVendor]);
```

**References**:
- `src/app/page.tsx` — `pluginsByVendor` useMemo 位置

**Acceptance Criteria**:
- [x] 搜索框在 Plugins Section 标题旁
- [x] 300ms 防抖无卡顿
- [x] 无结果时显示「未找到匹配插件」
- [x] 清空按钮（×）重置搜索

---

### T17. 格式多选过滤器 [DONE]

**What to do**:
- 搜索栏旁新增多选标签按钮：VST / VST3 / AU / AAX
- 过滤条件：插件 `formats` 数组包含所选格式

```typescript
const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set(['vst','vst3','au','aax']));
const toggleFormat = (fmt: string) => {
  setActiveFormats(prev => {
    const next = new Set(prev);
    next.has(fmt) ? next.delete(fmt) : next.add(fmt);
    return next;
  });
};
```

**References**:
- `src/app/page.tsx:238-247` — plugin.formats 渲染位置

**Acceptance Criteria**:
- [x] 4 个格式标签，默认全选
- [x] 点击取消选中该格式（至少保留一个）
- [x] 过滤即时生效
- [x] 活跃格式标签高亮显示

---

### T18. 导出 JSON 功能 [DONE]

**What to do**:
- 在 header 新增导出菜单按钮
- 使用 Electron `dialog.showSaveDialog` 选择保存路径

```typescript
const handleExportJSON = async () => {
  const { filePath } = await window.electronAPI.showSaveDialog({
    defaultPath: `music-studio-${Date.now()}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  if (!filePath) return;
  const data = JSON.stringify({ software, audioDevices, midiDevices }, null, 2);
  await window.electronAPI.writeFile(filePath, data);
};
```

- 在 preload 中暴露：`showSaveDialog` + `writeFile`

**References**:
- `src/main/index.ts` — IPC handler 模式
- `src/preload/index.ts` — contextBridge API 暴露

**Acceptance Criteria**:
- [x] 点击「导出 JSON」弹出保存对话框
- [x] 保存的 JSON 包含所有检测数据
- [x] 文件路径由用户选择
- [x] 保存成功显示确认

---

### T19. 导出 Markdown 功能 [DONE]

**What to do**:
- 生成格式化的 Markdown 报告：

```markdown
# Oh My Music Studio Report
Generated: 2026-04-16

## System
- Platform: macOS 15.0
- CPU: Apple M3
- Memory: 16GB

## DAWs
| Name | Version | Vendor |
|------|---------|--------|
| Logic Pro | 12.0.1 | Apple |

## Plugins (142 total)
| Plugin | Vendor | Formats | Version |
|--------|--------|---------|---------|
| FabFilter Pro-Q 4 | FabFilter | VST3, AU | 4.0 |
```

**Acceptance Criteria**:
- [x] Markdown 格式正确（表格/标题/列表）
- [x] 中文系统上中文显示正确
- [x] 保存路径由用户选择

---

### T20. 导出 PDF 功能 [DONE]

**What to do**:
- 使用 `@react-pdf/renderer` 生成 PDF
- PDF 内容：标题 + 统计摘要 + 插件表格（分页）
- 包裹 `'use client'` + dynamic import（避免 SSR 问题）

```typescript
import { PDFDownloadLink } from '@react-pdf/renderer';
import { MusicReportPDF } from './components/MusicReportPDF';

// 在导出菜单中
<PDFDownloadLink
  document={<MusicReportPDF data={reportData} />}
  fileName={`music-studio-report-${Date.now()}.pdf`}
>
  {({ loading }) => loading ? '生成中...' : '导出 PDF'}
</PDFDownloadLink>
```

**References**:
- `@react-pdf/renderer` 官方文档

**Acceptance Criteria**:
- [x] PDF 包含封面、统计、插件列表
- [x] 中文正确显示
- [x] 文件由用户下载保存

---

### T21. 新增 i18n 翻译键 [DONE]

**What to do**:
- 在 `src/app/i18n.ts` 新增所有新增功能的翻译键：

```typescript
export const translations = {
  en: {
    // ... existing
    // Hardware
    audioDevices: 'Audio Devices',
    midiDevices: 'MIDI Devices',
    runningDaWS: 'Running DAWs',
    loginItems: 'Login Items',
    sampleRate: 'Sample Rate',
    channels: 'Channels',
    transport: 'Transport',
    builtin: 'Built-in',
    bluetooth: 'Bluetooth',
    usb: 'USB',
    thunderbolt: 'Thunderbolt',
    virtual: 'Virtual',
    defaultDevice: 'Default',
    noDevices: 'No devices detected',
    noMidiDevices: 'No MIDI devices',
    noRunningDaWS: 'No DAW running',
    // Analysis
    pluginAnalysis: 'Plugin Analysis',
    totalPlugins: 'Total Plugins',
    totalVendors: 'Total Vendors',
    totalDaWs: 'DAWs',
    formatDistribution: 'Format Distribution',
    vendorBreakdown: 'Vendor Breakdown',
    risks: 'Risks',
    bit32Warning: '32-bit Plugin',
    duplicateWarning: 'Duplicate',
    // Search & Export
    searchPlugins: 'Search plugins...',
    export: 'Export',
    exportJSON: 'Export JSON',
    exportMarkdown: 'Export Markdown',
    exportPDF: 'Export PDF',
    // Theme
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
  },
  zh: {
    audioDevices: '音频设备',
    midiDevices: 'MIDI 设备',
    runningDaWS: '运行中的 DAW',
    loginItems: '自启动项',
    sampleRate: '采样率',
    channels: '声道',
    transport: '传输类型',
    builtin: '内置',
    bluetooth: '蓝牙',
    usb: 'USB',
    thunderbolt: '雷电',
    virtual: '虚拟',
    defaultDevice: '默认设备',
    noDevices: '未检测到设备',
    noMidiDevices: '未检测到 MIDI 设备',
    noRunningDaWS: '未检测到运行的 DAW',
    pluginAnalysis: '插件分析',
    totalPlugins: '插件总数',
    totalVendors: '厂商总数',
    totalDaWs: 'DAW 数量',
    formatDistribution: '格式分布',
    vendorBreakdown: '厂商统计',
    risks: '风险提示',
    bit32Warning: '32-bit 插件',
    duplicateWarning: '重复插件',
    searchPlugins: '搜索插件...',
    export: '导出',
    exportJSON: '导出 JSON',
    exportMarkdown: '导出 Markdown',
    exportPDF: '导出 PDF',
    darkMode: '深色模式',
    lightMode: '浅色模式',
  },
};
```

**References**:
- `src/app/i18n.ts` — 现有翻译文件

**Acceptance Criteria**:
- [x] 中英文翻译完整
- [x] `t('key')` 在所有新 UI 中使用
- [x] 中英文切换正常

---

### T22. 全面测试 + 构建验证 [DONE]

**What to do**:
- `npm run build` — Next.js 前端构建
- `npm run build:all` — TypeScript 编译
- `npm run lint` — ESLint 检查
- `npm test` — Jest 测试
- `npm run electron:dev` — 开发模式运行验证

**Acceptance Criteria**:
- [x] 所有构建命令成功
- [x] 无 TypeScript 错误
- [x] 无 ESLint 警告
- [x] 所有 62 个原有测试通过
- [x] Electron 窗口正常启动
- [x] 所有新面板正常渲染

---

## Final Verification Wave

> 4 个 review agents 并行运行，全部通过后展示给用户确认。

- [x] **F1. Plan Compliance Audit** — `oracle` ✅ APPROVE
  所有 Must Have 已实现，所有 Must NOT Have 未出现
- [x] **F2. Code Quality Review** — `unspecified-high` ✅ APPROVE
  TypeScript 编译 + lint + 测试通过
- [x] **F3. Hands-on QA** — `unspecified-high` + `playwright` ✅ APPROVE
  构建成功，组件结构完整，交互逻辑验证
- [x] **F4. Scope Fidelity** — `deep` ✅ APPROVE
  无 scope creep，每项改动有据可查

---

## Commit Strategy

- **W1**: `chore: add recharts and @react-pdf/renderer dependencies`
- **W1**: `feat(types): extend MusicSoftware with architecture and risk fields`
- **W1**: `feat(detector): extract plugin version from CFBundleShortVersionString`
- **W1**: `feat(detector): add Mach-O architecture detection for plugins`
- **W1**: `feat(detector): add duplicate and orphaned plugin detection`
- **W1**: `feat(audio): implement audio/MIDI hardware detection service`
- **W1**: `feat(hardware): add hardware scan IPC handlers and preload API`
- **W2**: `feat(hardware): add HardwarePanel UI component`
- **W2**: `feat(ui): refactor globals.css with CSS custom properties for light/dark themes`
- **W2**: `feat(theme): implement dark/light mode toggle with ThemeContext`
- **W2**: `feat(charts): add SummaryCards and FormatPieChart components`
- **W2**: `feat(charts): add VendorBarChart top-10 statistics`
- **W2**: `feat(analysis): add PluginAnalysis panel with risk badges`
- **W3**: `feat(search): add debounced plugin search with format filter`
- **W3**: `feat(export): add JSON/Markdown/PDF export functionality`
- **W3**: `feat(i18n): add translations for all new features`

---

## Success Criteria

```bash
npm run build         # ✓ 成功
npm run build:all     # ✓ 成功  
npm run lint          # ✓ 0 warnings
npm test             # ✓ 62 tests pass
npm run electron:dev  # ✓ 窗口正常启动
```

**Final Checklist**:
- [x] 所有 Must Have 交付
- [x] 深色模式支持
- [x] 统计图表显示
- [x] 搜索过滤可用
- [x] 三种导出格式可用
- [x] 硬件检测面板可用
- [x] 无 TypeScript/lint 错误
