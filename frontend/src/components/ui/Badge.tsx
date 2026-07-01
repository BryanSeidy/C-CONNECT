import React from 'react';
import styles from './Badge.module.css';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'gold' | 'verified';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => (
    <span
      ref={ref}
      className={`${styles.badge} ${styles[variant]} ${className ?? ''}`}
      {...props}
    >
      {children}
    </span>
  )
);
Badge.displayName = 'Badge';
