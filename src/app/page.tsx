'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import styles from './page.module.css';
import { translations, type Language, type TranslationKey } from './i18n';
import { VendorLogo } from './vendor-logos';
import { HardwarePanel } from './components/HardwarePanel';
import { SummaryCards } from './components/SummaryCards';
import { ExportMenu } from './components/ExportMenu';
import { useTheme } from './context/ThemeContext';

const FormatPieChart = dynamic(() => import('./components/Charts').then(m => ({ default: m.FormatPieChart })), {
  ssr: false,
  loading: () => null,
});
const VendorBarChart = dynamic(() => import('./components/Charts').then(m => ({ default: m.VendorBarChart })), {
  ssr: false,
  loading: () => null,
});

interface SystemInfo {
  platform: string;
  hostname: string;
  cpus: Array<{ model: string; speed: number }>;
  totalMemory: number;
  freeMemory: number;
  uptime: number;
}

interface MusicSoftware {
  name: string;
  path: string;
  version: string;
  type: 'daw' | 'vst' | 'vst3' | 'au' | 'aax' | 'auxiliary' | 'driver' | 'ilok' | 'other';
  category: 'daw' | 'plugin' | 'auxiliary' | 'driver' | 'ilok';
  vendor?: string;
}

const PLUGIN_TYPE_ICONS: Record<string, string> = {
  vst: 'VST',
  vst3: 'VST3',
  au: 'AU',
  aax: 'AAX',
};

const PLUGIN_TYPE_COLORS: Record<string, string> = {
  vst: '#8B5CF6',
  vst3: '#A855F7',
  au: '#F97316',
  aax: '#EF4444',
};

interface PluginWithFormats extends MusicSoftware {
  formats: string[];
  isDuplicate?: boolean;
  is32Bit?: boolean;
}

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [software, setSoftware] = useState<MusicSoftware[]>([]);
  const [softwareLoaded, setSoftwareLoaded] = useState(false);
  const [version, setVersion] = useState('');
  const [lang, setLang] = useState<Language>('en');
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());
  const [hardware, setHardware] = useState<HardwareInfo | null>(null);
  const [hardwareLoaded, setHardwareLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);
  const [updateDownloading, setUpdateDownloading] = useState(false);

  const t = useCallback((key: TranslationKey): string => {
    return translations[lang][key];
  }, [lang]);

  useEffect(() => {
    Promise.all([
      window.electronAPI.getSystemInfo().then(setSystemInfo),
      window.electronAPI.getAppVersion().then(setVersion),
    ]);

    window.electronAPI.onSoftwareUpdate((newSoftware) => {
      setSoftware(newSoftware as MusicSoftware[]);
      setSoftwareLoaded(true);
    });

    window.electronAPI.onHardwareUpdate((hw) => {
      setHardware(hw);
      setHardwareLoaded(true);
    });

    window.electronAPI.scanSoftware().then((sw) => {
      setSoftware(sw);
      setSoftwareLoaded(true);
    });

    window.electronAPI.scanHardware().then((hw) => {
      setHardware(hw);
      setHardwareLoaded(true);
    });

    window.electronAPI.onUpdateAvailable((info) => {
      setUpdateVersion(info.version);
    });

    window.electronAPI.onUpdateDownloaded(() => {
      setUpdateDownloading(false);
    });
  }, []);

  const daws = useMemo(() => software.filter(s => s.category === 'daw'), [software]);
  const drivers = useMemo(() => software.filter(s => s.category === 'driver'), [software]);
  const ilok = useMemo(() => software.filter(s => s.category === 'ilok'), [software]);

  const pluginsWithFormats = useMemo(() => {
    const plugins = software.filter(s => s.category === 'plugin');
    const grouped: Record<string, PluginWithFormats> = {};

    for (const plugin of plugins) {
      const key = plugin.name.toLowerCase();
      if (!grouped[key]) {
        grouped[key] = {
          ...plugin,
          formats: [plugin.type],
        };
      } else {
        if (!grouped[key].formats.includes(plugin.type)) {
          grouped[key].formats.push(plugin.type);
        }
      }
    }

    return Object.values(grouped);
  }, [software]);

  const pluginVendors = useMemo(
    () => new Set(pluginsWithFormats.map(p => p.vendor || 'Other')),
    [pluginsWithFormats]
  );

  const auxiliary = useMemo(
    () =>
      software.filter(
        s => s.category === 'auxiliary' && !pluginVendors.has(s.vendor || 'Other')
      ),
    [software, pluginVendors]
  );

  const pluginsByVendor = useMemo(() => {
    const grouped: Record<string, PluginWithFormats[]> = {};
    for (const plugin of pluginsWithFormats) {
      const vendor = plugin.vendor || 'Other';
      if (!grouped[vendor]) {
        grouped[vendor] = [];
      }
      if (!grouped[vendor].find(p => p.name.toLowerCase() === plugin.name.toLowerCase())) {
        grouped[vendor].push(plugin);
      }
    }
    return grouped;
  }, [pluginsWithFormats]);

  const formatData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of pluginsWithFormats) {
      for (const fmt of p.formats) {
        counts[fmt.toUpperCase()] = (counts[fmt.toUpperCase()] ?? 0) + 1;
      }
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [pluginsWithFormats]);

  const vendorData = useMemo(() => {
    return Object.entries(pluginsByVendor)
      .map(([vendor, plugins]) => ({ vendor, count: plugins.length }))
      .sort((a, b) => b.count - a.count);
  }, [pluginsByVendor]);

  const filteredPluginsByVendor = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const result: Record<string, PluginWithFormats[]> = {};
    for (const [vendor, vendorPlugins] of Object.entries(pluginsByVendor)) {
      const filtered = vendorPlugins.filter(p => {
        const matchesSearch =
          !query ||
          p.name.toLowerCase().includes(query) ||
          (p.vendor ?? '').toLowerCase().includes(query);
        const matchesFormat =
          activeFormats.size === 0 ||
          p.formats.some(f => activeFormats.has(f.toUpperCase()));
        return matchesSearch && matchesFormat;
      });
      if (filtered.length > 0) {
        result[vendor] = filtered;
      }
    }
    return result;
  }, [pluginsByVendor, searchQuery, activeFormats]);

  const formatBytes = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)} GB`;
  };

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const toggleVendor = (vendor: string) => {
    const newSet = new Set(expandedVendors);
    if (newSet.has(vendor)) {
      newSet.delete(vendor);
    } else {
      newSet.add(vendor);
    }
    setExpandedVendors(newSet);
  };

  const renderDawSection = (title: string, items: MusicSoftware[]) => {
    if (items.length === 0) return null;
    return (
      <div className={styles.dawSection}>
        <h3 className={styles.subTitle}>{title}</h3>
        <div className={styles.dawGrid}>
          {items.map((item, index) => (
            <div key={index} className={styles.dawCard}>
              <VendorLogo vendor={item.vendor || 'Other'} size={36} />
              <div className={styles.dawInfo}>
                <span className={styles.dawName}>{item.name}</span>
                <span className={styles.dawVersion}>v{item.version}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPluginSection = () => {
    if (Object.keys(filteredPluginsByVendor).length === 0) return null;
    return (
      <div className={styles.pluginSection}>
        <h3 className={styles.subTitle}>{t('plugins')}</h3>
        {Object.entries(filteredPluginsByVendor)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([vendor, vendorPlugins]) => (
            <div key={vendor} className={styles.vendorSection}>
              <button
                className={styles.vendorHeader}
                onClick={() => toggleVendor(vendor)}
              >
                <VendorLogo vendor={vendor} size={24} />
                <span className={styles.vendorName}>{vendor}</span>
                <span className={styles.vendorCount}>{vendorPlugins.length}</span>
                <span className={styles.expandIcon}>
                  {expandedVendors.has(vendor) ? '▼' : '▶'}
                </span>
              </button>

              {expandedVendors.has(vendor) && (
                <ul className={styles.pluginList}>
                  {vendorPlugins.map((plugin, idx) => (
                    <li key={idx} className={styles.pluginItem}>
                      <span className={styles.checkmark}>✓</span>
                      <span className={styles.pluginName}>{plugin.name}</span>
                      {plugin.isDuplicate && (
                        <span className={styles.riskBadge} title="32-bit and 64-bit versions both installed — 32-bit version may not load in modern DAWs">⚠️ 32+64</span>
                      )}
                      {!plugin.isDuplicate && plugin.is32Bit && (
                        <span className={styles.riskBadge32} title="32-bit plugin — may not work in modern DAWs">⚠️ 32-bit</span>
                      )}
                      <div className={styles.formatIcons}>
                        {plugin.formats.map(fmt => (
                          <span
                            key={fmt}
                            className={styles.formatBadge}
                            style={{ backgroundColor: PLUGIN_TYPE_COLORS[fmt] || '#666' }}
                          >
                            {PLUGIN_TYPE_ICONS[fmt] || fmt}
                          </span>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
      </div>
    );
  };

  const hasSoftware = software.length > 0;
  const hasHardware = hardware !== null;

  if (!systemInfo) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>{t('appTitle')}</h1>
        <div className={styles.headerRight}>
          {hasSoftware && hasHardware && (
            <ExportMenu software={software} hardware={hardware} />
          )}
          <button
            className={styles.themeButton}
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button
            className={styles.langButton}
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
          >
            {lang === 'en' ? '中文' : 'EN'}
          </button>
          <span className={styles.version}>v{version || '…'}</span>
        </div>
      </header>

      {updateVersion && (
        <div className={styles.updateBanner}>
          <span>
            {lang === 'zh'
              ? `发现新版本 v${updateVersion}，点击下载`
              : `New version v${updateVersion} available`}
          </span>
          <div className={styles.updateBannerActions}>
            {updateDownloading ? (
              <span className={styles.updateDownloading}>
                {lang === 'zh' ? '下载中…' : 'Downloading…'}
              </span>
            ) : (
              <button
                className={styles.updateDownloadBtn}
                onClick={async () => {
                  setUpdateDownloading(true);
                  await window.electronAPI.downloadUpdate();
                }}
              >
                {lang === 'zh' ? '下载' : 'Download'}
              </button>
            )}
            <button
              className={styles.updateReleaseBtn}
              onClick={() => window.electronAPI.openReleasePage()}
            >
              {lang === 'zh' ? 'Releases' : 'Releases'}
            </button>
            <button
              className={styles.updateDismissBtn}
              onClick={() => setUpdateVersion(null)}
              title={lang === 'zh' ? '关闭' : 'Dismiss'}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <main className={styles.main}>
        <HardwarePanel
          hardware={hardware}
          lang={lang}
          translations={translations[lang]}
          isLoading={!hardwareLoaded && !hasHardware}
        />

        <section className={styles.section}>
          <h2>{t('systemInfo')}</h2>
          {systemInfo && (
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>{t('platform')}</span>
                <span className={styles.value}>{systemInfo.platform}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>{t('hostname')}</span>
                <span className={styles.value}>{systemInfo.hostname}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>{t('cpu')}</span>
                <span className={styles.value}>{systemInfo.cpus[0]?.model || 'Unknown'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>{t('memory')}</span>
                <span className={styles.value}>
                  {formatBytes(systemInfo.freeMemory)} / {formatBytes(systemInfo.totalMemory)}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>{t('uptime')}</span>
                <span className={styles.value}>{formatUptime(systemInfo.uptime)}</span>
              </div>
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h2>{t('musicSoftware')}</h2>

          {renderDawSection(t('daw'), daws)}
          {renderDawSection(lang === 'zh' ? '辅助工具' : 'Auxiliary', auxiliary)}
          {renderDawSection(lang === 'zh' ? '驱动软件' : 'Drivers', drivers)}

          {ilok.length > 0 && (
            <div className={styles.dawSection}>
              <h3 className={styles.subTitle}>iLok</h3>
              <div className={styles.dawGrid}>
                {ilok.map((item, index) => (
                  <div key={index} className={styles.dawCard}>
                    <VendorLogo vendor="PACE" size={36} />
                    <div className={styles.dawInfo}>
                      <span className={styles.dawName}>{item.name}</span>
                      <span className={styles.dawVersion}>{item.version}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pluginsWithFormats.length > 0 ? (
            <>
              <div className={styles.dawSection}>
                <SummaryCards
                  totalPlugins={pluginsWithFormats.length}
                  totalVendors={Object.keys(pluginsByVendor).length}
                  totalDAWs={daws.length}
                  totalAudioDevices={hardware?.audioDevices?.length ?? 0}
                  lang={lang}
                />
              </div>

              {(formatData.length > 0 || vendorData.length > 0) && (
                <div className={styles.chartsRow}>
                  <FormatPieChart data={formatData} lang={lang} />
                  <VendorBarChart data={vendorData} lang={lang} />
                </div>
              )}

              <div className={styles.pluginControls}>
                <input
                  type="text"
                  placeholder={lang === 'zh' ? '搜索插件…' : 'Search plugins...'}
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <div className={styles.formatFilters}>
                  {['VST', 'VST3', 'AU', 'AAX'].map(fmt => (
                    <button
                      key={fmt}
                      className={`${styles.formatChip} ${activeFormats.has(fmt) ? styles.formatChipActive : ''}`}
                      onClick={() => {
                        const next = new Set(activeFormats);
                        if (next.has(fmt)) next.delete(fmt);
                        else next.add(fmt);
                        setActiveFormats(next);
                      }}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              {renderPluginSection()}
            </>
          ) : softwareLoaded ? (
            <p className={styles.empty}>{t('noSoftware')}</p>
          ) : (
            <div className={styles.dawSection}>
              <div className={`${styles.skeleton} ${styles.skeletonCard}`} style={{ height: 80, marginBottom: '1rem' }} />
              <div className={styles.chartsRow}>
                <div className={`${styles.skeleton}`} style={{ height: 220, borderRadius: '0.5rem' }} />
                <div className={`${styles.skeleton}`} style={{ height: 220, borderRadius: '0.5rem' }} />
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

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

  declare global {
    interface Window {
      electronAPI: {
        getSystemInfo: () => Promise<SystemInfo>;
        scanSoftware: () => Promise<MusicSoftware[]>;
        getAppVersion: () => Promise<string>;
        scanHardware: () => Promise<HardwareInfo>;
        showSaveDialog: (opts: { defaultPath: string; filters: Array<{ name: string; extensions: string[] }> }) => Promise<string | null>;
        writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
        writePdfFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
        onSoftwareUpdate: (callback: (software: MusicSoftware[]) => void) => void;
        onHardwareUpdate: (callback: (hardware: HardwareInfo) => void) => void;
        onUpdateAvailable: (callback: (info: { version: string }) => void) => void;
        onUpdateDownloaded: (callback: (info: { version: string }) => void) => void;
        downloadUpdate: () => Promise<void>;
        openReleasePage: () => void;
      };
    }
}
