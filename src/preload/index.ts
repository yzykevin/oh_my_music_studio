import { contextBridge, ipcRenderer } from 'electron';

const electronAPI = {
  getSystemInfo: () => ipcRenderer.invoke('system:info'),
  scanSoftware: () => ipcRenderer.invoke('software:scan'),
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  onSoftwareUpdate: (callback: (software: unknown[]) => void) => {
    ipcRenderer.on('software:update', (_event, software) => callback(software));
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
