import { LucideIcon } from 'lucide-react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  icon: LucideIcon;
  title?: string;
  message: string;
  action?: React.ReactNode;
}

/**
 * Consistent empty-state block for dashboard lists (RFQs, orders, disputes,
 * recurring orders, negotiations, products, company...). Replaces the
 * ad-hoc inline-styled empty blocks that were duplicated per page.
 */
export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <div className={styles.wrapper}>
      <Icon size={32} className={styles.icon} aria-hidden="true" />
      {title && <p className={styles.title}>{title}</p>}
      <p className={styles.message}>{message}</p>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}

export default EmptyState;
