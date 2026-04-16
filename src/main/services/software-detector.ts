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
  bundleIdentifier?: string;
  bundleVersion?: string;
  bundleShortVersion?: string;
  architectures: string[];
  is64Bit: boolean;
  is32Bit: boolean;
  isDuplicate: boolean;
  duplicatePaths?: string[];
  isOrphaned: boolean;
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
  { name: 'Logic Pro', searchKeywords: ['logic pro'], type: 'daw', vendor: 'Apple' },
  { name: 'Ableton Live', searchKeywords: ['ableton live'], type: 'daw', vendor: 'Ableton' },
  { name: 'Pro Tools', searchKeywords: ['pro tools'], type: 'daw', vendor: 'Avid' },
  { name: 'Cubase', searchKeywords: ['cubase'], type: 'daw', vendor: 'Steinberg' },
  { name: 'Reaper', searchKeywords: ['reaper'], type: 'daw', vendor: 'Cockos' },
  { name: 'Studio One', searchKeywords: ['studio one'], type: 'daw', vendor: 'PreSonus' },
  { name: 'Bitwig Studio', searchKeywords: ['bitwig studio'], type: 'daw', vendor: 'Bitwig' },
  { name: 'GarageBand', searchKeywords: ['garageband'], type: 'daw', vendor: 'Apple' },
  { name: 'Reason', searchKeywords: ['reason'], type: 'daw', vendor: 'Reason Studios' },
  { name: 'Digital Performer', searchKeywords: ['digital performer'], type: 'daw', vendor: 'MOTU' },
];

const MAC_AUXILIARY_CONFIGS: SoftwareConfig[] = [
  { name: 'Plugin Alliance', searchKeywords: ['plugin alliance'], type: 'daw', vendor: 'Plugin Alliance' },
  { name: 'AmpliTube', searchKeywords: ['amplitube'], type: 'daw', vendor: 'IK Multimedia' },
  { name: 'TONEX', searchKeywords: ['tonex'], type: 'daw', vendor: 'IK Multimedia' },
  { name: 'SampleTank', searchKeywords: ['sampletank'], type: 'daw', vendor: 'IK Multimedia' },
  { name: 'ARC', searchKeywords: ['arc x', 'arc'], type: 'daw', vendor: 'IK Multimedia' },
  { name: 'Synergy Studio', searchKeywords: ['synergy studio'], type: 'daw', vendor: 'IK Multimedia' },
  { name: 'Guitar Rig', searchKeywords: ['guitar rig'], type: 'daw', vendor: 'Native Instruments' },
  { name: 'Kontakt', searchKeywords: ['kontakt'], type: 'daw', vendor: 'Native Instruments' },
  { name: 'Massive X', searchKeywords: ['massive x'], type: 'daw', vendor: 'Native Instruments' },
  { name: 'Reaktor', searchKeywords: ['reaktor'], type: 'daw', vendor: 'Native Instruments' },
  { name: 'Ozone', searchKeywords: ['ozone'], type: 'daw', vendor: 'iZotope' },
  { name: 'Neutron', searchKeywords: ['neutron'], type: 'daw', vendor: 'iZotope' },
  { name: 'RX', searchKeywords: ['rx'], type: 'daw', vendor: 'iZotope' },
  { name: 'Nectar', searchKeywords: ['nectar'], type: 'daw', vendor: 'iZotope' },
  { name: 'Melodyne', searchKeywords: ['melodyne'], type: 'daw', vendor: 'Celemony' },
  { name: 'Auto-Tune', searchKeywords: ['auto-tune'], type: 'daw', vendor: 'Antares' },
  { name: 'Scaler', searchKeywords: ['scaler'], type: 'daw', vendor: 'Scaler Music' },
  { name: 'Waves Central', searchKeywords: ['waves central'], type: 'daw', vendor: 'Waves' },
  { name: 'FabFilter Pro-Q', searchKeywords: ['pro-q'], type: 'daw', vendor: 'FabFilter' },
  { name: 'Universal Audio', searchKeywords: ['universal audio', 'apollo', 'luna'], type: 'daw', vendor: 'Universal Audio' },
  { name: 'Softube', searchKeywords: ['softube'], type: 'daw', vendor: 'Softube' },
  { name: 'Line 6', searchKeywords: ['line 6', 'helix', 'pod farm'], type: 'daw', vendor: 'Line 6' },
  { name: 'Neural DSP', searchKeywords: ['neural dsp', 'qc'], type: 'daw', vendor: 'Neural DSP' },
  { name: 'Positive Grid', searchKeywords: ['positive grid', 'bias fx'], type: 'daw', vendor: 'Positive Grid' },
  { name: 'Overloud', searchKeywords: ['overloud', 'th-u'], type: 'daw', vendor: 'Overloud' },
];

const MAC_DRIVER_CONFIGS: SoftwareConfig[] = [
  { name: 'iLok License Manager', searchKeywords: ['ilok license manager'], type: 'daw', vendor: 'PACE' },
  { name: 'AXE I/O Interface', searchKeywords: ['axe', 'axe i/o'], type: 'daw', vendor: 'IK Multimedia' },
];

const MAC_PLUGIN_PATHS = {
  vst: ['/Library/Audio/Plug-Ins/VST', '~/Library/Audio/Plug-Ins/VST'],
  vst3: ['/Library/Audio/Plug-Ins/VST3', '~/Library/Audio/Plug-Ins/VST3'],
  au: ['/Library/Audio/Plug-Ins/Components', '~/Library/Audio/Plug-Ins/Components'],
  aax: ['/Library/Application Support/Avid/Audio/Plug-ins', '~/Library/Application Support/Avid/Audio/Plug-ins'],
};

const BUNDLE_ID_VENDOR_MAP: [string, string][] = [
  ['com.plugin-alliance', 'Plugin Alliance'],
  ['com.softube', 'Softube'],
  ['com.ikmultimedia', 'IK Multimedia'],
  ['com.uaudio', 'Universal Audio'],
  ['com.izotope', 'iZotope'],
  ['com.fabfilter', 'FabFilter'],
  ['com.native-instruments', 'Native Instruments'],
  ['com.celemony', 'Celemony'],
  ['com.soundtoys', 'Soundtoys'],
  ['com.arturia', 'Arturia'],
  ['com.avid', 'Avid'],
  ['com.steinberg', 'Steinberg'],
  ['com.ableton', 'Ableton'],
  ['com.cockos', 'Cockos'],
  ['com.presonus', 'PreSonus'],
  ['com.bitwig', 'Bitwig'],
  ['com.reason Studios', 'Reason Studios'],
  ['com.motu', 'MOTU'],
  ['com.spectrasonics', 'Spectrasonics'],
  ['com.valhalla', 'Valhalla DSP'],
  ['com.eventide', 'Eventide'],
  ['com.u-he', 'u-he'],
  ['com.meldaproduction', 'Melda Production'],
  ['com.korg', 'Korg'],
  ['com.roland', 'Roland'],
  ['com.yamaha', 'YAMAHA'],
  ['com.pulsar', 'Pulsar Audio'],
  ['com.apogee', 'Apogee'],
  ['com.rme', 'RME'],
  ['com.focusrite', 'Focusrite'],
  ['com.ssl', 'SSL'],
  ['com.valhalladsp', 'Valhalla DSP'],
  ['com.waves', 'Waves'],
  ['com.brainworx', 'Brainworx'],
  ['com.melda', 'Melda Production'],
  ['com.positivegrid', 'Positive Grid'],
  ['com.overloud', 'Overloud'],
  ['com.antares', 'Antares'],
  ['com.line6', 'Line 6'],
  ['com.neuraldsp', 'Neural DSP'],
  ['com.ablaze', 'Ablaze Audio'],
  ['com.refx', 'reFX'],
  ['com.sonible', 'sonible'],
  ['com.scalermusic', 'Scaler Music'],
  ['audio.pulsar', 'Pulsar Audio'],
];

const AU_MANUFACTURER_CODE_MAP: Record<string, string> = {
  'FabF': 'FabFilter',
  'PTul': 'Pulsar Audio',
  'Ik': 'IK Multimedia',
  'iZot': 'iZotope',
  'SSTg': 'Soundtoys',
  'Artu': 'Arturia',
  'AVID': 'Avid',
  'Stei': 'Steinberg',
  'Abel': 'Ableton',
  'Cock': 'Cockos',
  'Pres': 'PreSonus',
  'Bitw': 'Bitwig',
  'NI': 'Native Instruments',
  'Celm': 'Celemony',
  'Antx': 'Antares',
  'Scal': 'Scaler Music',
  'Vlhv': 'Valhalla DSP',
  'Evnt': 'Eventide',
  'UHe': 'u-he',
  'Melda': 'Melda Production',
  'Korg': 'Korg',
  'Roln': 'Roland',
  'Yamaha': 'YAMAHA',
  'SSL ': 'SSL',
};

const VENDOR_KEYWORDS: [RegExp, string][] = [
  [/amplitube/i, 'IK Multimedia'],
  [/tonex/i, 'IK Multimedia'],
  [/sampletank/i, 'IK Multimedia'],
  [/\b(arc x|arc\s*\d)\b/i, 'IK Multimedia'],
  [/synergy/i, 'IK Multimedia'],
  [/tr5 /i, 'IK Multimedia'],
  [/t-racks/i, 'IK Multimedia'],
  [/t.racks/i, 'IK Multimedia'],
  [/miro/i, 'IK Multimedia'],
  [/pianoverse/i, 'IK Multimedia'],
  [/modo bass/i, 'IK Multimedia'],
  [/modo drum/i, 'IK Multimedia'],
  [/sampletron/i, 'IK Multimedia'],
  [/native instruments/i, 'Native Instruments'],
  [/kontakt/i, 'Native Instruments'],
  [/pulsar/i, 'Pulsar Audio'],
  [/massive/i, 'Native Instruments'],
  [/reaktor/i, 'Native Instruments'],
  [/guitar rig/i, 'Native Instruments'],
  [/izotope/i, 'iZotope'],
  [/ozone/i, 'iZotope'],
  [/neutron/i, 'iZotope'],
  [/^rx\b/i, 'iZotope'],
  [/nectar/i, 'iZotope'],
  [/stutter/i, 'iZotope'],
  [/rx elements/i, 'iZotope'],
  [/vocaldoubler/i, 'iZotope'],
  [/plugin alliance/i, 'Plugin Alliance'],
  [/slate/i, 'Plugin Alliance'],
  [/sonnox/i, 'Plugin Alliance'],
  [/psp Audioware/i, 'Plugin Alliance'],
  [/psp.?iware\b/i, 'Plugin Alliance'],
  [/brainworx/i, 'Plugin Alliance'],
  [/^\s*bx_/i, 'Plugin Alliance'],
  [/black.?box.?analog/i, 'Plugin Alliance'],
  [/elysia/i, 'Plugin Alliance'],
  [/maag/i, 'Plugin Alliance'],
  [/neve/i, 'Plugin Alliance'],
  [/waves api/i, 'Waves'],
  [/\bapi\b/i, 'Plugin Alliance'],
  [/waves/i, 'Waves'],
  [/c6/i, 'Waves'],
  [/fabfilter/i, 'FabFilter'],
  [/pro.q/i, 'FabFilter'],
  [/softube/i, 'Softube'],
  [/fix/i, 'Softube'],
  [/console.?1/i, 'Softube'],
  [/tube.tech/i, 'Softube'],
  [/tube.delay/i, 'Softube'],
  [/saturation knob/i, 'Softube'],
  [/transient shaper/i, 'Softube'],
  [/tsar/i, 'Softube'],
  [/drawmer/i, 'Softube'],
  [/vca compressor/i, 'Softube'],
  [/wasted.?space/i, 'Softube'],
  [/soundtoys/i, 'Soundtoys'],
  [/spectrasonics/i, 'Spectrasonics'],
  [/omnisphere/i, 'Spectrasonics'],
  [/keyscape/i, 'Spectrasonics'],
  [/arturia/i, 'Arturia'],
  [/pigments/i, 'Arturia'],
  [/universal audio/i, 'Universal Audio'],
  [/uad\./i, 'Universal Audio'],
  [/ua_1176/i, 'Universal Audio'],
  [/ua.?1176/i, 'Universal Audio'],
  [/1176/i, 'Universal Audio'],
  [/ua_610/i, 'Universal Audio'],
  [/la.?2a/i, 'Universal Audio'],
  [/pultec/i, 'Universal Audio'],
  [/steinberg/i, 'Steinberg'],
  [/cubase/i, 'Steinberg'],
  [/ableton/i, 'Ableton'],
  [/avid/i, 'Avid'],
  [/pro tools/i, 'Avid'],
  [/cockos/i, 'Cockos'],
  [/reaper/i, 'Cockos'],
  [/presonus/i, 'PreSonus'],
  [/studio one/i, 'PreSonus'],
  [/bitwig/i, 'Bitwig'],
  [/reason/i, 'Reason Studios'],
  [/motu/i, 'MOTU'],
  [/celemony/i, 'Celemony'],
  [/melodyne/i, 'Celemony'],
  [/antares/i, 'Antares'],
  [/auto.tune/i, 'Antares'],
  [/scaler/i, 'Scaler Music'],
  [/line.6/i, 'Line 6'],
  [/helix/i, 'Line 6'],
  [/neural.dsp/i, 'Neural DSP'],
  [/positive.grid/i, 'Positive Grid'],
  [/bias.fx/i, 'Positive Grid'],
  [/overloud/i, 'Overloud'],
  [/apogee/i, 'Apogee'],
  [/rme/i, 'RME'],
  [/focusrite/i, 'Focusrite'],
  [/ssl/i, 'SSL'],
  [/ablaze/i, 'Ablaze Audio'],
  [/nexus/i, 'reFX'],
  [/smartcomp/i, 'sonible'],
  [/smarteq/i, 'sonible'],
  [/tokyo.dawn/i, 'Tokyo Dawn Records'],
  [/valhalla/i, 'Valhalla DSP'],
  [/eventide/i, 'Eventide'],
  [/h.reverb/i, 'Eventide'],
  [/timefactor/i, 'Eventide'],
  [/melda/i, 'Melda Production'],
  [/u.he/i, 'u-he'],
  [/korg/i, 'Korg'],
  [/roland/i, 'Roland'],
  [/yamaha/i, 'YAMAHA'],
];

export function extractVendorFromPluginName(name: string): string {
  for (const [pattern, vendor] of VENDOR_KEYWORDS) {
    if (pattern.test(name)) {
      return vendor;
    }
  }
  return 'Other';
}

function extractVendorFromBundleId(bundleId: string): string | null {
  for (const [prefix, vendor] of BUNDLE_ID_VENDOR_MAP) {
    if (bundleId.startsWith(prefix + '.') || bundleId === prefix) {
      return vendor;
    }
  }
  return null;
}

async function readPlistKey(plistPath: string, key: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(
      `defaults read "${plistPath}" "${key}" 2>/dev/null`
    );
    const result = stdout.trim();
    return result || null;
  } catch {
    return null;
  }
}

type Architecture = 'x86_64' | 'arm64' | 'i386' | 'armv7' | 'universal' | 'unknown';

async function getPluginArchitectures(bundlePath: string): Promise<Architecture[]> {
  const macOSDir = path.join(bundlePath, 'Contents/MacOS');
  if (!fs.existsSync(macOSDir)) return [];
  try {
    const files = fs.readdirSync(macOSDir);
    const binary = files.find(f => !f.startsWith('.'));
    if (!binary) return [];
    const { stdout } = await execAsync(`file -b "${path.join(macOSDir, binary)}" 2>/dev/null`);
    const arches: Architecture[] = [];
    if (/x86_64/.test(stdout)) arches.push('x86_64');
    if (/arm64|aarch64/.test(stdout)) arches.push('arm64');
    if (/i386|i486|i686/.test(stdout)) arches.push('i386');
    if (/armv7/.test(stdout)) arches.push('armv7');
    if (/universal/.test(stdout)) arches.push('universal');
    return arches.length > 0 ? arches : ['unknown'];
  } catch {
    return [];
  }
}

async function getVendorFromAaxBundle(bundlePath: string): Promise<string | null> {
  const plistPath = path.join(bundlePath, 'Contents/Info.plist');
  if (!fs.existsSync(plistPath)) return null;

  const bundleId = await readPlistKey(plistPath, 'CFBundleIdentifier');
  if (!bundleId) return null;

  return extractVendorFromBundleId(bundleId);
}

async function getVendorFromAuComponent(componentPath: string): Promise<string | null> {
  const plistPath = path.join(componentPath, 'Contents/Info.plist');
  if (!fs.existsSync(plistPath)) return null;

  const bundleId = await readPlistKey(plistPath, 'CFBundleIdentifier');
  if (bundleId) {
    const fromBundle = extractVendorFromBundleId(bundleId);
    if (fromBundle) return fromBundle;
  }

  const manufacturer = await readPlistKey(plistPath, 'manufacturer');
  if (manufacturer) {
    const code = manufacturer.trim();
    return AU_MANUFACTURER_CODE_MAP[code] || null;
  }

  return null;
}

const APP_NAMES_TO_EXCLUDE_FROM_PLUGINS = new Set([
  'amplitube', 'tonex', 'sampletank', 'arc', 'synergy',
  'guitar rig', 'kontakt', 'massive', 'reaktor',
  'ozone', 'neutron', 'rx', 'nectar',
  'melodyne', 'auto-tune', 'scaler', 'waves central',
  'pro-q', 'softube', 'line 6', 'helix',
  'neural dsp', 'positive grid', 'bias fx', 'overloud',
  'ilok license manager', 'axe i/o',
  'appleaes3audio',
  'izone12auhook', 'izrx11breathcontrolauhook', 'izrx11connectauhook',
  'izrx11declickauhook', 'izrx11declipauhook', 'izrx11decrackleauhook',
  'izrx11dessauhook', 'izrx11dehumauhook', 'izrx11deplosiveauhook',
  'izrx11dereverbauhook', 'izrx11dialogueisolateauhook',
  'izrx11gtrdnoiseauhook', 'izrx11monitorauhook', 'izrx11mouthdeclickauhook',
  'izrx11musicsrebalancearauhook', 'izrx11repairassistantauhook',
  'izrx11spectraldenoiseauhook', 'izrx11voicedenoiseauhook',
  'izrx11core',
  'scaler 3 audio', 'scaler 3 control', 'scaler 3',
  'scaler detector audio', 'scaler detector control', 'scaler detector',
]);

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

        const isAax = /\.aaxplugin$/i.test(entry.name);
        const isBundle = /\.bundle$/i.test(entry.name);

        if (isDir || isVst3 || isComponent || isDll || isAax || isBundle) {
          const cleanName = entry.name
            .replace(/\.vst3$/i, '')
            .replace(/\.aaxplugin$/i, '')
            .replace(/\.bundle$/i, '')
            .replace(/\.component$/i, '')
            .replace(/\.dll$/i, '')
            .replace(/\s+v\d+$/i, '')
            .trim();

          const lowerName = cleanName.toLowerCase();

          if (APP_NAMES_TO_EXCLUDE_FROM_PLUGINS.has(lowerName)) {
            continue;
          }

          let vendor: string | null = null;

          if ((isVst3 || isAax || isBundle) && isDir) {
            vendor = await getVendorFromAaxBundle(fullPath);
          } else if (isComponent) {
            vendor = await getVendorFromAuComponent(fullPath);
          }

          if (!vendor) {
            vendor = extractVendorFromPluginName(cleanName);
          }

          if (vendor === 'Apple') {
            continue;
          }

          let version = 'installed';
          let bundleIdentifier: string | undefined;
          const plistPath = path.join(fullPath, 'Contents/Info.plist');
          if (fs.existsSync(plistPath)) {
            const ver = await readPlistKey(plistPath, 'CFBundleShortVersionString');
            if (ver) version = ver;
            const bid = await readPlistKey(plistPath, 'CFBundleIdentifier');
            if (bid) bundleIdentifier = bid;
          }

          const archs = await getPluginArchitectures(fullPath);
          const is64Bit = archs.includes('x86_64') || archs.includes('arm64');
          const is32Bit = archs.includes('i386') || archs.includes('armv7');

          plugins.push({
            name: cleanName,
            path: fullPath,
            version,
            bundleIdentifier,
            type: type as 'vst' | 'vst3' | 'au' | 'aax',
            category: 'plugin',
            vendor,
            detectedAt: Date.now(),
            architectures: archs,
            is64Bit,
            is32Bit,
            isDuplicate: false,
            isOrphaned: false,
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
        architectures: [],
        is64Bit: false,
        is32Bit: false,
        isDuplicate: false,
        isOrphaned: false,
      };
    }

    const searchPath = await searchAppInApplications([appName]);
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
        architectures: [],
        is64Bit: false,
        is32Bit: false,
        isDuplicate: false,
        isOrphaned: false,
      };
    }
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
        architectures: [],
        is64Bit: false,
        is32Bit: false,
        isDuplicate: false,
        isOrphaned: false,
      });
    }

    for (const [type, paths] of Object.entries(MAC_PLUGIN_PATHS)) {
      const plugins = await scanPluginsForType(
        type as 'vst' | 'vst3' | 'au' | 'aax',
        paths as string[]
      );
      results.push(...plugins);
    }

    const bundleIdGroups: Record<string, MusicSoftware[]> = {};
    for (const p of results) {
      if (p.bundleIdentifier) {
        (bundleIdGroups[p.bundleIdentifier] ??= []).push(p);
      }
    }
    for (const p of results) {
      const group = bundleIdGroups[p.bundleIdentifier ?? ''];
      if (group && group.length > 1) {
        p.isDuplicate = true;
        p.duplicatePaths = group.map(g => g.path);
      } else {
        p.isDuplicate = false;
        p.duplicatePaths = undefined;
      }
    }

    const dawVendors = new Set(
      results.filter(r => r.type === 'daw').map(r => r.vendor).filter(Boolean)
    );
    for (const p of results) {
      if (p.category === 'plugin' && p.vendor) {
        p.isOrphaned = !dawVendors.has(p.vendor);
      } else {
        p.isOrphaned = false;
      }
    }
  }

  return results;
}
