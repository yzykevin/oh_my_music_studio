import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import log from 'electron-log';
import { scanMusicSoftware, type MusicSoftware } from './services/software-detector';

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
    title: 'Oh My Music Studio',
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
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
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  log.info('Application quitting...');
});

process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection:', reason);
});
