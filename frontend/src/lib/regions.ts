/**
 * Cameroon's 10 administrative regions with their ISO-like codes.
 * Used throughout the frontend for labels, filters, and display.
 */
export const CAMEROON_REGIONS: Record<string, string> = {
  AD: 'Adamaoua',
  CE: 'Centre',
  ES: 'Est',
  EN: 'Extrême-Nord',
  LT: 'Littoral',
  NO: 'Nord',
  NW: 'Nord-Ouest',
  OU: 'Ouest',
  SU: 'Sud',
  SW: 'Sud-Ouest',
};

/** Sorted array for use in <select> dropdowns */
export const REGION_OPTIONS = Object.entries(CAMEROON_REGIONS).map(([code, label]) => ({
  code,
  label,
}));

/** Resolve a region code to its full name. Falls back to the raw code if unknown. */
export function getRegionLabel(code: string | null | undefined): string {
  if (!code) return '—';
  return CAMEROON_REGIONS[code] ?? code;
}
