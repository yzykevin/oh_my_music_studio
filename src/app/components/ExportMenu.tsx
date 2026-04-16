'use client';

import { useState } from 'react';
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import styles from './ExportMenu.module.css';

const pdfStyles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  title: { fontSize: 18, marginBottom: 20, fontWeight: 'bold' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, borderBottom: '1px solid #ddd', paddingBottom: 4 },
  row: { flexDirection: 'row', paddingVertical: 4 },
  label: { width: 120, color: '#666' },
  value: { flex: 1, color: '#000' },
  pluginRow: { flexDirection: 'row', paddingVertical: 2, paddingLeft: 8 },
  indent: { paddingLeft: 16 },
});

interface ReportData {
  software: Array<{
    name: string;
    vendor?: string;
    type: string;
    version: string;
  }>;
  hardware: {
    audioDevices: Array<{ name: string; manufacturer: string; transport: string }>;
    midiDevices: Array<{ name: string; manufacturer: string }>;
    runningDAWs: string[];
  };
}

interface ExportMenuProps {
  software: Array<{
    name: string;
    vendor?: string;
    type: string;
    version: string;
  }>;
  hardware: {
    audioDevices: Array<{ name: string; manufacturer: string; transport: string }>;
    midiDevices: Array<{ name: string; manufacturer: string }>;
    runningDAWs: string[];
  } | null;
}

function MusicStudioReport({ data }: { data: ReportData }) {
  const daws = data.software.filter(s => s.type === 'daw');
  const plugins = data.software.filter(s => s.type !== 'daw' && s.type !== 'auxiliary' && s.type !== 'driver' && s.type !== 'ilok');
  const auxiliaries = data.software.filter(s => s.type === 'auxiliary');

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>OMS — Report</Text>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>DAWs ({daws.length})</Text>
          {daws.map((d, i) => (
            <View key={i} style={pdfStyles.row}>
              <Text style={pdfStyles.label}>{d.name}</Text>
              <Text style={pdfStyles.value}>v{d.version}</Text>
            </View>
          ))}
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Plugins ({plugins.length})</Text>
          {plugins.map((p, i) => (
            <View key={i} style={pdfStyles.pluginRow}>
              <Text>{p.vendor ?? 'Other'} — {p.name} [{p.type.toUpperCase()}]</Text>
            </View>
          ))}
        </View>

        {auxiliaries.length > 0 && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Auxiliary ({auxiliaries.length})</Text>
            {auxiliaries.map((a, i) => (
              <View key={i} style={pdfStyles.row}>
                <Text style={pdfStyles.value}>{a.name}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Audio Devices ({data.hardware.audioDevices.length})</Text>
          {data.hardware.audioDevices.map((d, i) => (
            <View key={i} style={pdfStyles.row}>
              <Text style={pdfStyles.value}>{d.name} ({d.transport})</Text>
            </View>
          ))}
        </View>

        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>MIDI Devices ({data.hardware.midiDevices.length})</Text>
          {data.hardware.midiDevices.map((d, i) => (
            <View key={i} style={pdfStyles.row}>
              <Text style={pdfStyles.value}>{d.name} — {d.manufacturer}</Text>
            </View>
          ))}
        </View>

        {data.hardware.runningDAWs.length > 0 && (
          <View style={pdfStyles.section}>
            <Text style={pdfStyles.sectionTitle}>Running DAWs</Text>
            {data.hardware.runningDAWs.map((d, i) => (
              <View key={i} style={pdfStyles.row}>
                <Text style={pdfStyles.value}>{d}</Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
}

export function ExportMenu({ software, hardware }: ExportMenuProps) {
  const [open, setOpen] = useState(false);

  const handleExportJSON = async () => {
    setOpen(false);
    const filePath = await window.electronAPI.showSaveDialog({
      defaultPath: `music-studio-${Date.now()}.json`,
      filters: [{ name: 'JSON', extensions: ['json'] }],
    });
    if (!filePath) return;
    const data = JSON.stringify({ software, hardware }, null, 2);
    const result = await window.electronAPI.writeFile(filePath, data);
    if (!result.success) alert(`Export failed: ${result.error}`);
  };

  const handleExportMarkdown = async () => {
    setOpen(false);
    const filePath = await window.electronAPI.showSaveDialog({
      defaultPath: `music-studio-${Date.now()}.md`,
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    });
    if (!filePath) return;
    const daws = software.filter(s => s.type === 'daw');
    const plugins = software.filter(s => !['daw', 'auxiliary', 'driver', 'ilok'].includes(s.type));
    const auxiliaries = software.filter(s => s.type === 'auxiliary');

    let md = '# OMS Report\n\n';
    md += `Generated: ${new Date().toLocaleString()}\n\n`;
    md += `## DAWs (${daws.length})\n`;
    for (const d of daws) {
      md += `- **${d.name}** v${d.version}\n`;
    }
    md += `\n## Plugins (${plugins.length})\n`;
    const byVendor: Record<string, typeof plugins> = {};
    for (const p of plugins) {
      const v = p.vendor ?? 'Other';
      (byVendor[v] ??= []).push(p);
    }
    for (const [vendor, vplugins] of Object.entries(byVendor).sort(([a], [b]) => a.localeCompare(b))) {
      md += `### ${vendor} (${vplugins.length})\n`;
      for (const p of vplugins) {
        md += `- ${p.name} [${p.type.toUpperCase()}]\n`;
      }
      md += '\n';
    }
    if (auxiliaries.length > 0) {
      md += `## Auxiliary (${auxiliaries.length})\n`;
      for (const a of auxiliaries) {
        md += `- ${a.name}\n`;
      }
      md += '\n';
    }
    if (hardware) {
      md += `## Audio Devices (${hardware.audioDevices.length})\n`;
      for (const d of hardware.audioDevices) {
        md += `- ${d.name} (${d.transport})\n`;
      }
      md += '\n';
      if (hardware.midiDevices.length > 0) {
        md += `## MIDI Devices (${hardware.midiDevices.length})\n`;
        for (const d of hardware.midiDevices) {
          md += `- ${d.name}\n`;
        }
        md += '\n';
      }
      if (hardware.runningDAWs.length > 0) {
        md += `## Running DAWs\n`;
        for (const d of hardware.runningDAWs) {
          md += `- ${d}\n`;
        }
        md += '\n';
      }
    }

    const result = await window.electronAPI.writeFile(filePath, md);
    if (!result.success) alert(`Export failed: ${result.error}`);
  };

  const handleExportPDF = async () => {
    setOpen(false);
    const filePath = await window.electronAPI.showSaveDialog({
      defaultPath: `music-studio-${Date.now()}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (!filePath) return;

    try {
      const blob = await pdf(
        <MusicStudioReport
          data={{ software, hardware: hardware ?? { audioDevices: [], midiDevices: [], runningDAWs: [] } }}
        />
      ).toBlob();
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const result = await window.electronAPI.writePdfFile(filePath, base64);
        if (!result.success) alert(`Export failed: ${result.error}`);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      alert(`PDF export failed: ${err}`);
    }
  };

  return (
    <div className={styles.exportWrapper}>
      <button
        className={styles.exportButton}
        onClick={() => setOpen(!open)}
      >
        📥 Export
      </button>
      {open && (
        <div className={styles.dropdown}>
          <button className={styles.dropdownItem} onClick={handleExportJSON}>
            📄 JSON
          </button>
          <button className={styles.dropdownItem} onClick={handleExportMarkdown}>
            📝 Markdown
          </button>
          <button className={styles.dropdownItem} onClick={handleExportPDF}>
            📕 PDF
          </button>
        </div>
      )}
    </div>
  );
}
