'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { PaymentPanel } from '@/components/checkout/PaymentPanel';
import { orderService } from '@/services/orders';
import { Order } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import styles from './Checkout.module.css';

function CheckoutContent() {
  const params    = useSearchParams();
  const router    = useRouter();
  const { user }  = useAuth();

  const orderId = params.get('order');

  const [order,   setOrder]   = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('Identifiant de commande manquant.');
      setLoading(false);
      return;
    }

    orderService.getOrderById(orderId)
      .then(res => setOrder(res.data))
      .catch(() => setError('Commande introuvable ou acces non autorise.'))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handlePaymentSuccess = (txRef: string) => {
    setTimeout(() => {
      router.push(`/dashboard/orders?success=1&ref=${txRef}`);
    }, 2000);
  };

  if (!user) {
    return (
      <div className={styles.gate}>
        <p>Connectez-vous pour acceder au paiement.</p>
        <Link href={`/login?redirect=/checkout?order=${orderId}`} className={styles.loginLink}>
          Se connecter
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Navigation">
        <Link href="/dashboard/orders" className={styles.backLink}>
          <ArrowLeft size={16} aria-hidden="true" />
          Retour aux commandes
        </Link>
      </nav>

      <div className={styles.layout}>
        {/* Left — Order summary */}
        <div className={styles.summaryCol}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <h2 className={styles.summaryTitle}>Recapitulatif de commande</h2>
            </div>

            {loading ? (
              <div className={styles.skeleton}>
                <div className={styles.skLine} style={{ width: '70%' }} />
                <div className={styles.skLine} style={{ width: '50%' }} />
                <div className={styles.skLine} style={{ width: '85%' }} />
              </div>
            ) : error ? (
              <p className={styles.errorMsg}>{error}</p>
            ) : order ? (
              <div className={styles.summaryBody}>
                <div className={styles.summaryRef}>
                  Commande <code>#{String(order.id).substring(0, 8).toUpperCase()}</code>
                </div>

                {order.items?.map(item => (
                  <div key={item.id} className={styles.orderItem}>
                    <span className={styles.orderItemName}>{item.product?.name ?? 'Produit'}</span>
                    <div className={styles.orderItemMeta}>
                      <span>x{item.quantity} {item.product?.country ? `— ${item.product.country}` : ''}</span>
                      <span className={styles.orderItemAmt}>
                        {item.subtotal.toLocaleString('fr-FR')} FCFA
                      </span>
                    </div>
                  </div>
                ))}

                <div className={styles.summaryTotals}>
                  <div className={`${styles.totalRow} ${styles.totalGrand}`}>
                    <span>Total à régler</span>
                    <strong>{order.montantTotal.toLocaleString('fr-FR')} FCFA</strong>
                  </div>
                  <div className={styles.totalRow} style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    <span>Dont commission C-Connect (prélevée côté fournisseur)</span>
                    <span>{order.commissionPlateforme.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>

                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '-0.25rem 0 0' }}>
                  Aucun frais supplémentaire : le montant ci-dessus est exactement ce que vous payez.
                </p>

                {/* Escrow assurance */}
                <div className={styles.escrowNote}>
                  <ShieldCheck size={14} aria-hidden="true" />
                  <span>
                    Votre paiement sera retenu en sequestre C-Connect.
                    Les fonds ne seront vires au fournisseur qu&apos;apres votre confirmation de reception.
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right — Payment panel */}
        <div className={styles.paymentCol}>
          {order && !loading && !error ? (
            <PaymentPanel
              orderId={String(order.id)}
              amountXaf={order.montantTotal}
              onSuccess={handlePaymentSuccess}
            />
          ) : loading ? (
            <div className={styles.summaryCard}>
              <div className={styles.skeleton}>
                <div className={styles.skLine} style={{ width: '60%', height: 24 }} />
                <div className={styles.skLine} style={{ width: '100%', height: 80, marginTop: 12 }} />
                <div className={styles.skLine} style={{ width: '100%', height: 48, marginTop: 12 }} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutContent />
    </Suspense>
  );
}
