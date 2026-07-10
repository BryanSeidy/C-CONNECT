'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CHART_PALETTE, CHART_TOOLTIP_STYLE } from '@/lib/chartTheme';
import styles from './ChartCard.module.css';

export interface DistributionDatum {
  name: string;
  value: number;
}

interface DonutChartCardProps {
  title: string;
  data: DistributionDatum[];
  loading?: boolean;
  emptyLabel?: string;
}

export function DonutChartCard({ title, data, loading, emptyLabel = 'Aucune donnée pour le moment.' }: DonutChartCardProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const hasData = !loading && total > 0;

  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{title}</h3>

      {loading && <div className={styles.skeleton} />}

      {!loading && !hasData && (
        <div className={styles.empty}>{emptyLabel}</div>
      )}

      {hasData && (
        <div className={styles.chartRow}>
          <div className={styles.donutWrap}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(value) => [Number(value), '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.donutCenter}>
              <span className={styles.donutTotal}>{total}</span>
              <span className={styles.donutTotalLabel}>total</span>
            </div>
          </div>

          <ul className={styles.legend}>
            {data.map((d, i) => (
              <li key={d.name} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: CHART_PALETTE[i % CHART_PALETTE.length] }} />
                <span className={styles.legendName}>{d.name}</span>
                <span className={styles.legendValue}>{d.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
