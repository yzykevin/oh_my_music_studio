import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface AudioDevice {
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

function parseAudioDevice(item: Record<string, unknown>): AudioDevice {
  const transportRaw = (item.coreaudio_device_transport as string) ?? 'unknown';
  let transport = 'unknown';
  if (transportRaw.includes('builtin')) transport = 'builtin';
  else if (transportRaw.includes('bluetooth')) transport = 'bluetooth';
  else if (transportRaw.includes('usb')) transport = 'usb';
  else if (transportRaw.includes('thunderbolt')) transport = 'thunderbolt';
  else if (transportRaw.includes('virtual')) transport = 'virtual';
  else if (transportRaw.includes('firewire')) transport = 'firewire';
  else if (transportRaw.includes('pci')) transport = 'pci';
  else if (transportRaw.includes('hdmi')) transport = 'hdmi';
  else if (transportRaw.includes('displayport')) transport = 'displayport';

  return {
    name: item._name as string,
    manufacturer: (item.coreaudio_device_manufacturer as string) ?? 'Unknown',
    inputChannels: (item.coreaudio_device_input as number) ?? 0,
    outputChannels: (item.coreaudio_device_output as number) ?? 0,
    sampleRate: (item.coreaudio_device_srate as number) ?? 0,
    transport,
    isDefaultInput: item.coreaudio_default_audio_input_device === 'spaudio_yes',
    isDefaultOutput: item.coreaudio_default_audio_output_device === 'spaudio_yes',
    isSystemOutput: item.coreaudio_default_audio_system_device === 'spaudio_yes',
  };
}

export async function detectAudioDevices(): Promise<AudioDevice[]> {
  try {
    const { stdout } = await execAsync('system_profiler SPAudioDataType -json 2>/dev/null');
    const data = JSON.parse(stdout);
    const items = data.SPAudioDataType?.[0]?.coreaudio_device?._items ?? [];
    return items.map(parseAudioDevice);
  } catch {
    return [];
  }
}

export async function detectMidiDevices(): Promise<MidiDevice[]> {
  try {
    const { stdout } = await execAsync('system_profiler SPMIDIDataType -json 2>/dev/null');
    const data = JSON.parse(stdout);
    const rawDevices = data.SPMIDIDataType ?? [];
    return rawDevices.map((d: Record<string, unknown>) => ({
      name: (d._name as string) ?? 'Unknown',
      manufacturer: (d.manufacturer as string) ?? 'Unknown',
      type: (d.type as string) ?? 'Unknown',
      connected: (d.connected as boolean) ?? false,
    }));
  } catch {
    return [];
  }
}

export async function detectRunningDAWs(): Promise<string[]> {
  const patterns = [
    'Logic Pro', 'Ableton Live', 'Pro Tools', 'Cubase',
    'Reaper', 'Studio One', 'Bitwig Studio', 'GarageBand',
    'Reason', 'Digital Performer', 'Audacity', 'FL Studio',
  ];
  try {
    const { stdout } = await execAsync('ps aux 2>/dev/null');
    const lines = stdout.split('\n');
    const daws = new Set<string>();
    for (const line of lines) {
      for (const p of patterns) {
        if (line.includes(p + '.app') || line.includes('/' + p)) {
          const parts = line.trim().split(/\s+/);
          const cmd = parts[parts.length - 1] ?? '';
          if (cmd && !cmd.includes('grep') && !cmd.includes('ps aux')) {
            daws.add(p);
          }
        }
      }
    }
    return Array.from(daws);
  } catch {
    return [];
  }
}

export async function detectLoginItems(): Promise<string[]> {
  try {
    const { stdout } = await execAsync(
      "osascript -e 'tell application \"System Events\" to get the name of every login item' 2>/dev/null"
    );
    const result = stdout.trim();
    return result ? result.split(', ').map(s => s.trim()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export async function detectBluetoothAudio(): Promise<BluetoothAudioDevice[]> {
  try {
    const { stdout } = await execAsync('system_profiler SPBluetoothDataType -json 2>/dev/null');
    const data = JSON.parse(stdout);
    const btDevices: BluetoothAudioDevice[] = [];
    const items = data.SPBluetoothDataType ?? [];

    for (const section of items) {
      const devices = section.Bluetooth_Classes?.Device ?? [];
      for (const d of devices) {
        const minorType = ((d['Minor Type'] as string) ?? '').toLowerCase();
        const supportsA2DP = ((d.Services as string) ?? '').includes('A2DP');
        if (['headset', 'headphones', 'audio', 'speaker'].some(t => minorType.includes(t))) {
          const leftBat = d['Left Battery Level']
            ? parseInt((d['Left Battery Level'] as string).replace('%', ''), 10)
            : NaN;
          const rightBat = d['Right Battery Level']
            ? parseInt((d['Right Battery Level'] as string).replace('%', ''), 10)
            : NaN;
          btDevices.push({
            name: (d._name as string) ?? 'Unknown',
            address: (d.Address as string) ?? '',
            minorType: (d['Minor Type'] as string) ?? 'Unknown',
            vendorId: (d['Vendor ID'] as string) ?? '',
            productId: (d['Product ID'] as string) ?? '',
            firmwareVersion: (d['Firmware Version'] as string) ?? '',
            leftBattery: isNaN(leftBat) ? undefined : leftBat,
            rightBattery: isNaN(rightBat) ? undefined : rightBat,
            supportsA2DP,
          });
        }
      }
    }
    return btDevices;
  } catch {
    return [];
  }
}

export async function detectAllHardware(): Promise<HardwareInfo> {
  const [audioDevices, midiDevices, runningDAWs, loginItems, bluetoothAudio] = await Promise.all([
    detectAudioDevices(),
    detectMidiDevices(),
    detectRunningDAWs(),
    detectLoginItems(),
    detectBluetoothAudio(),
  ]);
  return { audioDevices, midiDevices, runningDAWs, loginItems, bluetoothAudio };
}
