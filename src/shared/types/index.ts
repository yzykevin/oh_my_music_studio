export type Architecture = 'x86_64' | 'arm64' | 'i386' | 'armv7' | 'universal' | 'unknown';

export interface MusicSoftware {
  name: string;
  path: string;
  version: string;
  type: 'daw' | 'vst' | 'vst3' | 'au' | 'aax' | 'auxiliary' | 'driver' | 'ilok' | 'other';
  category: 'daw' | 'plugin' | 'auxiliary' | 'driver' | 'ilok';
  vendor?: string;
  detectedAt: number;
  // Extended fields
  bundleIdentifier?: string;
  bundleVersion?: string;
  bundleShortVersion?: string;
  architectures: Architecture[];
  is64Bit: boolean;
  is32Bit: boolean;
  isDuplicate: boolean;
  duplicatePaths?: string[];
  isOrphaned: boolean;
}

export interface AudioDevice {
  name: string;
  manufacturer: string;
  inputChannels: number;
  outputChannels: number;
  sampleRate: number;
  transport: 'builtin' | 'bluetooth' | 'usb' | 'thunderbolt' | 'virtual' | 'firewire' | 'pci' | 'hdmi' | 'displayport' | 'unknown';
  isDefaultInput: boolean;
  isDefaultOutput: boolean;
  isSystemOutput: boolean;
}

export interface MidiDevice {
  name: string;
  manufacturer: string;
  type: string;
  connected: boolean;
}

export interface BluetoothAudioDevice {
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

export interface HardwareInfo {
  audioDevices: AudioDevice[];
  midiDevices: MidiDevice[];
  runningDAWs: string[];
  loginItems: string[];
  bluetoothAudio: BluetoothAudioDevice[];
}

export interface SystemInfo {
  platform: string;
  hostname: string;
  cpus: Array<{ model: string; speed: number }>;
  totalMemory: number;
  freeMemory: number;
  uptime: number;
}

export interface PluginWithFormats extends MusicSoftware {
  formats: string[];
}
