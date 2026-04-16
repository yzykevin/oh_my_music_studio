'use client';

import styles from './SummaryCards.module.css';

interface SummaryCardsProps {
  totalPlugins: number;
  totalVendors: number;
  totalDAWs: number;
  totalAudioDevices: number;
  lang: 'en' | 'zh';
}

export function SummaryCards({
  totalPlugins,
  totalVendors,
  totalDAWs,
  totalAudioDevices,
  lang,
}: SummaryCardsProps) {
  const cards = [
    {
      icon: '🎛️',
      value: totalPlugins,
      label: lang === 'zh' ? '插件' : 'Plugins',
    },
    {
      icon: '🏢',
      value: totalVendors,
      label: lang === 'zh' ? '厂商' : 'Vendors',
    },
    {
      icon: '🎹',
      value: totalDAWs,
      label: lang === 'zh' ? 'DAW' : 'DAWs',
    },
    {
      icon: '🔊',
      value: totalAudioDevices,
      label: lang === 'zh' ? '音频设备' : 'Audio Devices',
    },
  ];

  return (
    <div className={styles.cardsGrid}>
      {cards.map((card) => (
        <div key={card.label} className={styles.card}>
          <span className={styles.icon}>{card.icon}</span>
          <div className={styles.cardContent}>
            <span className={styles.value}>{card.value.toLocaleString()}</span>
            <span className={styles.label}>{card.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
