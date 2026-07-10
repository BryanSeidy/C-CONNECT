/**
 * Palette de couleurs pour les graphiques du dashboard.
 * Recharts a besoin de couleurs littérales (pas de var() fiable dans tous
 * les contextes SVG des libs de charting) — on duplique donc ici les valeurs
 * hex exactes de globals.css pour rester visuellement cohérent.
 */
export const CHART_COLORS = {
  primary: '#13352E',
  secondary: '#406A5A',
  light: '#5A8A74',
  gold: '#B45309',
  info: '#1D6FA4',
  error: '#C0392B',
  success: '#1E7A4D',
  muted: '#94A3B8',
} as const;

/** Rotation de couleurs pour les séries à plusieurs catégories (pie/bar). */
export const CHART_PALETTE: string[] = [
  CHART_COLORS.primary,
  CHART_COLORS.info,
  CHART_COLORS.gold,
  CHART_COLORS.secondary,
  CHART_COLORS.error,
  CHART_COLORS.light,
  CHART_COLORS.success,
  CHART_COLORS.muted,
];

export const CHART_TOOLTIP_STYLE = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 8,
  fontSize: '0.8125rem',
  fontFamily: 'var(--font-ui)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};
