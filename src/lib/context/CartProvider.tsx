// 📄 src/lib/context/CartProvider.tsx
// v2: updateItemPrices — sincroniza os preços do carrinho quando o checkout
//     devolve 409 PRICES_CHANGED (preços revalidados no banco).
// v2: pixTotal derivado de company.payment.pixDiscountPercent — mesmo
//     percentual usado no PaymentForm (antes era 0.9 hardcoded; se o
//     desconto mudasse no config, o resumo mostraria um valor e o botão
//     "Gerar PIX" outro).
'use client';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { company } from '@/lib/config/company';

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  quantity: number;
  sku: string;
  color?: string;
  colorCode?: string;
  size?: string;
  weight: number;
  stock: number;
}
export interface AppliedCoupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderValue: number;
  maxDiscount: number;
}
export interface PriceUpdate {
  productId?: string;
  sku?: string;
  price: number;
}
interface CartContextType {
  items: CartItem[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemPrices: (updates: PriceUpdate[]) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  pixTotal: number;
  // Cupom
  appliedCoupon: AppliedCoupon | null;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
  discount: number;
  total: number;
}
const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = 'surfers-paradise-cart';
const COUPON_STORAGE_KEY = 'surfers-paradise-coupon';

// Calcula o desconto a partir do cupom e do subtotal atual.
// Recalcula sempre que o carrinho muda (ex.: cupom de % acompanha o subtotal).
function computeDiscount(
  coupon: AppliedCoupon | null,
  subtotal: number,
): number {
  if (!coupon) return 0;
  if (coupon.minOrderValue && subtotal < coupon.minOrderValue) return 0;
  let d =
    coupon.type === 'percentage'
      ? (subtotal * coupon.value) / 100
      : coupon.value;
  if (coupon.maxDiscount && coupon.maxDiscount > 0) {
    d = Math.min(d, coupon.maxDiscount);
  }
  d = Math.min(d, subtotal);
  return Math.round(d * 100) / 100;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
    null,
  );
  const [isHydrated, setIsHydrated] = useState(false);
  // Load cart + coupon from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setItems(parsed);
      }
      const storedCoupon = localStorage.getItem(COUPON_STORAGE_KEY);
      if (storedCoupon) {
        const parsed = JSON.parse(storedCoupon);
        if (parsed && parsed.code) setAppliedCoupon(parsed);
      }
    } catch {
      console.warn('Erro ao carregar carrinho');
    }
    setIsHydrated(true);
  }, []);
  // Save cart to localStorage whenever items change (skip initial empty state)
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isHydrated]);
  // Save coupon to localStorage whenever it changes
  useEffect(() => {
    if (!isHydrated) return;
    if (appliedCoupon) {
      localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem(COUPON_STORAGE_KEY);
    }
  }, [appliedCoupon, isHydrated]);
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen(prev => !prev), []);
  const addToCart = useCallback(
    (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
      setItems(prev => {
        const existing = prev.find(i => i.productId === item.productId);
        if (existing) {
          const newQty = Math.min(existing.quantity + quantity, item.stock);
          return prev.map(i =>
            i.productId === item.productId ? { ...i, quantity: newQty } : i,
          );
        }
        return [...prev, { ...item, quantity: Math.min(quantity, item.stock) }];
      });
    },
    [],
  );
  const removeFromCart = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  }, []);
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.productId !== productId));
      return;
    }
    setItems(prev =>
      prev.map(i =>
        i.productId === productId
          ? { ...i, quantity: Math.min(quantity, i.stock) }
          : i,
      ),
    );
  }, []);
  // Sincroniza preços com o banco quando o checkout devolve 409
  // PRICES_CHANGED. Casa por productId (primário) ou sku (fallback).
  const updateItemPrices = useCallback((updates: PriceUpdate[]) => {
    if (!updates?.length) return;
    setItems(prev =>
      prev.map(item => {
        const u = updates.find(
          x =>
            (x.productId && x.productId === item.productId) ||
            (x.sku && x.sku === item.sku),
        );
        return u && u.price !== item.price ? { ...item, price: u.price } : item;
      }),
    );
  }, []);
  const applyCoupon = useCallback((coupon: AppliedCoupon) => {
    setAppliedCoupon(coupon);
  }, []);
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);
  const clearCart = useCallback(() => {
    setItems([]);
    setAppliedCoupon(null);
  }, []);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discount = computeDiscount(appliedCoupon, subtotal);
  const total = Math.max(0, subtotal - discount);
  // Mesmo percentual do PaymentForm — fonte única: config da empresa
  const pixTotal = total * (1 - company.payment.pixDiscountPercent / 100);
  return (
    <CartContext.Provider
      value={{
        items,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateItemPrices,
        clearCart,
        itemCount,
        subtotal,
        pixTotal,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        discount,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
