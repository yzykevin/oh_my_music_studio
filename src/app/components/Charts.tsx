'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './Charts.module.css';

const FORMAT_COLORS: Record<string, string> = {
  vst: '#8B5CF6',
  vst3: '#A855F7',
  au: '#F97316',
  aax: '#EF4444',
};

interface FormatData {
  name: string;
  value: number;
}

interface FormatPieChartProps {
  data: FormatData[];
  lang: 'en' | 'zh';
}

export function FormatPieChart({ data, lang }: FormatPieChartProps) {
  if (data.length === 0) return null;

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className={styles.chartContainer}>
      <h4 className={styles.chartTitle}>
        {lang === 'zh' ? '插件格式分布' : 'Plugin Format Distribution'}
      </h4>
      <div className={styles.chartBody}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={FORMAT_COLORS[entry.name.toLowerCase()] ?? '#888'}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => {
                const v = Number(value);
                return [`${v} (${((v / total) * 100).toFixed(0)}%)`, ''];
              }}
              contentStyle={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.8125rem',
              }}
            />
            <Legend
              formatter={(value) => (
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface VendorData {
  vendor: string;
  count: number;
}

interface VendorBarChartProps {
  data: VendorData[];
  lang: 'en' | 'zh';
}

const VENDOR_COLORS = [
  '#6366F1', '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
  '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E',
  '#14B8A6', '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
];

export function VendorBarChart({ data, lang }: VendorBarChartProps) {
  if (data.length === 0) return null;

  const chartData = data.slice(0, 10);

  return (
    <div className={styles.chartContainer}>
      <h4 className={styles.chartTitle}>
        {lang === 'zh' ? '厂商插件数量 Top 10' : 'Plugins by Vendor (Top 10)'}
      </h4>
      <div className={styles.chartBody}>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={90}
              paddingAngle={1}
              dataKey="count"
              nameKey="vendor"
              label={({ name, percent }: { name?: string; percent?: number }) =>
                `${name ?? ''} (${((percent ?? 0) * 100).toFixed(0)}%)`
              }
              labelLine={false}
            >
              {chartData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={VENDOR_COLORS[index % VENDOR_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [Number(value), lang === 'zh' ? '插件数' : 'Plugins']}
              contentStyle={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.8125rem',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
