'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './FaqAccordion.module.css';

export type FaqItem = { question: string; answer: string };

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className={styles.list}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div className={styles.item} key={item.question} data-open={isOpen}>
            <button
              type="button"
              className={styles.question}
              aria-expanded={isOpen}
              aria-controls={`faq-panel-${index}`}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span>{item.question}</span>
              <ChevronDown size={18} className={styles.chevron} aria-hidden="true" />
            </button>
            <div
              id={`faq-panel-${index}`}
              role="region"
              className={styles.answerWrap}
              style={{ maxHeight: isOpen ? '16rem' : '0px' }}
            >
              <p className={styles.answer}>{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
