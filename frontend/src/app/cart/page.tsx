'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Trash2, ShieldCheck, MapPin, Phone, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/ToastProvider';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Footer } from '@/components/Footer';
import { orderService } from '@/services/orders';
import styles from './Cart.module.css';

export default function CartPage() {
  const { items, groupedBySeller, updateQuantity, removeItem, clear } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const confirmDialog = useConfirm();
  const router = useRouter();

  const [ville, setVille] = useState('');
  const [telephone, setTelephone] = useState('');
  const [orderingSellerId, setOrderingSellerId] = useState<number | null>(null);

  const deliveryValid = ville.trim().length > 1 && telephone.trim().length >= 8;
  const grandTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const handleRemove = async (productId: number, name: string) => {
    const ok = await confirmDialog({
      title: 'Retirer cet article ?',
      message: `« ${name} » sera retiré de votre panier.`,
      confirmLabel: 'Retirer',
      tone: 'danger',
    });
    if (ok) removeItem(productId);
  };

  const handleOrderSeller = async (sellerId: number) => {
    if (!deliveryValid) {
      showToast('Indiquez votre ville et un numéro de téléphone avant de commander.', 'error');
      return;
    }
    const group = groupedBySeller.find((g) => g.sellerId === sellerId);
    if (!group) return;

    setOrderingSellerId(sellerId);
    try {
      const res = await orderService.createOrderFromCart({
        items: group.items.map((i) => ({ productId: i.productId, quantity: i.quantity, negotiationId: i.negotiationId })),
        villeLivraison: ville.trim(),
        telephoneLivraison: telephone.trim(),
      });
      group.items.forEach((i) => removeItem(i.productId));
      showToast(`Commande créée pour ${group.sellerName}.`, 'success');
      router.push(`/checkout?order=${res.data.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Impossible de créer la commande pour ce fournisseur.';
      showToast(msg, 'error');
    } finally {
      setOrderingSellerId(null);
    }
  };

  if (items.length === 0) {
    return (
      <>
        <div className={styles.container}>
          <EmptyState
            icon={ShoppingCart}
            title="Votre panier est vide"
            message="Parcourez le marketplace pour trouver vos prochains fournisseurs."
            action={
              <Link href="/marketplace">
                <Button variant="primary">Explorer le marketplace</Button>
              </Link>
            }
          />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Mon panier</h1>
          <button type="button" className={styles.clearBtn} onClick={clear}>
            <Trash2 size={14} aria-hidden="true" /> Vider le panier
          </button>
        </div>

        {groupedBySeller.length > 1 && (
          <p className={styles.multiSellerNote}>
            <ShieldCheck size={15} aria-hidden="true" />
            Vos articles viennent de {groupedBySeller.length} fournisseurs différents — chaque fournisseur donne lieu à
            une commande et un paiement en séquestre distincts.
          </p>
        )}

        <div className={styles.deliveryCard}>
          <h2 className={styles.deliveryTitle}>Livraison</h2>
          <div className={styles.deliveryFields}>
            <Input
              label="Ville"
              placeholder="Ex : Douala, Yaoundé…"
              leftIcon={<MapPin size={15} aria-hidden="true" />}
              value={ville}
              onChange={(e) => setVille(e.target.value)}
            />
            <Input
              label="Téléphone de contact"
              placeholder="6XX XX XX XX"
              leftIcon={<Phone size={15} aria-hidden="true" />}
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
            />
          </div>
        </div>

        {groupedBySeller.map((group) => (
          <div key={group.sellerId} className={styles.sellerGroup}>
            <div className={styles.sellerHeader}>
              <span className={styles.sellerName}>{group.sellerName}</span>
              <span className={styles.sellerSubtotal}>{group.subtotal.toLocaleString('fr-FR')} XAF</span>
            </div>

            {group.items.map((item) => (
              <div key={item.productId} className={styles.itemRow}>
                <div className={styles.itemImage} style={item.imageUrl ? { backgroundImage: `url(${item.imageUrl})` } : undefined} />
                <div className={styles.itemInfo}>
                  <Link href={`/marketplace/${item.slug}`} className={styles.itemName}>{item.name}</Link>
                  {item.negotiationId && (
                    <span className={styles.negotiatedTag}>Prix négocié</span>
                  )}
                  <span className={styles.itemUnitPrice}>{item.price.toLocaleString('fr-FR')} XAF / {item.unite ?? 'unité'}</span>
                </div>

                {item.negotiationId ? (
                  <span className={styles.qtyLocked}>Qté : {item.quantity}</span>
                ) : (
                  <div className={styles.qtyControl}>
                    <button type="button" onClick={() => updateQuantity(item.productId, item.quantity - 1)} disabled={item.quantity <= 1} aria-label="Diminuer">-</button>
                    <input
                      type="number"
                      value={item.quantity}
                      min={1}
                      max={item.stock}
                      onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                    />
                    <button type="button" onClick={() => updateQuantity(item.productId, item.quantity + 1)} disabled={item.quantity >= item.stock} aria-label="Augmenter">+</button>
                  </div>
                )}

                <span className={styles.itemSubtotal}>{(item.price * item.quantity).toLocaleString('fr-FR')} XAF</span>

                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => handleRemove(item.productId, item.name)}
                  aria-label={`Retirer ${item.name} du panier`}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            ))}

            {isAuthenticated && user?.role === 'buyer' ? (
              <Button
                variant="primary"
                onClick={() => handleOrderSeller(group.sellerId)}
                isLoading={orderingSellerId === group.sellerId}
                className={styles.orderSellerBtn}
              >
                <ShieldCheck size={16} aria-hidden="true" />
                Commander auprès de {group.sellerName}
                <ArrowRight size={16} aria-hidden="true" />
              </Button>
            ) : !isAuthenticated ? (
              <Link href={`/login?redirect=/cart`}>
                <Button variant="secondary" className={styles.orderSellerBtn}>Se connecter pour commander</Button>
              </Link>
            ) : (
              <p className={styles.buyerOnlyNote}>Seuls les comptes acheteurs peuvent passer commande.</p>
            )}
          </div>
        ))}

        <div className={styles.grandTotalRow}>
          <span>Total du panier</span>
          <strong>{grandTotal.toLocaleString('fr-FR')} XAF</strong>
        </div>
      </div>
      <Footer />
    </>
  );
}
