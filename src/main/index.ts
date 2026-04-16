import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as http from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';
import log from 'electron-log';
import { scanMusicSoftware, type MusicSoftware } from './services/software-detector';
import { detectAllHardware } from './services/audio-detector';

const execAsync = promisify(exec);

log.transports.file.level = 'info';
log.transports.console.level = 'debug';

log.info('Application starting...');

let mainWindow: BrowserWindow | null = null;
let softwareList: MusicSoftware[] = [];

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
  try {
    softwareList = await scanMusicSoftware();
    log.info(`Found ${softwareList.length} music software items`);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('software:update', softwareList);
    }
  } catch (error) {
    log.error('Failed to scan software:', error);
  }
}

ipcMain.handle('system:info', async () => {
  return await getSystemInfo();
});

ipcMain.handle('software:scan', async () => {
  log.info('Scanning for music software...');
  await updateSoftwareList();
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

app.whenReady().then(() => {
  log.info('App is ready');
  createWindow();

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
