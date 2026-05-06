import React from 'react';
import styles from './Input.module.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || React.useId();
    
    return (
      <div className={`${styles.wrapper} ${className || ''}`}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}
        <div className={styles.inputContainer}>
          {leftIcon && <div className={`${styles.icon} ${styles.leftIcon}`}>{leftIcon}</div>}
          <input
            id={inputId}
            ref={ref}
            className={`
              ${styles.input} 
              ${error ? styles.inputError : ''} 
              ${leftIcon ? styles.hasLeftIcon : ''} 
              ${rightIcon ? styles.hasRightIcon : ''}
            `}
            {...props}
          />
          {rightIcon && <div className={`${styles.icon} ${styles.rightIcon}`}>{rightIcon}</div>}
        </div>
        {error && <span className={styles.errorMessage}>{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
