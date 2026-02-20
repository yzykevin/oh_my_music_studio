'use client';

import { useState, useEffect, useMemo } from 'react';
import styles from './page.module.css';
import { translations, type Language, type TranslationKey } from './i18n';

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

const VENDOR_LOGOS: Record<string, string> = {
  'IK Multimedia': '🎸',
  'Native Instruments': '🎹',
  'iZotope': '💎',
  'Waves': '🌊',
  'FabFilter': '🎛️',
  'Soundtoys': '🎵',
  'Spectrasonics': '🔮',
  'Arturia': '⌨️',
  'Steinberg': '🎹',
  'Roland': '🥁',
  'YAMAHA': '🎹',
  'Korg': '🎛️',
  'Universal Audio': '🎤',
  'Apple': '🍎',
  'Ableton': '🎛️',
  'Avid': '🎬',
  'Image-Line': '💠',
  'Cockos': '🦎',
  'PreSonus': '🎚️',
  'Bitwig': '🌊',
  'Reason Studios': '🎹',
  'MOTU': '🎵',
  'Celemony': '🎼',
  'Antares': '🎤',
  'Scaler Music': '🎼',
  'Xfer Records': '💈',
  'Valhalla DSP': '🏛️',
  'Eventide': '✨',
  'SSL': '🔊',
  'Tokyo Dawn Records': '🌅',
  'Melda Production': '🎚️',
  'Tracktion': '🎛️',
  'Line 6': '🎸',
  'Neural DSP': '🎸',
  'Positive Grid': '🎸',
  'Overloud': '🎸',
  'Softube': '🔉',
  'PACE': '🔑',
  'Apogee': '🎤',
  'RME': '🔊',
  'Focusrite': '🔊',
  'Other': '📦',
};

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
}

function getVendorEmoji(vendor: string): string {
  return VENDOR_LOGOS[vendor] || '📦';
}

export default function Home() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [software, setSoftware] = useState<MusicSoftware[]>([]);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState('');
  const [lang, setLang] = useState<Language>('en');
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());

  const t = (key: TranslationKey): string => {
    return translations[lang][key];
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sysInfo = await window.electronAPI.getSystemInfo();
        setSystemInfo(sysInfo);

        const sw = await window.electronAPI.scanSoftware();
        setSoftware(sw);

        const ver = await window.electronAPI.getAppVersion();
        setVersion(ver);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    window.electronAPI.onSoftwareUpdate((newSoftware) => {
      setSoftware(newSoftware);
    });
  }, []);

  const daws = useMemo(() => software.filter(s => s.category === 'daw'), [software]);
  const auxiliary = useMemo(() => software.filter(s => s.category === 'auxiliary'), [software]);
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
              <div className={styles.dawIcon}>{getVendorEmoji(item.vendor || 'Other')}</div>
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
    if (Object.keys(pluginsByVendor).length === 0) return null;
    return (
      <div className={styles.pluginSection}>
        <h3 className={styles.subTitle}>{t('plugins')}</h3>
        {Object.entries(pluginsByVendor)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([vendor, vendorPlugins]) => (
            <div key={vendor} className={styles.vendorSection}>
              <button 
                className={styles.vendorHeader}
                onClick={() => toggleVendor(vendor)}
              >
                <span className={styles.vendorIcon}>{getVendorEmoji(vendor)}</span>
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

  if (loading) {
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
          <button 
            className={styles.langButton}
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}
          >
            {lang === 'en' ? '中文' : 'EN'}
          </button>
          <span className={styles.version}>v{version}</span>
        </div>
      </header>

      <main className={styles.main}>
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
              <h3 className={styles.subTitle}>🔑 iLok</h3>
              <div className={styles.dawGrid}>
                {ilok.map((item, index) => (
                  <div key={index} className={styles.dawCard}>
                    <div className={styles.dawIcon}>🔑</div>
                    <div className={styles.dawInfo}>
                      <span className={styles.dawName}>{item.name}</span>
                      <span className={styles.dawVersion}>{item.version}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {renderPluginSection()}

          {software.length === 0 && (
            <p className={styles.empty}>{t('noSoftware')}</p>
          )}
        </section>
      </main>
    </div>
  );
}

declare global {
  interface Window {
    electronAPI: {
      getSystemInfo: () => Promise<SystemInfo>;
      scanSoftware: () => Promise<MusicSoftware[]>;
      getAppVersion: () => Promise<string>;
      onSoftwareUpdate: (callback: (software: MusicSoftware[]) => void) => void;
    };
  }
}
