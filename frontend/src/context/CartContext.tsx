'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export interface CartItem {
  productId: number;
  slug: string;
  name: string;
  price: number;
  unite?: string;
  imageUrl?: string | null;
  stock: number;
  quantity: number;
  sellerId: number;
  sellerName: string;
  /** Présent si l'article vient d'un accord de négociation — verrouille le prix et la quantité. */
  negotiationId?: number;
}

export interface CartSellerGroup {
  sellerId: number;
  sellerName: string;
  items: CartItem[];
  subtotal: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  groupedBySeller: CartSellerGroup[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clear: () => void;
  isInCart: (productId: number) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'cconnect_cart_v1';

function loadFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate depuis localStorage après le premier rendu (évite tout
  // mismatch SSR/client — le panier est une donnée strictement locale).
  useEffect(() => {
    setItems(loadFromStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      // Un article négocié ne se fusionne pas avec une éventuelle ligne déjà
      // présente pour ce même produit à prix catalogue — chaque négociation
      // reste une ligne distincte et non modifiable en quantité.
      if (existing && !item.negotiationId && !existing.negotiationId) {
        return prev.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: Math.min(i.stock, i.quantity + quantity) }
            : i
        );
      }
      return [...prev, { ...item, quantity: item.negotiationId ? quantity : Math.min(item.stock, quantity) }];
    });
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId && !i.negotiationId
          ? { ...i, quantity: Math.max(1, Math.min(i.stock, quantity)) }
          : i
      )
    );
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const isInCart = useCallback((productId: number) => items.some((i) => i.productId === productId), [items]);

  const groupedBySeller = useMemo<CartSellerGroup[]>(() => {
    const groups = new Map<number, CartSellerGroup>();
    for (const item of items) {
      const group = groups.get(item.sellerId) ?? { sellerId: item.sellerId, sellerName: item.sellerName, items: [], subtotal: 0 };
      group.items.push(item);
      group.subtotal += item.price * item.quantity;
      groups.set(item.sellerId, group);
    }
    return Array.from(groups.values());
  }, [items]);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  return (
    <CartContext.Provider value={{ items, itemCount, groupedBySeller, addItem, updateQuantity, removeItem, clear, isInCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart doit être utilisé à l\'intérieur de <CartProvider>');
  }
  return ctx;
}
