# OMS (Oh My Music Studio)

A desktop application for analyzing local music production tools, system information, with real-time display via a Web frontend.

[**中文介绍**](README_zh.md)

---

## Features

| Feature | Description |
|---|---|
| **System Info** | Real-time display of macOS/Windows system info (platform, CPU, memory, uptime) |
| **DAW Detection** | Auto-detect installed Digital Audio Workstations |
| **Plugin Scanning** | Scan and categorize VST, VST3, AU, AAX plugins; auto-merge same plugin across formats |
| **Auxiliary Tools** | Detect guitar amp sims, mastering, pitch correction and more |
| **Driver Detection** | Display audio interface driver status |
| **iLok Support** | Detect iLok License Manager |
| **Hardware Panel** | Audio devices, MIDI devices, Bluetooth audio, running DAWs, login items |
| **Bilingual UI** | Chinese/English interface toggle |
| **Dark/Light Theme** | One-click light/dark theme toggle |
| **Report Export** | Export software scan report as JSON or PDF |

---

## Tech Stack

| | |
|---|---|
| **Frontend** | Next.js 14 + React + TypeScript |
| **Desktop** | Electron 28 |
| **Build** | electron-builder |

---

## Development

### Requirements

- Node.js 18+
- npm 9+

### Installation

```bash
npm install
```

### Development Mode

```bash
npm run electron:dev
```

Starts both the Next.js dev server (http://localhost:3000) and the Electron app concurrently.

### Build

```bash
# Build frontend
npm run build

# Build main process
npm run build:main        # Electron main process
npm run build:preload     # preload script
npm run build:all          # both

# Build Electron app
npm run electron:build
```

### Lint

```bash
npm run lint        # check
npm run lint:fix    # auto-fix
```

---

## Project Structure

```
src/
├── main/                    # Electron main process
│   ├── index.ts             # Entry, window, IPC
│   └── services/             # Detection services
│       ├── software-detector.ts  # Software scanning
│       └── audio-detector.ts     # Hardware detection
├── app/                     # Next.js frontend
│   ├── page.tsx             # Main page
│   ├── layout.tsx           # Root layout
│   ├── page.module.css      # Page styles
│   ├── globals.css          # Global styles
│   ├── i18n.ts              # Internationalization
│   ├── vendor-logos.tsx     # Vendor logos
│   ├── context/             # React Context
│   │   └── ThemeContext.tsx # Theme context
│   └── components/          # UI components
│       ├── HardwarePanel.tsx    # Hardware panel
│       ├── SummaryCards.tsx     # Summary cards
│       ├── Charts.tsx           # Charts (pie/vendor)
│       ├── ExportMenu.tsx       # Export menu (JSON/PDF)
│       └── ThemeInit.tsx        # Theme init
├── preload/                  # Electron preload script
│   └── index.ts             # contextBridge API
└── shared/                   # Shared type definitions
```

---

## Supported Platforms

| Platform | Status |
|---|---|
| macOS 12+ | ✅ |
| Windows 10+ | ✅ |

---

## License

MIT
