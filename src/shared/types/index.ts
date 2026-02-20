export interface SystemInfo {
  platform: string;
  hostname: string;
  cpus: Array<{ model: string; speed: number }>;
  totalMemory: number;
  freeMemory: number;
  uptime: number;
}

export interface MusicSoftware {
  name: string;
  path: string;
  version: string;
  type: 'daw' | 'vst' | 'plugin' | 'other';
  detectedAt: number;
}
