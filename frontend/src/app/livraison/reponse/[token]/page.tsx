'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2, MapPin, Phone, Truck } from 'lucide-react';
import { deliveryService, DeliveryRequestDetail } from '@/services/delivery';
import styles from './DeliveryResponse.module.css';

function DeliveryResponseContent() {
  const params = useParams<{ token: string }>();
  const searchParams = useSearchParams();
  const token = params.token;
  const preselectedAction = searchParams.get('action');

  const [request, setRequest] = useState<DeliveryRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    deliveryService.getByToken(token)
      .then(setRequest)
      .catch(() => setError("Ce lien de livraison est invalide ou a expiré."))
      .finally(() => setLoading(false));
  }, [token]);

  const handleRespond = async (action: 'accepter' | 'refuser') => {
    setResponding(true);
    setError(null);
    try {
      const updated = await deliveryService.respond(token, action);
      setRequest(updated);
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: { message?: string } } };
      setError(anyErr?.response?.data?.message ?? "Impossible d'enregistrer votre réponse. Réessayez.");
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <Loader2 size={28} className={styles.spinner} aria-hidden="true" />
          <p>Chargement…</p>
        </div>
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <XCircle size={32} color="#C0392B" aria-hidden="true" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!request) return null;

  const alreadyAnswered = !['assignee', 'en_attente_assignation'].includes(request.statut);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <Truck size={20} aria-hidden="true" />
          <span>C-Connect Livraison</span>
        </div>

        <div className={styles.iconWrap}>
          <Truck size={32} aria-hidden="true" />
        </div>

        <h1 className={styles.title}>Nouvelle livraison disponible</h1>

        <div className={styles.details}>
          <div className={styles.detailRow}>
            <MapPin size={16} aria-hidden="true" />
            <span>{request.ville_livraison}{request.adresse_livraison ? ` — ${request.adresse_livraison}` : ''}</span>
          </div>
          <div className={styles.detailRow}>
            <Phone size={16} aria-hidden="true" />
            <span>{request.telephone_livraison}</span>
          </div>
          <div className={styles.feeRow}>
            Frais de livraison : <strong>{Number(request.frais_livraison).toLocaleString('fr-FR')} XAF</strong>
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {alreadyAnswered ? (
          <div className={styles.answered}>
            {request.statut === 'acceptee' && (
              <><CheckCircle2 size={20} color="#1E7A4D" aria-hidden="true" /> Vous avez accepté cette livraison. Merci !</>
            )}
            {request.statut === 'refusee' && (
              <><XCircle size={20} color="#C0392B" aria-hidden="true" /> Vous avez refusé cette livraison.</>
            )}
            {!['acceptee', 'refusee'].includes(request.statut) && (
              <>Cette livraison a déjà été traitée (statut : {request.statut}).</>
            )}
          </div>
        ) : (
          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.acceptBtn} ${preselectedAction === 'accepter' ? styles.suggested : ''}`}
              onClick={() => handleRespond('accepter')}
              disabled={responding}
            >
              {responding ? <Loader2 size={16} className={styles.spinner} aria-hidden="true" /> : <CheckCircle2 size={16} aria-hidden="true" />}
              Accepter
            </button>
            <button
              type="button"
              className={`${styles.declineBtn} ${preselectedAction === 'refuser' ? styles.suggested : ''}`}
              onClick={() => handleRespond('refuser')}
              disabled={responding}
            >
              <XCircle size={16} aria-hidden="true" />
              Refuser
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DeliveryResponsePage() {
  return (
    <Suspense fallback={null}>
      <DeliveryResponseContent />
    </Suspense>
  );
}
