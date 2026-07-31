'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Pencil, X } from 'lucide-react';
import styles from './InlineEdit.module.css';

// ── Types ─────────────────────────────────────────────────────────────────────

type InlineEditFieldType = 'text' | 'number' | 'textarea' | 'select' | 'toggle';

interface SelectOption {
  value: string;
  label: string;
}

interface InlineEditProps {
  /** Current value to display */
  value: string | number | boolean;
  /** Called with the new value; should throw on API error */
  onSave: (next: string | number | boolean) => Promise<void>;
  /** Input type */
  type?: InlineEditFieldType;
  /** For 'number' type: min value */
  min?: number;
  /** For 'number' type: max value */
  max?: number;
  /** For 'select' type: options list */
  options?: SelectOption[];
  /** Display label (fallback when value is empty) */
  placeholder?: string;
  /** Rendered inside a table cell / compact context */
  compact?: boolean;
  /** Format the displayed value (e.g. adding currency) */
  displayFormatter?: (v: string | number | boolean) => string;
  /** Validation — return error string or null */
  validate?: (v: string | number | boolean) => string | null;
  /** Aria label for the edit trigger */
  ariaLabel?: string;
  /** CSS class for the display wrapper */
  className?: string;
}

/**
 * InlineEdit — click-to-edit component.
 *
 * UX rules:
 *   - Click the value → reveals input + confirm/cancel buttons
 *   - Enter → confirm; Escape → cancel
 *   - Shows a loading spinner while the API call is in flight
 *   - Shows a red error message below the field on failure
 *   - Reverts to original value on cancel or error
 */
export function InlineEdit({
  value,
  onSave,
  type = 'text',
  min,
  max,
  options = [],
  placeholder = '—',
  compact = false,
  displayFormatter,
  validate,
  ariaLabel,
  className,
}: InlineEditProps) {
  const [editing, setEditing]   = useState(false);
  const [draft,   setDraft]     = useState<string | number | boolean>(value);
  const [saving,  setSaving]    = useState(false);
  const [error,   setError]     = useState<string | null>(null);
  const inputRef                = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>(null);

  // Sync if parent value changes
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  // Focus input on open
  useEffect(() => {
    if (editing) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [editing]);

  const displayValue = displayFormatter
    ? displayFormatter(value)
    : type === 'toggle'
      ? String(value) // handled below
      : String(value) || placeholder;

  const openEdit = () => {
    setDraft(value);
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    setDraft(value);
    setError(null);
    setEditing(false);
  };

  const confirm = async () => {
    if (saving) return;

    const validationError = validate ? validate(draft) : null;
    if (validationError) {
      setError(validationError);
      return;
    }

    // No change — close immediately
    if (draft === value) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await onSave(draft);
      setEditing(false);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? (err instanceof Error ? err.message : 'Sauvegarde impossible.');
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      confirm();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  };

  // ── Toggle variant ────────────────────────────────────────────────────────
  if (type === 'toggle') {
    const isOn = Boolean(draft);
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isOn}
        aria-label={ariaLabel ?? 'Activer / désactiver'}
        className={`${styles.toggle} ${isOn ? styles.toggleOn : ''} ${compact ? styles.compact : ''}`}
        onClick={async () => {
          setSaving(true);
          try { await onSave(!isOn); }
          catch { /* ignore */ }
          finally { setSaving(false); }
        }}
        disabled={saving}
      >
        <span className={styles.toggleThumb} aria-hidden="true" />
        {saving && <Loader2 size={12} className={styles.toggleSpinner} aria-hidden="true" />}
      </button>
    );
  }

  // ── Display mode ──────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className={`${styles.displayRow} ${compact ? styles.compact : ''} ${className ?? ''}`}>
        <span className={styles.displayValue}>
          {displayValue || <span className={styles.empty}>{placeholder}</span>}
        </span>
        <button
          type="button"
          className={styles.editTrigger}
          onClick={openEdit}
          aria-label={`Modifier : ${ariaLabel ?? String(value)}`}
          title="Cliquer pour modifier"
        >
          <Pencil size={compact ? 12 : 14} aria-hidden="true" />
        </button>
      </div>
    );
  }

  // ── Edit mode ─────────────────────────────────────────────────────────────
  return (
    <div className={`${styles.editWrap} ${compact ? styles.compact : ''}`}>
      {type === 'textarea' ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          className={`${styles.input} ${styles.textarea} ${error ? styles.inputError : ''}`}
          value={String(draft)}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={3}
          aria-label={ariaLabel}
          aria-invalid={Boolean(error)}
        />
      ) : type === 'select' ? (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          value={String(draft)}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label={ariaLabel}
          aria-invalid={Boolean(error)}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={type}
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          value={type === 'number' ? Number(draft) : String(draft)}
          onChange={e => setDraft(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
          onKeyDown={handleKeyDown}
          min={min}
          max={max}
          aria-label={ariaLabel}
          aria-invalid={Boolean(error)}
        />
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.confirmBtn}
          onClick={confirm}
          disabled={saving}
          aria-label="Confirmer"
          title="Confirmer (Entrée)"
        >
          {saving
            ? <Loader2 size={14} className={styles.spinner} aria-hidden="true" />
            : <Check size={14} aria-hidden="true" />}
        </button>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={cancel}
          disabled={saving}
          aria-label="Annuler"
          title="Annuler (Échap)"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      {error && <span className={styles.errorMsg} role="alert">{error}</span>}
    </div>
  );
}
