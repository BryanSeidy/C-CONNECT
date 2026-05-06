import React from 'react';
import { FaSpinner } from 'react-icons/fa';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, fullWidth, children, ...props }, ref) => {
    const classNames = [
      styles.btn,
      styles[`btn-${variant}`],
      styles[`btn-${size}`],
      fullWidth ? styles['btn-full'] : '',
      isLoading ? styles['btn-loading'] : '',
      className || ''
    ].filter(Boolean).join(' ');

    return (
      <button ref={ref} className={classNames} disabled={isLoading || props.disabled} {...props}>
        {isLoading && (
          <span className={styles.spinner}>
            <FaSpinner />
          </span>
        )}
        <span className={isLoading ? styles.hiddenText : ''}>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
