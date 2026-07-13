'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sparkles, X, Send, Loader2, Bot } from 'lucide-react';
import { assistantService, ChatMessage } from '@/services/assistant';
import { useAuth } from '@/hooks/useAuth';
import styles from './AIAssistantWidget.module.css';

const WELCOME_MESSAGE: Record<string, string> = {
  seller: "Bonjour ! Je suis l'Assistant C-Connect. Je peux vous aider à comprendre le séquestre, rédiger une meilleure description produit, ou répondre à vos questions sur la plateforme. Que puis-je faire pour vous ?",
  buyer: "Bonjour ! Je suis l'Assistant C-Connect. Je peux vous expliquer comment fonctionne une RFQ, le paiement en séquestre, ou vous aider à naviguer la plateforme. Que puis-je faire pour vous ?",
  admin: "Bonjour ! Je suis l'Assistant C-Connect. Posez-moi vos questions sur le fonctionnement de la plateforme.",
  default: "Bonjour ! Je suis l'Assistant C-Connect, je peux répondre à vos questions sur la plateforme.",
};

export function AIAssistantWidget() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      const welcome = WELCOME_MESSAGE[user?.role ?? 'default'] ?? WELCOME_MESSAGE.default;
      setMessages([{ role: 'assistant', content: welcome }]);
    }
  }, [open, messages.length, user?.role]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const reply = await assistantService.chat(text, messages.slice(-10), pathname);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Désolé, une erreur est survenue. Réessayez dans un instant." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          className={styles.fab}
          onClick={() => setOpen(true)}
          aria-label="Ouvrir l'assistant IA"
        >
          <Sparkles size={22} aria-hidden="true" />
        </button>
      )}

      {open && (
        <div className={styles.panel} role="dialog" aria-label="Assistant IA C-Connect">
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <Bot size={18} aria-hidden="true" />
              <span>Assistant C-Connect</span>
            </div>
            <button type="button" className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Fermer">
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className={styles.messages} ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`${styles.bubble} ${m.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant}`}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>
                <Loader2 size={14} className={styles.spinner} aria-hidden="true" />
              </div>
            )}
          </div>

          <div className={styles.inputRow}>
            <input
              type="text"
              className={styles.input}
              placeholder="Posez votre question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              disabled={loading}
            />
            <button
              type="button"
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={loading || !input.trim()}
              aria-label="Envoyer"
            >
              <Send size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
