import { contextBridge, ipcRenderer } from 'electron';

interface AudioDevice {
  name: string;
  manufacturer: string;
  inputChannels: number;
  outputChannels: number;
  sampleRate: number;
  transport: string;
  isDefaultInput: boolean;
  isDefaultOutput: boolean;
  isSystemOutput: boolean;
}

interface MidiDevice {
  name: string;
  manufacturer: string;
  type: string;
  connected: boolean;
}

interface BluetoothAudioDevice {
  name: string;
  address: string;
  minorType: string;
  vendorId: string;
  productId: string;
  firmwareVersion: string;
  leftBattery?: number;
  rightBattery?: number;
  supportsA2DP: boolean;
}

interface HardwareInfo {
  audioDevices: AudioDevice[];
  midiDevices: MidiDevice[];
  runningDAWs: string[];
  loginItems: string[];
  bluetoothAudio: BluetoothAudioDevice[];
}

const electronAPI = {
  getSystemInfo: () => ipcRenderer.invoke('system:info'),
  scanSoftware: () => ipcRenderer.invoke('software:scan'),
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  scanHardware: () => ipcRenderer.invoke('hardware:scan') as Promise<HardwareInfo>,
  showSaveDialog: (opts: { defaultPath: string; filters: Array<{ name: string; extensions: string[] }> }) =>
    ipcRenderer.invoke('dialog:show-save', opts) as Promise<string | null>,
  writeFile: (filePath: string, content: string) =>
    ipcRenderer.invoke('export:save-json', { filePath, content }) as Promise<{ success: boolean; error?: string }>,
  writePdfFile: (filePath: string, content: string) =>
    ipcRenderer.invoke('export:save-pdf', { filePath, content }) as Promise<{ success: boolean; error?: string }>,
  onSoftwareUpdate: (callback: (software: unknown[]) => void) => {
    ipcRenderer.on('software:update', (_event, software) => callback(software));
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

export type ElectronAPI = typeof electronAPI;
