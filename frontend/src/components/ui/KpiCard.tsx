import React from 'react';
import styles from './KpiCard.module.css';

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'gold' | 'muted';
  trend?: { value: string; positive: boolean };
  loading?: boolean;
}

export const KpiCard = ({
  label, value, sub, icon, variant = 'default', trend, loading,
}: KpiCardProps) => (
  <div className={`${styles.card} ${styles[variant]}`}>
    {icon && <div className={styles.iconWrap} aria-hidden="true">{icon}</div>}
    <div className={styles.body}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>
        {loading ? <span className={styles.skeleton} aria-busy="true" /> : value}
      </span>
      {sub && <span className={styles.sub}>{sub}</span>}
      {trend && (
        <span className={`${styles.trend} ${trend.positive ? styles.trendUp : styles.trendDown}`}>
          {trend.positive ? '↑' : '↓'} {trend.value}
        </span>
      )}
    </div>
  </div>
);
