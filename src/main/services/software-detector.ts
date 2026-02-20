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
  spotlightNames: string[];
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

async function searchAppInApplications(appName: string): Promise<string | null> {
  const searchPaths = [
    '/Applications',
    '/System/Applications',
    expandPath('~/Applications'),
  ];

  for (const searchPath of searchPaths) {
    if (!fs.existsSync(searchPath)) continue;
    try {
      const files = fs.readdirSync(searchPath);
      const lowerName = appName.toLowerCase().replace('.app', '');
      for (const file of files) {
        if (file.toLowerCase().includes(lowerName)) {
          if (file.endsWith('.app')) {
            return path.join(searchPath, file);
          }
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

const MAC_DAW_CONFIGS: SoftwareConfig[] = [
  { name: 'Logic Pro', spotlightNames: ['Logic Pro.app'], type: 'daw', vendor: 'Apple' },
  { name: 'Ableton Live', spotlightNames: ['Ableton Live.app', 'Ableton Live 11.app', 'Ableton Live 12.app'], type: 'daw', vendor: 'Ableton' },
  { name: 'Pro Tools', spotlightNames: ['Pro Tools.app', 'Pro Tools 2024.app'], type: 'daw', vendor: 'Avid' },
  { name: 'FL Studio', spotlightNames: ['FL Studio.app', 'FL64.app'], type: 'daw', vendor: 'Image-Line' },
  { name: 'Cubase', spotlightNames: ['Cubase 13.app', 'Cubase 12.app', 'Cubase 11.app', 'Cubase.app'], type: 'daw', vendor: 'Steinberg' },
  { name: 'Reaper', spotlightNames: ['REAPER.app'], type: 'daw', vendor: 'Cockos' },
  { name: 'Studio One', spotlightNames: ['Studio One 6.app', 'Studio One 5.app', 'Studio One.app'], type: 'daw', vendor: 'PreSonus' },
  { name: 'Bitwig Studio', spotlightNames: ['Bitwig Studio 5.app', 'Bitwig Studio 4.app', 'Bitwig Studio.app'], type: 'daw', vendor: 'Bitwig' },
  { name: 'GarageBand', spotlightNames: ['GarageBand.app'], type: 'daw', vendor: 'Apple' },
  { name: 'Reason', spotlightNames: ['Reason 12.app', 'Reason 13.app', 'Reason.app'], type: 'daw', vendor: 'Reason Studios' },
  { name: 'Digital Performer', spotlightNames: ['Digital Performer.app'], type: 'daw', vendor: 'MOTU' },
  { name: 'Waveform', spotlightNames: ['Waveform.app', 'Waveform 12.app'], type: 'daw', vendor: 'Tracktion' },
  { name: 'Dorico', spotlightNames: ['Dorico 5.app', 'Dorico 4.app', 'Dorico.app'], type: 'daw', vendor: 'Steinberg' },
  { name: 'Audacity', spotlightNames: ['Audacity.app'], type: 'daw', vendor: 'Audacity' },
];

const MAC_AUXILIARY_CONFIGS: SoftwareConfig[] = [
  { name: 'AmpliTube 5', spotlightNames: ['AmpliTube 5.app'], type: 'daw', vendor: 'IK Multimedia' },
  { name: 'AmpliTube', spotlightNames: ['AmpliTube 4.app', 'AmpliTube 3.app'], type: 'daw', vendor: 'IK Multimedia' },
  { name: 'TONEX', spotlightNames: ['TONEX.app', 'TONEX MAX.app'], type: 'daw', vendor: 'IK Multimedia' },
  { name: 'SampleTank', spotlightNames: ['SampleTank 4.app', 'SampleTank 3.app', 'SampleTank.app'], type: 'daw', vendor: 'IK Multimedia' },
  { name: 'Guitar Rig', spotlightNames: ['Guitar Rig 7.app', 'Guitar Rig 6.app', 'Guitar Rig.app'], type: 'daw', vendor: 'Native Instruments' },
  { name: 'Ozone', spotlightNames: ['Ozone 12.app', 'Ozone 11.app', 'Ozone 10.app', 'Ozone.app'], type: 'daw', vendor: 'iZotope' },
  { name: 'Neutron', spotlightNames: ['Neutron 5.app', 'Neutron 4.app', 'Neutron 3.app', 'Neutron.app'], type: 'daw', vendor: 'iZotope' },
  { name: 'RX', spotlightNames: ['RX 11.app', 'RX 10.app', 'RX 9.app', 'RX.app'], type: 'daw', vendor: 'iZotope' },
  { name: 'Nectar', spotlightNames: ['Nectar 4.app', 'Nectar 3.app', 'Nectar.app'], type: 'daw', vendor: 'iZotope' },
  { name: 'Melodyne', spotlightNames: ['Melodyne 5.app', 'Melodyne 4.app', 'Melodyne.app'], type: 'daw', vendor: 'Celemony' },
  { name: 'Auto-Tune', spotlightNames: ['Auto-Tune.app', 'Auto-Tune Pro.app'], type: 'daw', vendor: 'Antares' },
  { name: 'Scaler', spotlightNames: ['Scaler 3.app', 'Scaler 2.app', 'Scaler.app'], type: 'daw', vendor: 'Scaler Music' },
  { name: 'Kontakt', spotlightNames: ['Kontakt 7.app', 'Kontakt 6.app', 'Kontakt.app'], type: 'daw', vendor: 'Native Instruments' },
  { name: 'Reaktor', spotlightNames: ['Reaktor 7.app', 'Reaktor 6.app', 'Reaktor.app'], type: 'daw', vendor: 'Native Instruments' },
  { name: 'Massive X', spotlightNames: ['Massive X.app'], type: 'daw', vendor: 'Native Instruments' },
  { name: 'Final Mix', spotlightNames: ['Final Mix.app'], type: 'daw', vendor: 'Waves' },
  { name: 'Waves Central', spotlightNames: ['Waves Central.app'], type: 'daw', vendor: 'Waves' },
  { name: 'FabFilter Pro-Q', spotlightNames: ['Pro-Q 3.app'], type: 'daw', vendor: 'FabFilter' },
  { name: 'Universal Audio', spotlightNames: ['Universal Audio Apollo.app', 'UA LUNA.app'], type: 'daw', vendor: 'Universal Audio' },
  { name: 'ARC', spotlightNames: ['ARC.app', 'ARC System 3.app'], type: 'daw', vendor: 'IK Multimedia' },
  { name: 'Synergy Studio', spotlightNames: ['Synergy Studio.app'], type: 'daw', vendor: 'IK Multimedia' },
  { name: 'Minitool', spotlightNames: ['Minitool.app'], type: 'daw', vendor: 'IK Multimedia' },
  { name: 'L6 Tone', spotlightNames: ['Tone.app', 'L6 Tone'], type: 'daw', vendor: 'Line 6' },
  { name: 'Helix', spotlightNames: ['Helix.app', 'Helix Native.app'], type: 'daw', vendor: 'Line 6' },
  { name: 'Scuffham', spotlightNames: ['S-Gear.app'], type: 'daw', vendor: 'Scuffham' },
  { name: 'Neural DSP', spotlightNames: ['Neural DSP.app', 'QC App.app'], type: 'daw', vendor: 'Neural DSP' },
  { name: 'Positive Grid', spotlightNames: ['Positive Grid App.app', 'Bias FX.app'], type: 'daw', vendor: 'Positive Grid' },
  { name: 'MThome', spotlightNames: ['MThome Pro.app'], type: 'daw', vendor: 'Mercurial' },
  { name: 'Hotone', spotlightNames: ['Hotone Ampero.app'], type: 'daw', vendor: 'Hotone' },
  { name: 'Overloud', spotlightNames: ['Overloud TH-U.app', 'TH-U Premium.app'], type: 'daw', vendor: 'Overloud' },
  { name: 'Acoustic Reality', spotlightNames: ['AR Machine Head.app'], type: 'daw', vendor: 'Acoustic Reality' },
  { name: 'Softube', spotlightNames: ['Softube Central.app'], type: 'daw', vendor: 'Softube' },
  { name: 'Plugin Doctor', spotlightNames: ['Plugin Doctor.app'], type: 'daw', vendor: 'Sugar Bytes' },
  { name: 'Trovert', spotlightNames: ['Trovert.app'], type: 'daw', vendor: 'Softube' },
  { name: 'Eleven', spotlightNames: ['Eleven Lite.app', 'Eleven MK II.app'], type: 'daw', vendor: 'Avid' },
  { name: 'Vacuum Pro', spotlightNames: ['Vacuum Pro.app'], type: 'daw', vendor: 'Waves' },
  { name: 'Voices', spotlightNames: ['Voices.app'], type: 'daw', vendor: 'Waves' },
  { name: 'SoundGrid', spotlightNames: ['SoundGrid Studio.app'], type: 'daw', vendor: 'Waves' },
];

const MAC_DRIVER_CONFIGS: SoftwareConfig[] = [
  { name: 'iLok License Manager', spotlightNames: ['iLok License Manager.app'], type: 'daw', vendor: 'PACE' },
  { name: 'AXE I/O Interface', spotlightNames: ['AXE I/O Interface.app', 'Axe I/O ControlPanel.app'], type: 'daw', vendor: 'IK Multimedia' },
  { name: 'AXE I/O Next', spotlightNames: ['AXE I/O Next ControlPanel.app'], type: 'daw', vendor: 'IK Multimedia' },
  { name: 'iConnectivity', spotlightNames: ['iConnectivity Config.app'], type: 'daw', vendor: 'iConnectivity' },
  { name: 'Universal Audio Driver', spotlightNames: ['UAD Driver.app'], type: 'daw', vendor: 'Universal Audio' },
  { name: 'Apogee', spotlightNames: ['Apogee Control 2.app', 'Apogee Maestro.app'], type: 'daw', vendor: 'Apogee' },
  { name: 'RME', spotlightNames: ['RME Fireface Settings.app', 'TotalMix FX.app'], type: 'daw', vendor: 'RME' },
  { name: 'Focusrite', spotlightNames: ['Focusrite Control.app', 'Focusrite Scarlett 2i2.app'], type: 'daw', vendor: 'Focusrite' },
  { name: 'PreSonus', spotlightNames: ['PreSonus UC Surface.app', 'Universal Control.app'], type: 'daw', vendor: 'PreSonus' },
  { name: 'Steinberg', spotlightNames: ['eLicenser Control.app'], type: 'daw', vendor: 'Steinberg' },
  { name: 'Yamaha', spotlightNames: ['Yamaha Steinberg FW Driver.app'], type: 'daw', vendor: 'Yamaha' },
  { name: 'Roland', spotlightNames: ['Roland Driver Installer.app'], type: 'daw', vendor: 'Roland' },
];

const MAC_PLUGIN_PATHS = {
  vst: ['/Library/Audio/Plug-Ins/VST', '~/Library/Audio/Plug-Ins/VST'],
  vst3: ['/Library/Audio/Plug-Ins/VST3', '~/Library/Audio/Plug-Ins/VST3'],
  au: ['/Library/Audio/Plug-Ins/Components', '~/Library/Audio/Plug-Ins/Components'],
  aax: ['/Library/Application Support/Avid/Audio/Plug-ins', '~/Library/Application Support/Avid/Audio/Plug-ins'],
};

const VENDOR_KEYWORDS: [string, string][] = [
  ['IK Multimedia', 'IK Multimedia'],
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
  ['Absynth', 'Native Instruments'],
  ['FM8', 'Native Instruments'],
  ['Monark', 'Native Instruments'],
  ['iZotope', 'iZotope'],
  ['Ozone', 'iZotope'],
  ['Neutron', 'iZotope'],
  ['RX', 'iZotope'],
  ['Nectar', 'iZotope'],
  ['Vocalsynth', 'iZotope'],
  ['Stutter Edit', 'iZotope'],
  ['Waves', 'Waves'],
  ['FabFilter', 'FabFilter'],
  ['Pro-Q', 'FabFilter'],
  ['Pro-C', 'FabFilter'],
  ['Pro-L', 'FabFilter'],
  ['Timeless', 'FabFilter'],
  ['Soundtoys', 'Soundtoys'],
  ['Crystallizer', 'Soundtoys'],
  ['EchoThon', 'Soundtoys'],
  ['Decapitator', 'Soundtoys'],
  ['Spectrasonics', 'Spectrasonics'],
  ['Omnisphere', 'Spectrasonics'],
  ['Keyscape', 'Spectrasonics'],
  ['Trilian', 'Spectrasonics'],
  ['Stylus RMX', 'Spectrasonics'],
  ['Arturia', 'Arturia'],
  ['Pigments', 'Arturia'],
  ['V Collection', 'Arturia'],
  ['Universal Audio', 'Universal Audio'],
  ['UAD', 'Universal Audio'],
  ['Apollo', 'Universal Audio'],
  ['Steinberg', 'Steinberg'],
  ['Cubase', 'Steinberg'],
  ['Dorico', 'Steinberg'],
  ['Ableton', 'Ableton'],
  ['Live', 'Ableton'],
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
  ['Reason', 'Reason Studios'],
  ['MOTU', 'MOTU'],
  ['Digital Performer', 'MOTU'],
  ['Tracktion', 'Tracktion'],
  ['Waveform', 'Tracktion'],
  ['Valhalla DSP', 'Valhalla DSP'],
  ['Valhalla', 'Valhalla DSP'],
  ['Eventide', 'Eventide'],
  ['H-Reverb', 'Eventide'],
  ['Antares', 'Antares'],
  ['Auto-Tune', 'Antares'],
  ['Celemony', 'Celemony'],
  ['Melodyne', 'Celemony'],
  ['Scaler Music', 'Scaler Music'],
  ['Scaler', 'Scaler Music'],
  ['Xfer Records', 'Xfer Records'],
  ['Serum', 'Xfer Records'],
  ['Vital', 'Vital Audio'],
  ['Softube', 'Softube'],
  ['Marshall', 'Softube'],
  ['SSL', 'SSL'],
  ['Brainworx', 'Brainworx'],
  ['Plugin Alliance', 'Plugin Alliance'],
  ['Tokyo Dawn', 'Tokyo Dawn Records'],
  ['TDR', 'Tokyo Dawn Records'],
  ['Melda', 'Melda Production'],
  ['Line 6', 'Line 6'],
  ['Helix', 'Line 6'],
  ['Pod Farm', 'Line 6'],
  ['Neural DSP', 'Neural DSP'],
  ['Positive Grid', 'Positive Grid'],
  ['Bias FX', 'Positive Grid'],
  ['Overloud', 'Overloud'],
  ['TH-U', 'Overloud'],
  ['Acoustic Reality', 'Acoustic Reality'],
  ['Scuffham', 'Scuffham'],
  ['S-Gear', 'Scuffham'],
  ['Hotone', 'Hotone'],
  ['Apogee', 'Apogee'],
  ['RME', 'RME'],
  ['Focusrite', 'Focusrite'],
  ['Yamaha', 'Yamaha'],
  ['Roland', 'Roland'],
  ['Korg', 'Korg'],
  ['Arturia', 'Arturia'],
  ['u-he', 'u-he'],
  ['Diva', 'u-he'],
  ['Zebra', 'u-he'],
  ['Cherry Audio', 'Cherry Audio'],
  ['Syntronik', 'IK Multimedia'],
  ['UVI', 'UVI'],
  ['Falcon', 'UVI'],
  ['Viola', 'Viola'],
  ['Maag', 'Maag Audio'],
  ['Klanghelm', 'Klanghelm'],
  ['Flux', 'Flux'],
  ['Slate Digital', 'Slate Digital'],
  ['Air', 'Air'],
  ['Caelum Audio', 'Caelum Audio'],
  ['D16 Group', 'D16 Group'],
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
  for (const appName of config.spotlightNames) {
    let appPath = await spotlightSearch(appName);
    
    if (!appPath) {
      appPath = await searchAppInApplications(appName.replace('.app', ''));
    }

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
