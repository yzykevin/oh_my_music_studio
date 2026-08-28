export interface GroupedPlugin<T> {
  plugin: T;
  formats: string[];
  entries: T[];
}

export function groupPluginsByName<T extends { name: string; type: string }>(plugins: T[]): GroupedPlugin<T>[] {
  const grouped = new Map<string, GroupedPlugin<T>>();

  for (const plugin of plugins) {
    const key = plugin.name.toLowerCase();
    const existing = grouped.get(key);
    if (existing) {
      existing.entries.push(plugin);
      if (!existing.formats.includes(plugin.type)) existing.formats.push(plugin.type);
      continue;
    }

    grouped.set(key, { plugin, formats: [plugin.type], entries: [plugin] });
  }

  return Array.from(grouped.values());
}
