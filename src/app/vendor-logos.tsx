import { type FC } from 'react';

interface LogoProps {
  size?: number;
  vendor?: string;
}

interface VendorConfig {
  code: string;
  bg: string;
}

const VENDOR_LOGOS: Record<string, VendorConfig> = {
  'IK Multimedia':    { code: 'IK', bg: '#F5A623' },
  'Native Instruments': { code: 'NI', bg: '#AAAAAA' },
  'iZotope':         { code: 'iZ', bg: '#333333' },
  'Waves':          { code: 'WV', bg: '#009DC8' },
  'FabFilter':       { code: 'FF', bg: '#E55100' },
  'Softube':         { code: 'ST', bg: '#2D3436' },
  'Universal Audio':  { code: 'UA', bg: '#2C3E50' },
  'Celemony':        { code: 'CE', bg: '#00B894' },
  'Pulsar Audio':   { code: 'PU', bg: '#E84393' },
  'Valhalla DSP':   { code: 'VV', bg: '#9B59B6' },
  'SSL':            { code: 'SSL', bg: '#7F8C8D' },
  'Plugin Alliance':  { code: 'PA', bg: '#2C3E50' },
  'sonible':         { code: 'SN', bg: '#6C5CE7' },
  'reFX':           { code: 'RF', bg: '#9B59B6' },
  'Ablaze Audio':   { code: 'ABL', bg: '#E74C3C' },
  'Soundtoys':      { code: 'SO', bg: '#E17055' },
  'Spectrasonics':   { code: 'SP', bg: '#00B894' },
  'Arturia':        { code: 'AR', bg: '#E84393' },
  'Steinberg':      { code: 'SG', bg: '#0984E3' },
  'Eventide':       { code: 'EV', bg: '#2C3E50' },
  'Melda Production': { code: 'MP', bg: '#0984E3' },
  'PACE':           { code: 'PACE', bg: '#666666' },
  'Cockos':         { code: 'RE', bg: '#6C5CE7' },
  'Avid':           { code: 'AV', bg: '#009DC8' },
  'Ableton':        { code: 'AB', bg: '#C8A84B' },
  'Apple':          { code: 'AP', bg: '#555555' },
  'Roland':         { code: 'ROL', bg: '#D63031' },
  'YAMAHA':         { code: 'YAM', bg: '#1E3A5F' },
  'Korg':           { code: 'KR', bg: '#E17055' },
  'Line 6':         { code: 'L6', bg: '#E74C3C' },
  'Neural DSP':      { code: 'ND', bg: '#2D3436' },
  'Positive Grid':  { code: 'PG', bg: '#2D3436' },
  'Overloud':       { code: 'OV', bg: '#D35400' },
  'Apogee':         { code: 'APG', bg: '#2C3E50' },
  'RME':            { code: 'RME', bg: '#2C3E50' },
  'Focusrite':      { code: 'FR', bg: '#E74C3C' },
  'Brainworx':      { code: 'BX', bg: '#2C3E50' },
  'u-he':           { code: 'UH', bg: '#00B894' },
  'Tokyo Dawn Records': { code: 'TDR', bg: '#E84393' },
  'Antares':        { code: 'ANT', bg: '#2C3E50' },
  'Scaler Music':   { code: 'SC', bg: '#E84393' },
  'Xfer Records':    { code: 'XF', bg: '#00B894' },
  'Image-Line':      { code: 'IL', bg: '#17A2B8' },
  'Bitwig':         { code: 'BW', bg: '#C8A84B' },
  'PreSonus':       { code: 'PS', bg: '#E17055' },
  'MOTU':           { code: 'MOTU', bg: '#0984E3' },
  'Reason Studios':  { code: 'RS', bg: '#6C5CE7' },
  'Tracktion':      { code: 'TRK', bg: '#0984E3' },
  'Other':          { code: '?', bg: '#aaaaaa' },
};

export const VendorLogo: FC<LogoProps> = ({ size = 28, vendor }) => {
  const config = VENDOR_LOGOS[vendor ?? 'Other'];
  const code = config?.code ?? '?';
  const bgColor = config?.bg ?? '#aaaaaa';
  const len = code.length;

  const fontSize = len <= 2 ? size * 0.38 : size * 0.28;
  const fontWeight = len <= 3 ? '700' : '600';
  const letterSpacing = len >= 4 ? -0.5 : 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ flexShrink: 0 }}
      aria-label={vendor ?? 'Unknown'}
    >
      <rect width={size} height={size} rx={5} fill={bgColor} />
      <text
        x={size / 2}
        y={size / 2 + fontSize * 0.36}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fontSize={fontSize}
        fontWeight={fontWeight}
        fontFamily="Helvetica Neue, Helvetica, Arial, system-ui, sans-serif"
        letterSpacing={letterSpacing}
      >
        {code}
      </text>
    </svg>
  );
};
