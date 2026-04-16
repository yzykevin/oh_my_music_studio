'use client';

import styles from './HardwarePanel.module.css';

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

interface HardwarePanelProps {
  hardware: HardwareInfo | null;
  lang: 'en' | 'zh';
  translations: {
    hardware: string;
    audioDevices: string;
    bluetoothAudio: string;
    midiDevices: string;
    runningDAWs: string;
    loginItems: string;
    noHardware: string;
    systemDefault: string;
    defaultOutput: string;
    defaultInput: string;
    items: string;
  };
}

const TRANSPORT_ICONS: Record<string, string> = {
  builtin: '🔊',
  bluetooth: '📡',
  usb: '🔗',
  thunderbolt: '⚡',
  virtual: '🌐',
  firewire: '🔥',
  pci: '🎛️',
  hdmi: '📺',
  displayport: '🖥️',
  unknown: '❓',
};

function formatSampleRate(hz: number): string {
  if (hz >= 1000) return `${(hz / 1000).toFixed(1)} kHz`;
  return `${hz} Hz`;
}

function TransportIcon({ transport }: { transport: string }) {
  return <span>{TRANSPORT_ICONS[transport] ?? '❓'}</span>;
}

export function HardwarePanel({ hardware, lang, translations: t }: HardwarePanelProps) {
  if (!hardware) {
    return (
      <div className={styles.hardwareSection}>
        <h2 className={styles.sectionTitle}>{t.hardware}</h2>
        <p className={styles.empty}>{lang === 'zh' ? '加载中…' : 'Loading…'}</p>
      </div>
    );
  }

  const { audioDevices, midiDevices, runningDAWs, loginItems, bluetoothAudio } = hardware;

  return (
    <div className={styles.hardwareSection}>
      <h2 className={styles.sectionTitle}>{t.hardware}</h2>

      {audioDevices.length > 0 && (
        <div className={styles.subSection}>
          <h3 className={styles.subTitle}>{t.audioDevices}</h3>
          <div className={styles.deviceList}>
            {audioDevices.map((device, i) => (
              <div key={i} className={styles.deviceCard}>
                <div className={styles.deviceHeader}>
                  <TransportIcon transport={device.transport} />
                  <span className={styles.deviceName}>{device.name}</span>
                  {device.isSystemOutput && (
                    <span className={styles.defaultBadge}>{t.systemDefault}</span>
                  )}
                  {device.isDefaultOutput && !device.isSystemOutput && (
                    <span className={styles.defaultBadge}>{t.defaultOutput}</span>
                  )}
                  {device.isDefaultInput && (
                    <span className={styles.defaultBadge}>{t.defaultInput}</span>
                  )}
                </div>
                <div className={styles.deviceMeta}>
                  {device.manufacturer && device.manufacturer !== 'Unknown' && (
                    <span className={styles.metaItem}>{device.manufacturer}</span>
                  )}
                  <span className={styles.metaItem}>{formatSampleRate(device.sampleRate)}</span>
                  {device.inputChannels > 0 && (
                    <span className={styles.metaItem}>{device.inputChannels}{lang === 'zh' ? ' 进' : ' in'}</span>
                  )}
                  {device.outputChannels > 0 && (
                    <span className={styles.metaItem}>{device.outputChannels}{lang === 'zh' ? ' 出' : ' out'}</span>
                  )}
                  <span className={styles.transportBadge}>{device.transport}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {bluetoothAudio.length > 0 && (
        <div className={styles.subSection}>
          <h3 className={styles.subTitle}>{t.bluetoothAudio}</h3>
          <div className={styles.deviceList}>
            {bluetoothAudio.map((device, i) => (
              <div key={i} className={styles.deviceCard}>
                <div className={styles.deviceHeader}>
                  <span>📡</span>
                  <span className={styles.deviceName}>{device.name}</span>
                  {device.supportsA2DP && (
                    <span className={styles.a2dpBadge}>A2DP</span>
                  )}
                </div>
                <div className={styles.deviceMeta}>
                  {device.leftBattery !== undefined && (
                    <span className={styles.batteryBadge}>L: {device.leftBattery}%</span>
                  )}
                  {device.rightBattery !== undefined && (
                    <span className={styles.batteryBadge}>R: {device.rightBattery}%</span>
                  )}
                  {device.leftBattery === undefined && device.rightBattery === undefined && (
                    <span className={styles.metaItem}>—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {midiDevices.length > 0 && (
        <div className={styles.subSection}>
          <h3 className={styles.subTitle}>{t.midiDevices}</h3>
          <div className={styles.deviceList}>
            {midiDevices.map((device, i) => (
              <div key={i} className={styles.deviceCard}>
                <div className={styles.deviceHeader}>
                  <span>🎹</span>
                  <span className={styles.deviceName}>{device.name}</span>
                </div>
                <div className={styles.deviceMeta}>
                  {device.manufacturer && device.manufacturer !== 'Unknown' && (
                    <span className={styles.metaItem}>{device.manufacturer}</span>
                  )}
                  <span className={styles.metaItem}>{device.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {runningDAWs.length > 0 && (
        <div className={styles.subSection}>
          <h3 className={styles.subTitle}>{t.runningDAWs}</h3>
          <div className={styles.tagList}>
            {runningDAWs.map((daw, i) => (
              <span key={i} className={styles.runningDaw}>{daw}</span>
            ))}
          </div>
        </div>
      )}

      {loginItems.length > 0 && (
        <div className={styles.subSection}>
          <h3 className={styles.subTitle}>{t.loginItems}</h3>
          <p className={styles.loginItemsText}>
            {loginItems.length} {t.items}: {loginItems.join(', ')}
          </p>
        </div>
      )}

      {audioDevices.length === 0 && midiDevices.length === 0 &&
       runningDAWs.length === 0 && loginItems.length === 0 &&
       bluetoothAudio.length === 0 && (
        <p className={styles.empty}>{t.noHardware}</p>
      )}
    </div>
  );
}
