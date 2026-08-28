import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as http from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import { scanMusicSoftware, type MusicSoftware } from './services/software-detector';
import { detectAllHardware } from './services/audio-detector';

const execAsync = promisify(exec);

log.transports.file.level = 'info';
log.transports.console.level = 'debug';

log.info('Application starting...');

let mainWindow: BrowserWindow | null = null;
let softwareList: MusicSoftware[] = [];
let softwareScanPromise: Promise<MusicSoftware[]> | null = null;
let softwareScanProgress = 0;
let hardwareScanProgress = 0;

function sendScanProgress(scope: 'software' | 'hardware', progress: number, phase: string): void {
  if (scope === 'software') softwareScanProgress = progress;
  else hardwareScanProgress = progress;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('scan:progress', {
      scope,
      progress,
      overall: Math.round((softwareScanProgress + hardwareScanProgress) / 2),
      phase,
    });
  }
}

function initAutoUpdater(): void {
  autoUpdater.logger = log;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    log.info('[AutoUpdater] Checking for updates...');
  });

  autoUpdater.on('update-available', (info) => {
    log.info(`[AutoUpdater] Update available: ${info.version}`);
    mainWindow?.webContents.send('update:available', {
      version: info.version,
      releaseNotes: info.releaseNotes,
    });
  });

  autoUpdater.on('update-not-available', () => {
    log.info('[AutoUpdater] No update available');
  });

  autoUpdater.on('error', (err) => {
    log.warn('[AutoUpdater] Error:', err.message);
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info(`[AutoUpdater] Update downloaded: ${info.version} (${info.downloadedFile})`);
    mainWindow?.webContents.send('update:downloaded', {
      version: info.version,
      downloadedFile: info.downloadedFile,
    });
    // The user explicitly started the download from the update banner. Install
    // the verified package automatically as soon as electron-updater finishes.
    setTimeout(() => autoUpdater.quitAndInstall(false, true), 500);
  });

  if (!isDev) {
    autoUpdater.checkForUpdates().catch((err) => {
      log.warn('[AutoUpdater] Check failed:', err.message);
    });
  }
}

const isDev = !app.isPackaged;

async function getMacOSVersion(): Promise<string> {
  try {
    const { stdout } = await execAsync('sw_vers -productVersion');
    return 'macOS ' + stdout.trim();
  } catch {
    return 'macOS';
  }
}

async function getSystemInfo() {
  const platform = os.platform();
  let platformName: string = platform;
  const platformVersion = '';

  if (platform === 'darwin') {
    platformName = await getMacOSVersion();
  } else if (platform === 'win32') {
    platformName = 'Windows';
  }

  return {
    platform: platformName,
    platformVersion,
    hostname: os.hostname(),
    cpus: os.cpus(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    uptime: os.uptime(),
  };
}

let productionServer: http.Server | null = null;
const productionServerSockets = new Set<import('net').Socket>();

function shutdownProductionServer(): void {
  if (productionServer) {
    for (const socket of productionServerSockets) {
      socket.destroy();
    }
    productionServerSockets.clear();
    productionServer.close();
    productionServer = null;
  }
}

async function startProductionServer(): Promise<string> {
  const appRoot = app.getAppPath();
  const htmlPath = path.join(appRoot, '.next', 'standalone', '.next', 'server', 'app', 'index.html');
  const staticBase = path.join(appRoot, '.next', 'static');

  let indexHtml = '';
  try {
    if (fs.existsSync(htmlPath)) {
      indexHtml = fs.readFileSync(htmlPath, 'utf-8');
    }
  } catch (err) {
    log.error('Failed to read index.html:', err);
  }

  const server = http.createServer((req, res) => {
    const urlPath = req.url ?? '/';

    if (urlPath === '/') {
      if (indexHtml) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(indexHtml);
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<!DOCTYPE html><html><head><title>Oh My Music Studio</title></head><body><div id="__next"></div></body></html>');
      }
      return;
    }

    if (urlPath.startsWith('/_next/static/')) {
      const relativePath = urlPath.replace('/_next/static/', '');
      const filePath = path.join(staticBase, relativePath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes: Record<string, string> = {
          '.js': 'application/javascript',
          '.mjs': 'application/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.svg': 'image/svg+xml',
          '.ico': 'image/x-icon',
          '.woff': 'font/woff',
          '.woff2': 'font/woff2',
          '.txt': 'text/plain',
        };
        const mimeType = mimeTypes[ext] ?? 'application/octet-stream';
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': mimeType, 'Cache-Control': 'public, max-age=31536000, immutable' });
        res.end(content);
        return;
      }
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  });

  server.on('connection', (socket) => {
    productionServerSockets.add(socket);
    socket.on('close', () => {
      productionServerSockets.delete(socket);
    });
  });

  productionServer = server;

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        const url = `http://127.0.0.1:${addr.port}`;
        log.info(`Production server listening on ${url}`);
        resolve(url);
      } else {
        resolve('http://127.0.0.1:3000');
      }
    });
  });
}

function createWindow(): void {
  log.info('Creating main window...');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/index.js'),
    },
    title: 'OMS',
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    startProductionServer().then((url) => {
      log.info(`Loading production URL: ${url}`);
      mainWindow?.loadURL(url);
    }).catch((err) => {
      log.error('Failed to start production server:', err);
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    shutdownProductionServer();
  });

  log.info('Main window created successfully');
}

async function updateSoftwareList(): Promise<void> {
  if (softwareScanPromise) {
    await softwareScanPromise;
    return;
  }

  softwareScanPromise = scanMusicSoftware((progress, phase) => sendScanProgress('software', progress, phase))
    .then((results) => {
      softwareList = results;
      log.info(`Found ${softwareList.length} music software items`);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('software:update', softwareList);
      }
      return softwareList;
    })
    .catch((error) => {
      log.error('Failed to scan software:', error);
      return softwareList;
    });

  try {
    await softwareScanPromise;
  } finally {
    softwareScanPromise = null;
  }
}

function startBackgroundScans(): void {
  log.info('Starting background scans...');
  softwareScanProgress = 0;
  hardwareScanProgress = 0;
  sendScanProgress('software', 0, 'Starting software scan');
  sendScanProgress('hardware', 0, 'Starting hardware scan');

  void updateSoftwareList();

  detectAllHardware((progress, phase) => sendScanProgress('hardware', progress, phase)).then((hw) => {
    sendScanProgress('hardware', 100, 'Hardware scan complete');
    log.info('Background hardware scan complete');
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('hardware:update', hw);
    }
  }).catch((error) => {
    log.error('Background hardware scan failed:', error);
  });
}

ipcMain.handle('system:info', async () => {
  return await getSystemInfo();
});

ipcMain.handle('software:scan', async () => {
  log.info('Scanning for music software...');
  if (softwareList.length === 0) {
    await updateSoftwareList();
  }
  return softwareList;
});

ipcMain.handle('app:version', () => {
  return app.getVersion();
});

ipcMain.handle('hardware:scan', async () => {
  log.info('Scanning for hardware...');
  try {
    return await detectAllHardware();
  } catch (error) {
    log.error('Failed to scan hardware:', error);
    return {
      audioDevices: [],
      midiDevices: [],
      runningDAWs: [],
      loginItems: [],
      bluetoothAudio: [],
    };
  }
});

ipcMain.handle('export:save-json', async (_event, { filePath, content }: { filePath: string; content: string }) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    log.error('Failed to write JSON file:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('export:save-pdf', async (_event, { filePath, content }: { filePath: string; content: string }) => {
  try {
    const buffer = Buffer.from(content, 'base64');
    fs.writeFileSync(filePath, buffer);
    return { success: true };
  } catch (error) {
    log.error('Failed to write PDF file:', error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('dialog:show-save', async (_event, {
  defaultPath,
  filters,
}: {
  defaultPath: string;
  filters: Array<{ name: string; extensions: string[] }>;
}) => {
  const result = await dialog.showSaveDialog({
    title: 'Export Report',
    defaultPath,
    filters,
  });
  return result.canceled ? null : result.filePath;
});

ipcMain.handle('update:download', async () => {
  try {
    const downloadedFiles = await autoUpdater.downloadUpdate();
    return { success: true, downloadedFile: downloadedFiles[0] };
  } catch (err) {
    return { success: false, error: String(err) };
  }
});

ipcMain.handle('update:install', () => {
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('update:openRelease', () => {
  shell.openExternal('https://github.com/yzykevin/oh_my_music_studio/releases');
});

ipcMain.handle('plugin:open-path', async (_event, pluginPath: string) => {
  if (typeof pluginPath !== 'string' || pluginPath.trim().length === 0) {
    return { success: false, error: 'Invalid plugin path' };
  }

  const normalizedPath = path.resolve(pluginPath);
  if (!fs.existsSync(normalizedPath)) {
    return { success: false, error: 'Plugin path does not exist' };
  }

  try {
    shell.showItemInFolder(normalizedPath);
    return { success: true };
  } catch (error) {
    log.error('Failed to open plugin path:', { pluginPath: normalizedPath, error });
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('update:check', async () => {
  if (isDev) return { available: false };
  try {
    const result = await autoUpdater.checkForUpdates();
    return {
      available: !!result?.updateInfo,
      version: result?.updateInfo?.version,
    };
  } catch {
    return { available: false };
  }
});

app.whenReady().then(() => {
  log.info('App is ready');
  startBackgroundScans();
  createWindow();
  initAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  log.info('All windows closed');
  app.quit();
});

app.on('before-quit', () => {
  log.info('Application quitting...');
  shutdownProductionServer();
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection:', reason);
});
