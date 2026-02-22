import { extractVendorFromPluginName } from './main/services/software-detector';

describe('Vendor Extraction', () => {
  const testCases = [
    { name: 'AmpliTube 5', expected: 'IK Multimedia' },
    { name: 'AmpliTube', expected: 'IK Multimedia' },
    { name: 'TONEX', expected: 'IK Multimedia' },
    { name: 'SampleTank', expected: 'IK Multimedia' },
    { name: 'ARC X', expected: 'IK Multimedia' },
    { name: 'ARC', expected: 'IK Multimedia' },
    
    { name: 'Ozone', expected: 'iZotope' },
    { name: 'Neutron', expected: 'iZotope' },
    { name: 'RX 11', expected: 'iZotope' },
    { name: 'Nectar', expected: 'iZotope' },
    
    { name: 'SSL Native Channel Strip 2', expected: 'SSL' },
    { name: 'SSL 4K B', expected: 'SSL' },
    { name: 'SSL', expected: 'SSL' },
    
    { name: 'Maag EQ2', expected: 'Waves' },
    { name: 'Maag EQ4', expected: 'Waves' },
    
    { name: 'Black 76 v6', expected: 'Softube' },
    { name: 'British Channel v6', expected: 'Softube' },
    { name: 'Comprexxor v6', expected: 'Softube' },
    { name: 'Guitar Amp v6', expected: 'Softube' },
    
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
    
    { name: 'ValhallaRoom', expected: 'Valhalla DSP' },
    { name: 'ValhallaVintageVerb', expected: 'Valhalla DSP' },
    
    { name: 'H-Reverb', expected: 'Eventide' },
    { name: 'TimeFactor', expected: 'Eventide' },
    
    { name: 'bx_console N', expected: 'Brainworx' },
    { name: 'bx_monitor', expected: 'Brainworx' },
    
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
