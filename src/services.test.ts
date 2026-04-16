import { extractVendorFromPluginName } from './main/services/software-detector';

describe('Vendor Extraction', () => {
  const testCases = [
    { name: 'AmpliTube 5', expected: 'IK Multimedia' },
    { name: 'AmpliTube', expected: 'IK Multimedia' },
    { name: 'TONEX', expected: 'IK Multimedia' },
    { name: 'SampleTank', expected: 'IK Multimedia' },
    { name: 'ARC X', expected: 'IK Multimedia' },
    { name: 'ARC 3', expected: 'IK Multimedia' },
    { name: 'T-RackS 5', expected: 'IK Multimedia' },
    { name: 'Pianoverse', expected: 'IK Multimedia' },
    { name: 'MODO DRUM', expected: 'IK Multimedia' },
    { name: 'SampleTron 2', expected: 'IK Multimedia' },

    { name: 'Ozone', expected: 'iZotope' },
    { name: 'Neutron', expected: 'iZotope' },
    { name: 'RX 11', expected: 'iZotope' },
    { name: 'Nectar', expected: 'iZotope' },
    { name: 'Stutter Edit', expected: 'iZotope' },
    { name: 'VocalDoubler', expected: 'iZotope' },

    { name: 'SSL Native Channel Strip 2', expected: 'SSL' },
    { name: 'SSL 4K B', expected: 'SSL' },
    { name: 'SSL', expected: 'SSL' },

    { name: 'Maag EQ2', expected: 'Plugin Alliance' },
    { name: 'Maag EQ4', expected: 'Plugin Alliance' },
    { name: 'Neve 1073', expected: 'Plugin Alliance' },
    { name: 'API 2500', expected: 'Plugin Alliance' },

    { name: 'Tube-Tech CL 1B', expected: 'Softube' },
    { name: 'TSAR-1R Reverb', expected: 'Softube' },
    { name: 'Fix Phaser', expected: 'Softube' },
    { name: 'Saturation Knob', expected: 'Softube' },
    { name: 'Drawmer S73', expected: 'Softube' },
    { name: 'VCA Compressor', expected: 'Softube' },
    { name: 'Wasted Space', expected: 'Softube' },
    { name: 'Transient Shaper', expected: 'Softube' },

    { name: 'FabFilter Pro-Q 3', expected: 'FabFilter' },
    { name: 'Pro-Q 3', expected: 'FabFilter' },

    { name: 'Kontakt', expected: 'Native Instruments' },
    { name: 'Massive', expected: 'Native Instruments' },
    { name: 'Reaktor', expected: 'Native Instruments' },
    { name: 'Guitar Rig', expected: 'Native Instruments' },

    { name: 'Melodyne', expected: 'Celemony' },

    { name: 'Auto-Tune', expected: 'Antares' },

    { name: 'Omnisphere', expected: 'Spectrasonics' },
    { name: 'Keyscape', expected: 'Spectrasonics' },

    { name: 'Pigments', expected: 'Arturia' },
    { name: 'Arturia', expected: 'Arturia' },

    { name: 'Waves SSL', expected: 'Waves' },
    { name: 'Waves API', expected: 'Waves' },
    { name: 'C6 Multiband Compressor', expected: 'Waves' },

    { name: 'ValhallaRoom', expected: 'Valhalla DSP' },
    { name: 'ValhallaVintageVerb', expected: 'Valhalla DSP' },

    { name: 'H-Reverb', expected: 'Eventide' },
    { name: 'TimeFactor', expected: 'Eventide' },

    { name: 'bx_console N', expected: 'Plugin Alliance' },
    { name: 'bx_monitor', expected: 'Plugin Alliance' },
    { name: 'Black Box Analog Design HG-2MS', expected: 'Plugin Alliance' },
    { name: 'elysia alpha compressor V2', expected: 'Plugin Alliance' },
    { name: 'Slate Digital VTM', expected: 'Plugin Alliance' },

    { name: 'Pulsar Mu', expected: 'Pulsar Audio' },
    { name: 'Pulsar Massive', expected: 'Pulsar Audio' },

    { name: 'UA 1176', expected: 'Universal Audio' },
    { name: 'LA-2A', expected: 'Universal Audio' },
    { name: 'Pultec EQP-1A', expected: 'Universal Audio' },

    { name: 'Some Unknown Plugin', expected: 'Other' },
    { name: 'Random Plugin Name', expected: 'Other' },
  ];

  testCases.forEach(({ name, expected }) => {
    it(`should extract vendor "${expected}" from "${name}"`, () => {
      const result = extractVendorFromPluginName(name);
      expect(result).toBe(expected);
    });
  });
});
