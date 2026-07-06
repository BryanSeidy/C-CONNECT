'use client';

import React, { useEffect, useState } from 'react';
import { Award, Star, TrendingUp, Zap } from 'lucide-react';
import { apiClient } from '@/services/api';
import styles from './GamificationWidget.module.css';

interface BadgeMeta {
  code: string;
  label: string;
  description: string;
  color: string;
}

interface NextBadge {
  badge: string;
  label: string;
  progress: number;
  target: number;
}

interface GamificationData {
  points: number;
  total_sales: number;
  volume_ventes: number;
  quality_rating: number;
  badges: string[];
  badges_meta: BadgeMeta[];
  next_badge: NextBadge | null;
}

interface ApiShape {
  success: boolean;
  data: GamificationData;
}

function BadgeChip({ badge }: { badge: BadgeMeta }) {
  return (
    <div className={styles.badge} title={badge.description} style={{ borderColor: badge.color }}>
      <span className={styles.badgeDot} style={{ background: badge.color }} aria-hidden="true" />
      <span className={styles.badgeLabel}>{badge.label}</span>
    </div>
  );
}

function ProgressBar({ progress, target, label }: { progress: number; target: number; label: string }) {
  const pct = Math.min(100, Math.round((progress / target) * 100));
  return (
    <div className={styles.progressWrap}>
      <div className={styles.progressHeader}>
        <span className={styles.progressLabel}>Prochain badge : {label}</span>
        <span className={styles.progressPct}>{progress} / {target}</span>
      </div>
      <div className={styles.track} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function GamificationWidget({ compact = false }: { compact?: boolean }) {
  const [data,    setData]    = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<unknown, ApiShape>('/gamification/me')
      .then(res => setData(res.data))
      .catch(() => { /* silently skip — non-critical widget */ })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={`${styles.widget} ${compact ? styles.compact : ''}`} aria-busy="true">
        <div className={styles.skLine} style={{ width: '60%', height: 12 }} />
        <div className={styles.skLine} style={{ width: '80%', height: 24, marginTop: 8 }} />
        <div className={styles.skLine} style={{ width: '40%', height: 10, marginTop: 8 }} />
      </div>
    );
  }

  if (!data) return null;

  if (compact) {
    return (
      <div className={`${styles.widget} ${styles.compact}`}>
        <div className={styles.compactRow}>
          <Zap size={14} className={styles.compactIcon} aria-hidden="true" />
          <span className={styles.compactPoints}>{data.points} pts</span>
          <span className={styles.compactSep} aria-hidden="true">·</span>
          <span className={styles.compactBadges}>{data.badges.length} badge{data.badges.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.widget}>
      <h3 className={styles.widgetTitle}>
        <Award size={16} aria-hidden="true" />
        Votre progression
      </h3>

      {/* KPI row */}
      <div className={styles.kpiRow}>
        <div className={styles.kpi}>
          <span className={styles.kpiValue}>{data.points}</span>
          <span className={styles.kpiLabel}>Points</span>
        </div>
        <div className={styles.kpiDivider} aria-hidden="true" />
        <div className={styles.kpi}>
          <span className={styles.kpiValue}>{data.total_sales}</span>
          <span className={styles.kpiLabel}>Ventes</span>
        </div>
        <div className={styles.kpiDivider} aria-hidden="true" />
        <div className={styles.kpi}>
          <span className={styles.kpiValue}>{data.quality_rating > 0 ? data.quality_rating.toFixed(1) : '—'}</span>
          <span className={styles.kpiLabel}>Note qualite</span>
        </div>
        <div className={styles.kpiDivider} aria-hidden="true" />
        <div className={styles.kpi}>
          <span className={styles.kpiValue}>{data.badges.length}</span>
          <span className={styles.kpiLabel}>Badges</span>
        </div>
      </div>

      {/* Volume */}
      {data.volume_ventes > 0 && (
        <div className={styles.volumeRow}>
          <TrendingUp size={14} aria-hidden="true" />
          <span>Volume total : <strong>{data.volume_ventes.toLocaleString('fr-FR')} XAF</strong></span>
        </div>
      )}

      {/* Progression vers prochain badge */}
      {data.next_badge && (
        <ProgressBar
          progress={data.next_badge.progress}
          target={data.next_badge.target}
          label={data.next_badge.label}
        />
      )}

      {/* Badges */}
      {data.badges_meta.length > 0 ? (
        <div className={styles.badgesSection}>
          <h4 className={styles.badgesTitle}>
            <Star size={14} aria-hidden="true" />
            Badges obtenus
          </h4>
          <div className={styles.badgesGrid}>
            {data.badges_meta.map(b => <BadgeChip key={b.code} badge={b} />)}
          </div>
        </div>
      ) : (
        <p className={styles.noBadges}>
          Completez vos premieres ventes pour debloquer vos premiers badges.
        </p>
      )}
    </div>
  );
}
