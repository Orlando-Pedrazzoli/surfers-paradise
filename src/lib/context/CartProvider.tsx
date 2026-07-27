// 📄 src/lib/context/CartProvider.tsx
// v4 (UX da sidebar):
// - Auto-close: quando o carrinho TRANSICIONA de cheio → vazio com a
//   sidebar aberta (ex.: user removeu o último item pelo ícone de lixeira),
//   a sidebar fecha sozinha após 400ms (deixa a animação de remoção
//   respirar antes de fechar).
// - prevItemsLength (ref) garante que só fechamos na transição — abrir a
//   sidebar com o carrinho JÁ vazio (ícone da navbar) continua funcionando
//   normalmente, mostrando o estado "Seu carrinho está vazio".
//
// v3 (cupons restritos por categoria/marca):
// - O desconto do cupom deixa de ser calculado no client (computeDiscount
//   aposentado) — o client não conhece as regras de elegibilidade
//   (categoria/marca vivem como refs no Product, server-side).
// - AppliedCoupon agora guarda o discount CALCULADO PELO SERVIDOR, além de
//   eligibleCount/totalCount/isRestricted para a UI mostrar "X de Y itens".
// - Revalidação automática: sempre que os items mudam (add/remove/qty),
//   o cupom é re-validado em /api/coupons/validate e o desconto atualizado.
//   Se deixar de ser válido (ex.: cliente removeu o único item elegível),
//   o cupom é removido e um aviso fica disponível em couponNotice.
// - Sequence counter evita race de respostas fora de ordem.
//
// v2: updateItemPrices — sincroniza os preços do carrinho quando o checkout
//     devolve 409 PRICES_CHANGED (preços revalidados no banco).
// v2: pixTotal derivado de company.payment.pixDiscountPercent — mesmo
//     percentual usado no PaymentForm.
'use client';
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
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
  // Calculados pelo SERVIDOR (fonte de verdade) em /api/coupons/validate:
  discount: number;
  eligibleCount: number;
  totalCount: number;
  isRestricted: boolean;
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
  // Aviso quando o cupom foi removido/alterado por mudança no carrinho
  couponNotice: string;
  clearCouponNotice: () => void;
}
const CartContext = createContext<CartContextType | undefined>(undefined);
const CART_STORAGE_KEY = 'surfers-paradise-cart';
const COUPON_STORAGE_KEY = 'surfers-paradise-coupon';
// Delay antes de fechar a sidebar quando o carrinho esvazia (ms)
const EMPTY_CART_CLOSE_DELAY = 400;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
    null,
  );
  const [couponNotice, setCouponNotice] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  // Sequence counter: descarta respostas de revalidação fora de ordem
  const revalidateSeq = useRef(0);
  // Comprimento anterior da lista de itens — usado para detectar a
  // TRANSIÇÃO cheio → vazio (auto-close da sidebar)
  const prevItemsLength = useRef(0);
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
        // Cupons persistidos no formato antigo (sem discount) são
        // descartados — a revalidação abaixo os reaplicaria de qualquer
        // forma, mas exigir o formato novo simplifica o tipo.
        if (parsed && parsed.code && typeof parsed.discount === 'number') {
          setAppliedCoupon(parsed);
        }
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

  // ── Auto-close da sidebar quando o carrinho esvazia ──────────────
  // Só dispara na TRANSIÇÃO cheio → vazio (prevItemsLength > 0). Abrir a
  // sidebar já vazia pela navbar NÃO fecha sozinho — o user vê o estado
  // vazio com o CTA "Continuar Comprando", como esperado.
  useEffect(() => {
    const wasFull = prevItemsLength.current > 0;
    prevItemsLength.current = items.length;

    if (items.length === 0 && wasFull && isCartOpen) {
      const timer = setTimeout(
        () => setIsCartOpen(false),
        EMPTY_CART_CLOSE_DELAY,
      );
      return () => clearTimeout(timer);
    }
  }, [items.length, isCartOpen]);

  // ── Revalidação server-side do cupom quando o carrinho muda ──────
  // O desconto vem SEMPRE do servidor: só ele conhece a elegibilidade
  // por categoria/marca. Assinatura de itens (id:qty:price) evita
  // re-fetch quando nada relevante mudou.
  const itemsSignature = items
    .map(i => `${i.productId}:${i.quantity}:${i.price}`)
    .join('|');

  useEffect(() => {
    if (!isHydrated || !appliedCoupon) return;
    if (items.length === 0) {
      // Carrinho esvaziado → cupom sai junto, sem aviso
      setAppliedCoupon(null);
      return;
    }

    const seq = ++revalidateSeq.current;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch('/api/coupons/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            code: appliedCoupon.code,
            items: items.map(i => ({
              productId: i.productId,
              sku: i.sku,
              quantity: i.quantity,
              price: i.price,
            })),
          }),
        });
        const data = await res.json();
        if (seq !== revalidateSeq.current) return; // resposta obsoleta

        if (!data.valid) {
          setAppliedCoupon(null);
          setCouponNotice(
            data.message ||
              'O cupom foi removido porque deixou de ser válido para o seu carrinho.',
          );
          return;
        }
        // Atualiza só se algo mudou (evita loop de renders/persistência)
        setAppliedCoupon(prev => {
          if (!prev || prev.code !== data.code) return prev;
          if (
            prev.discount === data.discount &&
            prev.eligibleCount === data.eligibleCount &&
            prev.totalCount === data.totalCount
          ) {
            return prev;
          }
          return {
            ...prev,
            discount: data.discount ?? 0,
            eligibleCount: data.eligibleCount ?? items.length,
            totalCount: data.totalCount ?? items.length,
            isRestricted: data.isRestricted ?? false,
          };
        });
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
        // Falha de rede na revalidação: mantém o último desconto conhecido.
        // O checkout revalida server-side de qualquer forma (anti-tampering),
        // então não há risco de cobrança errada.
        console.warn('Falha ao revalidar cupom:', err);
      }
    })();

    return () => controller.abort();
    // appliedCoupon?.code (e não o objeto todo): o efeito dispara quando o
    // CÓDIGO muda ou os itens mudam — não quando o próprio efeito atualiza
    // discount/eligibleCount (evita loop).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsSignature, appliedCoupon?.code, isHydrated]);

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
    setCouponNotice('');
  }, []);
  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponNotice('');
  }, []);
  const clearCouponNotice = useCallback(() => setCouponNotice(''), []);
  const clearCart = useCallback(() => {
    setItems([]);
    setAppliedCoupon(null);
    setCouponNotice('');
  }, []);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  // Desconto: valor calculado pelo servidor (guardado no appliedCoupon).
  // Clamp ao subtotal por segurança de exibição.
  const discount = appliedCoupon
    ? Math.min(appliedCoupon.discount, subtotal)
    : 0;
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
        couponNotice,
        clearCouponNotice,
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
