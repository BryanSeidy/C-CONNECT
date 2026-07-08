import styles from './Spinner.module.css';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

/**
 * Branded loading spinner using the C-Connect mark colors.
 * Used for route-level loading.tsx files and inline async states.
 */
export function Spinner({ size = 'md', label }: SpinnerProps) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <span className={`${styles.spinner} ${styles[size]}`} aria-hidden="true" />
      <span className={styles.label}>{label ?? 'Chargement…'}</span>
    </div>
  );
}

export default Spinner;
