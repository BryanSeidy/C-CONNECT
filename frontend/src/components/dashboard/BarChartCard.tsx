'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { CHART_COLORS, CHART_TOOLTIP_STYLE } from '@/lib/chartTheme';
import styles from './ChartCard.module.css';

export interface SeriesDatum {
  name: string;
  value: number;
}

interface BarChartCardProps {
  title: string;
  data: SeriesDatum[];
  loading?: boolean;
  emptyLabel?: string;
  color?: string;
  valueFormatter?: (value: number) => string;
}

export function BarChartCard({
  title,
  data,
  loading,
  emptyLabel = 'Aucune donnée pour le moment.',
  color = CHART_COLORS.primary,
  valueFormatter,
}: BarChartCardProps) {
  const hasData = !loading && data.some((d) => d.value > 0);

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{title}</h3>

      {loading && <div className={styles.skeleton} />}

      {!loading && !hasData && (
        <div className={styles.empty}>{emptyLabel}</div>
      )}

      {hasData && (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={{ stroke: '#E2E8F0' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748B' }}
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={valueFormatter}
            />
            <Tooltip
              contentStyle={CHART_TOOLTIP_STYLE}
              formatter={(value) => [valueFormatter ? valueFormatter(Number(value)) : Number(value), '']}
              cursor={{ fill: 'rgba(19,53,46,0.05)' }}
            />
            <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
