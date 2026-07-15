'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, MapPin, ArrowRight } from 'lucide-react';
import { REGION_OPTIONS } from '@/lib/regions';
import styles from './RegionSelector3D.module.css';

const AUTOPLAY_MS = 4200;
const COUNT = REGION_OPTIONS.length;
const STEP_DEG = 360 / COUNT;

/**
 * Carrousel 3D pur CSS (perspective + rotateY/translateZ) — pas de Three.js.
 * Choix délibéré : le public cible navigue souvent sur des mobiles
 * d'entrée/moyenne gamme avec un réseau variable ; un rendu WebGL (three.js
 * + react-three-fiber) ajouterait ~600 Ko+ de JS et un risque de saccade sur
 * ces appareils, pour un gain visuel marginal par rapport à un effet de
 * profondeur CSS — qui reste du vrai 3D (transformations dans l'espace),
 * juste rendu par le compositeur GPU du navigateur plutôt que par un canvas
 * WebGL. « Premium veut dire clarté », pas performance sacrifiée.
 */
export function RegionSelector3D() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((index: number) => {
    setActive(((index % COUNT) + COUNT) % COUNT);
  }, []);

  useEffect(() => {
    if (paused) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setActive((a) => (a + 1) % COUNT), AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <div
      className={styles.wrapper}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className={styles.scene}>
        <div
          className={styles.stage}
          style={{ transform: `rotateY(${-active * STEP_DEG}deg)` }}
        >
          {REGION_OPTIONS.map((region, i) => {
            const offset = Math.abs(i - active) % COUNT;
            const distance = Math.min(offset, COUNT - offset);
            const isActive = distance === 0;
            return (
              <button
                key={region.code}
                type="button"
                className={styles.card}
                data-active={isActive}
                data-distance={Math.min(distance, 2)}
                style={{ transform: `rotateY(${i * STEP_DEG}deg) translateZ(min(38vw, 240px))` }}
                onClick={() => goTo(i)}
                tabIndex={isActive ? 0 : -1}
                aria-hidden={!isActive}
                aria-label={`Région ${region.label}`}
              >
                <MapPin size={22} aria-hidden="true" className={styles.cardIcon} />
                <span className={styles.cardLabel}>{region.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.controls}>
        <button type="button" onClick={() => goTo(active - 1)} className={styles.arrowBtn} aria-label="Région précédente">
          <ChevronLeft size={18} aria-hidden="true" />
        </button>

        <div className={styles.dots} role="tablist" aria-label="Choisir une région">
          {REGION_OPTIONS.map((region, i) => (
            <button
              key={region.code}
              type="button"
              className={styles.dot}
              data-active={i === active}
              onClick={() => goTo(i)}
              role="tab"
              aria-selected={i === active}
              aria-label={region.label}
            />
          ))}
        </div>

        <button type="button" onClick={() => goTo(active + 1)} className={styles.arrowBtn} aria-label="Région suivante">
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      <Link href={`/marketplace?country=${REGION_OPTIONS[active].code}`} className={styles.cta}>
        Voir les fournisseurs de {REGION_OPTIONS[active].label}
        <ArrowRight size={16} aria-hidden="true" />
      </Link>
    </div>
  );
}

export default RegionSelector3D;
