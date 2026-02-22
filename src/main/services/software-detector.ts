import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface MusicSoftware {
  name: string;
  path: string;
  version: string;
  type: 'daw' | 'vst' | 'vst3' | 'au' | 'aax' | 'auxiliary' | 'driver' | 'ilok' | 'other';
  category: 'daw' | 'plugin' | 'auxiliary' | 'driver' | 'ilok';
  vendor?: string;
  detectedAt: number;
}

interface SoftwareConfig {
  name: string;
  searchKeywords: string[];
  type: 'daw';
  vendor?: string;
}

function expandPath(p: string): string {
  if (p.startsWith('~')) {
    return path.join(process.env.HOME || '', p.slice(1));
  }
  return p;
}

async function getAppVersionMac(appPath: string): Promise<string> {
  try {
    const infoPlistPath = path.join(appPath, 'Contents/Info.plist');
    if (fs.existsSync(infoPlistPath)) {
      const { stdout } = await execAsync(
        `defaults read "${appPath}/Contents/Info.plist" CFBundleShortVersionString 2>/dev/null || echo "unknown"`
      );
      return stdout.trim() || 'unknown';
    }
  } catch {
    // ignore
  }
  return 'unknown';
}

async function spotlightSearch(appName: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(
      `mdfind "kMDItemFSName == '${appName}'" 2>/dev/null | head -1`
    );
    const result = stdout.trim();
    return result || null;
  } catch {
    return null;
  }
}

async function searchAppInApplications(keywords: string[]): Promise<string | null> {
  const searchPaths = [
    '/Applications',
    '/System/Applications',
    expandPath('~/Applications'),
  ];

  for (const searchPath of searchPaths) {
    if (!fs.existsSync(searchPath)) continue;
    try {
      const files = fs.readdirSync(searchPath);
      for (const file of files) {
        if (!file.endsWith('.app')) continue;
        
        const fileLower = file.toLowerCase();
        const matches = keywords.every(keyword => 
          keyword.length <= 2 || fileLower.includes(keyword.toLowerCase())
        );
        
        if (matches) {
          return path.join(searchPath, file);
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

const MAC_DAW_CONFIGS: SoftwareConfig[] = [
  { name: 'Logic Pro', searchKeywords: ['logic', 'pro'], type: 'daw', vendor: 'Apple' },
  { name: 'Ableton Live', searchKeywords: ['ableton', 'live'], type: 'daw', vendor: 'Ableton' },
  { name: 'Pro Tools', searchKeywords: ['pro', 'tools'], type: 'daw', vendor: 'Avid' },
  { name: 'FL Studio', searchKeywords: ['fl', 'studio'], type: 'daw', vendor: 'Image-Line' },
  { name: 'Cubase', searchKeywords: ['cubase'], type: 'daw', vendor: 'Steinberg' },
  { name: 'Reaper', searchKeywords: ['reaper'], type: 'daw', vendor: 'Cockos' },
  { name: 'Studio One', searchKeywords: ['studio', 'one'], type: 'daw', vendor: 'PreSonus' },
  { name: 'Bitwig Studio', searchKeywords: ['bitwig', 'studio'], type: 'daw', vendor: 'Bitwig' },
  { name: 'GarageBand', searchKeywords: ['garageband'], type: 'daw', vendor: 'Apple' },
  { name: 'Reason', searchKeywords: ['reason'], type: 'daw', vendor: 'Reason Studios' },
  { name: 'Digital Performer', searchKeywords: ['digital', 'performer'], type: 'daw', vendor: 'MOTU' },
  { name: 'Waveform', searchKeywords: ['waveform'], type: 'daw', vendor: 'Tracktion' },
  { name: 'Dorico', searchKeywords: ['dorico'], type: 'daw', vendor: 'Steinberg' },
  { name: 'Audacity', searchKeywords: ['audacity'], type: 'daw', vendor: 'Audacity' },
];

const MAC_AUXILIARY_CONFIGS: SoftwareConfig[] = [
  { name: 'AmpliTube', searchKeywords: ['amplitube'], type: 'daw', vendor: 'IK Multimedia' },
  { name: 'TONEX', searchKeywords: ['tonex'], type: 'daw', vendor: 'IK Multimedia' },
  { name: 'SampleTank', searchKeywords: ['sampletank'], type: 'daw', vendor: 'IK Multimedia' },
  { name: 'ARC', searchKeywords: ['arc', 'system'], type: 'daw', vendor: 'IK Multimedia' },
  { name: 'Synergy Studio', searchKeywords: ['synergy'], type: 'daw', vendor: 'IK Multimedia' },
  { name: 'Minitool', searchKeywords: ['minitool'], type: 'daw', vendor: 'IK Multimedia' },
  { name: 'Guitar Rig', searchKeywords: ['guitar', 'rig'], type: 'daw', vendor: 'Native Instruments' },
  { name: 'Kontakt', searchKeywords: ['kontakt'], type: 'daw', vendor: 'Native Instruments' },
  { name: 'Massive X', searchKeywords: ['massive'], type: 'daw', vendor: 'Native Instruments' },
  { name: 'Reaktor', searchKeywords: ['reaktor'], type: 'daw', vendor: 'Native Instruments' },
  { name: 'Ozone', searchKeywords: ['ozone'], type: 'daw', vendor: 'iZotope' },
  { name: 'Neutron', searchKeywords: ['neutron'], type: 'daw', vendor: 'iZotope' },
  { name: 'RX', searchKeywords: ['rx'], type: 'daw', vendor: 'iZotope' },
  { name: 'Nectar', searchKeywords: ['nectar'], type: 'daw', vendor: 'iZotope' },
  { name: 'Melodyne', searchKeywords: ['melodyne'], type: 'daw', vendor: 'Celemony' },
  { name: 'Auto-Tune', searchKeywords: ['auto', 'tune'], type: 'daw', vendor: 'Antares' },
  { name: 'Scaler', searchKeywords: ['scaler'], type: 'daw', vendor: 'Scaler Music' },
  { name: 'Waves Central', searchKeywords: ['waves', 'central'], type: 'daw', vendor: 'Waves' },
  { name: 'FabFilter Pro-Q', searchKeywords: ['pro-q'], type: 'daw', vendor: 'FabFilter' },
  { name: 'Universal Audio', searchKeywords: ['universal', 'audio', 'apollo', 'luna'], type: 'daw', vendor: 'Universal Audio' },
  { name: 'Softube', searchKeywords: ['softube'], type: 'daw', vendor: 'Softube' },
  { name: 'Line 6', searchKeywords: ['line', 'helix', 'pod', 'farm'], type: 'daw', vendor: 'Line 6' },
  { name: 'Neural DSP', searchKeywords: ['neural', 'dsp', 'qc'], type: 'daw', vendor: 'Neural DSP' },
  { name: 'Positive Grid', searchKeywords: ['positive', 'grid', 'bias'], type: 'daw', vendor: 'Positive Grid' },
  { name: 'Overloud', searchKeywords: ['overloud', 'th-u'], type: 'daw', vendor: 'Overloud' },
  { name: 'Apogee', searchKeywords: ['apogee'], type: 'daw', vendor: 'Apogee' },
  { name: 'RME', searchKeywords: ['rme', 'totalmix'], type: 'daw', vendor: 'RME' },
  { name: 'Focusrite', searchKeywords: ['focusrite'], type: 'daw', vendor: 'Focusrite' },
];

const MAC_DRIVER_CONFIGS: SoftwareConfig[] = [
  { name: 'iLok License Manager', searchKeywords: ['ilok', 'license', 'manager'], type: 'daw', vendor: 'PACE' },
  { name: 'AXE I/O', searchKeywords: ['axe', 'io'], type: 'daw', vendor: 'IK Multimedia' },
  { name: 'Steinberg', searchKeywords: ['elicenser'], type: 'daw', vendor: 'Steinberg' },
];

const MAC_PLUGIN_PATHS = {
  vst: ['/Library/Audio/Plug-Ins/VST', '~/Library/Audio/Plug-Ins/VST'],
  vst3: ['/Library/Audio/Plug-Ins/VST3', '~/Library/Audio/Plug-Ins/VST3'],
  au: ['/Library/Audio/Plug-Ins/Components', '~/Library/Audio/Plug-Ins/Components'],
  aax: ['/Library/Application Support/Avid/Audio/Plug-ins', '~/Library/Application Support/Avid/Audio/Plug-ins'],
};

const VENDOR_KEYWORDS: [string, string][] = [
  ['IK Multimedia', 'IK Multimedia'],
  ['AmpliTube', 'IK Multimedia'],
  ['SampleTank', 'IK Multimedia'],
  ['TONEX', 'IK Multimedia'],
  ['ARC', 'IK Multimedia'],
  ['Synergy', 'IK Multimedia'],
  ['Minitool', 'IK Multimedia'],
  ['Native Instruments', 'Native Instruments'],
  ['Kontakt', 'Native Instruments'],
  ['Massive', 'Native Instruments'],
  ['Reaktor', 'Native Instruments'],
  ['Guitar Rig', 'Native Instruments'],
  ['iZotope', 'iZotope'],
  ['Ozone', 'iZotope'],
  ['Neutron', 'iZotope'],
  ['RX', 'iZotope'],
  ['Nectar', 'iZotope'],
  ['Waves', 'Waves'],
  ['FabFilter', 'FabFilter'],
  ['Softube', 'Softube'],
  ['Soundtoys', 'Soundtoys'],
  ['Spectrasonics', 'Spectrasonics'],
  ['Arturia', 'Arturia'],
  ['Universal Audio', 'Universal Audio'],
  ['UAD', 'Universal Audio'],
  ['Steinberg', 'Steinberg'],
  ['Cubase', 'Steinberg'],
  ['Ableton', 'Ableton'],
  ['Avid', 'Avid'],
  ['Pro Tools', 'Avid'],
  ['Image-Line', 'Image-Line'],
  ['FL Studio', 'Image-Line'],
  ['Cockos', 'Cockos'],
  ['Reaper', 'Cockos'],
  ['PreSonus', 'PreSonus'],
  ['Studio One', 'PreSonus'],
  ['Bitwig', 'Bitwig'],
  ['Reason Studios', 'Reason Studios'],
  ['MOTU', 'MOTU'],
  ['Celemony', 'Celemony'],
  ['Melodyne', 'Celemony'],
  ['Antares', 'Antares'],
  ['Auto-Tune', 'Antares'],
  ['Scaler Music', 'Scaler Music'],
  ['Scaler', 'Scaler Music'],
  ['Line 6', 'Line 6'],
  ['Helix', 'Line 6'],
  ['Neural DSP', 'Neural DSP'],
  ['Positive Grid', 'Positive Grid'],
  ['Overloud', 'Overloud'],
  ['Apogee', 'Apogee'],
  ['RME', 'RME'],
  ['Focusrite', 'Focusrite'],
  ['Roland', 'Roland'],
  ['Korg', 'Korg'],
  ['Arturia', 'Arturia'],
  ['u-he', 'u-he'],
  ['UVI', 'UVI'],
  ['Valhalla DSP', 'Valhalla DSP'],
  ['Eventide', 'Eventide'],
  ['SSL', 'SSL'],
  ['Brainworx', 'Brainworx'],
  ['Plugin Alliance', 'Plugin Alliance'],
  ['Tokyo Dawn', 'Tokyo Dawn Records'],
  ['Melda', 'Melda Production'],
];

function extractVendorFromPluginName(name: string): string {
  const lowerName = name.toLowerCase();
  for (const [keyword, vendor] of VENDOR_KEYWORDS) {
    if (lowerName.includes(keyword.toLowerCase())) {
      return vendor;
    }
  }
  return 'Other';
}

async function scanPluginsForType(
  type: 'vst' | 'vst3' | 'au' | 'aax',
  pluginPaths: string[]
): Promise<MusicSoftware[]> {
  const plugins: MusicSoftware[] = [];

  for (const pluginPath of pluginPaths) {
    const expandedPath = expandPath(pluginPath);
    if (!fs.existsSync(expandedPath)) continue;

    try {
      const entries = fs.readdirSync(expandedPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(expandedPath, entry.name);
        const isDir = entry.isDirectory();
        const isVst3 = entry.name.endsWith('.vst3');
        const isComponent = entry.name.endsWith('.component');
        const isDll = entry.name.endsWith('.dll');

        if (isDir || isVst3 || isComponent || isDll) {
          const cleanName = entry.name
            .replace(/\.vst3$/i, '')
            .replace(/\.component$/i, '')
            .replace(/\.dll$/i, '');

          plugins.push({
            name: cleanName,
            path: fullPath,
            version: 'installed',
            type: type as 'vst' | 'vst3' | 'au' | 'aax',
            category: 'plugin',
            vendor: extractVendorFromPluginName(cleanName),
            detectedAt: Date.now(),
          });
        }
      }
    } catch {
      continue;
    }
  }

  return plugins;
}

async function detectApp(config: SoftwareConfig, category: MusicSoftware['category']): Promise<MusicSoftware | null> {
  for (const appName of config.searchKeywords) {
    const appPath = await spotlightSearch(`${appName}.app`);
    if (appPath && fs.existsSync(appPath)) {
      const version = await getAppVersionMac(appPath);
      return {
        name: config.name,
        path: appPath,
        version,
        type: 'auxiliary',
        category,
        vendor: config.vendor,
        detectedAt: Date.now(),
      };
    }
  }

  const searchPath = await searchAppInApplications(config.searchKeywords);
  if (searchPath && fs.existsSync(searchPath)) {
    const version = await getAppVersionMac(searchPath);
    return {
      name: config.name,
      path: searchPath,
      version,
      type: 'auxiliary',
      category,
      vendor: config.vendor,
      detectedAt: Date.now(),
    };
  }
  
  return null;
}

export async function scanMusicSoftware(): Promise<MusicSoftware[]> {
  const results: MusicSoftware[] = [];

  if (process.platform === 'darwin') {
    for (const config of MAC_DAW_CONFIGS) {
      const app = await detectApp(config, 'daw');
      if (app) results.push(app);
    }

    for (const config of MAC_AUXILIARY_CONFIGS) {
      const app = await detectApp(config, 'auxiliary');
      if (app) results.push(app);
    }

    for (const config of MAC_DRIVER_CONFIGS) {
      const app = await detectApp(config, 'driver');
      if (app) results.push(app);
    }

    const ilokPath = await spotlightSearch('iLok License Manager.app');
    if (ilokPath) {
      results.push({
        name: 'iLok License Manager',
        path: ilokPath,
        version: 'installed',
        type: 'ilok',
        category: 'ilok',
        vendor: 'PACE',
        detectedAt: Date.now(),
      });
    }

    for (const [type, paths] of Object.entries(MAC_PLUGIN_PATHS)) {
      const plugins = await scanPluginsForType(
        type as 'vst' | 'vst3' | 'au' | 'aax',
        paths as string[]
      );
      results.push(...plugins);
    }
  }

  return results;
}
