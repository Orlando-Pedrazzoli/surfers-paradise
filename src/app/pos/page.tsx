'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  Search,
  ShoppingCart,
  Package,
  Plus,
  Minus,
  Trash2,
  X,
  LogOut,
  Loader2,
  Check,
  Zap,
  Keyboard,
} from 'lucide-react';
import PosPaymentModal from '@/components/admin/PosPaymentModal';
import QuickProductModal from '@/components/admin/QuickProductModal';
import PosShortcutsHelp from '@/components/admin/PosShortcutsHelp';

interface PosProduct {
  _id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  images: string[];
  thumbnail?: string;
  brand?: { name: string };
}

interface CartItem {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  stock: number;
  image: string;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatClock(): string {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PosPage() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clock, setClock] = useState(formatClock());
  const [successMessage, setSuccessMessage] = useState<{
    orderId: string;
    orderNumber: string;
    change?: number;
  } | null>(null);

  // Debounce da busca
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Relógio
  useEffect(() => {
    const t = setInterval(() => setClock(formatClock()), 30000);
    return () => clearInterval(t);
  }, []);

  // Focar busca + atalhos
  useEffect(() => {
    searchInputRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      const modalOpen =
        showPayment || showQuickAdd || showHelp || !!successMessage;
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT';

      // F2 — focar busca (sempre disponível)
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // Atalhos bloqueados se modal aberto
      if (modalOpen) return;

      // F3 — limpar carrinho
      if (e.key === 'F3') {
        e.preventDefault();
        if (cart.length > 0 && confirm('Limpar carrinho?')) {
          setCart([]);
        }
        return;
      }

      // F4 — finalizar venda
      if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) setShowPayment(true);
        return;
      }

      // F7 — cadastro rápido
      if (e.key === 'F7') {
        e.preventDefault();
        setShowQuickAdd(true);
        return;
      }

      // F9 — remover último item
      if (e.key === 'F9') {
        e.preventDefault();
        if (cart.length > 0) {
          setCart(prev => prev.slice(0, -1));
          toast.success('Último item removido');
        }
        return;
      }

      // + ou = — aumentar quantidade do último item (só se não estiver digitando)
      if ((e.key === '+' || e.key === '=') && !isTyping) {
        e.preventDefault();
        if (cart.length > 0) {
          const last = cart[cart.length - 1];
          if (last.quantity < last.stock) {
            setCart(prev =>
              prev.map((i, idx) =>
                idx === prev.length - 1
                  ? { ...i, quantity: i.quantity + 1 }
                  : i,
              ),
            );
          } else {
            toast.error(`Estoque máximo (${last.stock}) atingido`);
          }
        }
        return;
      }

      // - — diminuir quantidade do último item
      if (e.key === '-' && !isTyping) {
        e.preventDefault();
        if (cart.length > 0) {
          const last = cart[cart.length - 1];
          if (last.quantity > 1) {
            setCart(prev =>
              prev.map((i, idx) =>
                idx === prev.length - 1
                  ? { ...i, quantity: i.quantity - 1 }
                  : i,
              ),
            );
          } else {
            setCart(prev => prev.slice(0, -1));
          }
        }
        return;
      }

      // ? — mostrar ajuda
      if (e.key === '?' && !isTyping) {
        e.preventDefault();
        setShowHelp(true);
        return;
      }

      // ESC — limpar busca
      if (e.key === 'Escape') {
        setSearch('');
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [cart, showPayment, showQuickAdd, showHelp, successMessage]);

  // Carregar produtos
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('context', 'pos');
      params.set('limit', '60');
      params.set('sort', '-soldCount');
      if (debouncedSearch) params.set('search', debouncedSearch);

      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      if (data.success) setProducts(data.products);
    } catch {
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // CART OPERATIONS
  const addToCart = (product: PosProduct) => {
    if (product.stock <= 0) {
      toast.error(`${product.name} está sem estoque`);
      return;
    }

    const existing = cart.find(i => i.productId === product._id);
    if (existing && existing.quantity >= product.stock) {
      toast.error(`Estoque máximo (${product.stock}) atingido`);
      return;
    }

    setCart(prev => {
      const ex = prev.find(i => i.productId === product._id);
      if (ex) {
        return prev.map(i =>
          i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          quantity: 1,
          stock: product.stock,
          image: product.thumbnail || product.images[0] || '',
        },
      ];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    const item = cart.find(i => i.productId === productId);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty > item.stock) {
      toast.error(`Estoque máximo (${item.stock}) atingido`);
      return;
    }
    setCart(prev => {
      return prev
        .map(i => {
          if (i.productId !== productId) return i;
          const updatedQty = i.quantity + delta;
          if (updatedQty <= 0) return null;
          return { ...i, quantity: updatedQty };
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.productId !== productId));
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    if (confirm('Limpar carrinho?')) setCart([]);
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const total = subtotal;
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  // FINALIZE
  const handleConfirmPayment = async (data: {
    method: 'cash' | 'pix' | 'debit_card' | 'credit_card';
    cashReceived?: number;
    installments?: number;
    customerName?: string;
    customerCpf?: string;
  }) => {
    setSaving(true);
    try {
      const payload = {
        channel: 'pos',
        items: cart.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        customerSnapshot: {
          name: data.customerName || 'Consumidor',
          cpf: data.customerCpf || '',
        },
        payment: {
          method: data.method,
          installments: data.installments || 1,
          cashReceived: data.cashReceived || 0,
        },
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();

      if (result.success) {
        setShowPayment(false);
        setSuccessMessage({
          orderId: result.order._id,
          orderNumber: result.order.orderNumber,
          change: result.order.payment.cashChange || 0,
        });
        setCart([]);
        fetchProducts();
      } else {
        toast.error(result.error || 'Erro ao processar venda');
      }
    } catch {
      toast.error('Erro de rede');
    } finally {
      setSaving(false);
    }
  };

  // Após cadastrar produto rápido, recarrega lista
  const handleProductCreated = () => {
    setShowQuickAdd(false);
    fetchProducts();
    toast.success('Produto disponível no balcão!');
  };

  return (
    <div className='h-screen bg-gray-100 flex flex-col overflow-hidden'>
      {/* HEADER */}
      <header className='bg-[#1A1A1A] text-white px-4 py-3 flex items-center justify-between flex-shrink-0'>
        <div className='flex items-center gap-3'>
          <ShoppingCart size={20} className='text-[#FF6600]' />
          <span className='font-black text-lg tracking-wide'>POS — BALCÃO</span>
        </div>
        <div className='flex items-center gap-4 text-sm'>
          <span className='text-gray-400 font-mono'>{clock}</span>
          <button
            onClick={() => setShowHelp(true)}
            className='flex items-center gap-1.5 text-gray-400 hover:text-white text-xs transition-colors'
            title='Atalhos do POS (?)'
          >
            <Keyboard size={14} />
            Atalhos
          </button>
          <button
            onClick={() => router.push('/admin')}
            className='flex items-center gap-1.5 text-gray-400 hover:text-white text-xs transition-colors'
          >
            <LogOut size={14} />
            Sair do POS
          </button>
        </div>
      </header>

      {/* MAIN */}
      <div className='flex-1 flex overflow-hidden'>
        {/* COLUNA ESQUERDA — Produtos */}
        <div className='flex-1 flex flex-col overflow-hidden'>
          {/* Busca + Cadastro Rápido */}
          <div className='bg-white border-b px-4 py-3 flex-shrink-0 flex gap-2'>
            <div className='relative flex-1'>
              <Search
                size={20}
                className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
              />
              <input
                ref={searchInputRef}
                type='text'
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder='Buscar por nome, SKU ou código de barras... (F2)'
                className='w-full pl-11 pr-12 py-3 text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#FF6600]'
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                >
                  <X size={18} />
                </button>
              )}
              <kbd className='absolute right-12 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded'>
                F2
              </kbd>
            </div>
            <button
              onClick={() => setShowQuickAdd(true)}
              className='flex items-center gap-2 px-4 py-3 bg-[#FF6600] text-white font-bold rounded-lg hover:bg-[#e55b00] transition-colors whitespace-nowrap shadow-md'
              title='Cadastro rápido (F7)'
            >
              <Zap size={18} />
              Novo Produto
              <kbd className='text-[10px] bg-white/20 px-1.5 py-0.5 rounded'>
                F7
              </kbd>
            </button>
          </div>

          {/* Grid de produtos */}
          <div className='flex-1 overflow-y-auto p-4'>
            {loading ? (
              <div className='flex items-center justify-center h-full'>
                <Loader2 size={32} className='animate-spin text-[#FF6600]' />
              </div>
            ) : products.length === 0 ? (
              <div className='flex flex-col items-center justify-center h-full text-gray-400'>
                <Package size={48} className='mb-3 opacity-50' />
                <p>Nenhum produto encontrado</p>
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className='mt-3 text-[#FF6600] hover:underline text-sm'
                  >
                    Limpar busca
                  </button>
                )}
              </div>
            ) : (
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3'>
                {products.map(p => {
                  const outOfStock = p.stock <= 0;
                  return (
                    <button
                      key={p._id}
                      onClick={() => addToCart(p)}
                      disabled={outOfStock}
                      className={`bg-white rounded-lg border-2 p-2 text-left transition-all hover:shadow-md ${
                        outOfStock
                          ? 'opacity-40 cursor-not-allowed border-gray-200'
                          : 'border-gray-200 hover:border-[#FF6600] active:scale-95'
                      }`}
                    >
                      <div className='aspect-square bg-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden'>
                        {p.images[0] ? (
                          <Image
                            src={p.images[0]}
                            alt={p.name}
                            width={150}
                            height={150}
                            className='w-full h-full object-cover'
                          />
                        ) : (
                          <Package size={32} className='text-gray-300' />
                        )}
                      </div>
                      <p className='text-xs font-medium text-gray-900 line-clamp-2 leading-tight min-h-[2.4em]'>
                        {p.name}
                      </p>
                      <p className='text-[10px] text-gray-400 font-mono mt-0.5'>
                        {p.sku}
                      </p>
                      <div className='flex items-center justify-between mt-1.5'>
                        <p className='text-sm font-bold text-gray-900'>
                          {formatPrice(p.price)}
                        </p>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            p.stock === 0
                              ? 'bg-red-100 text-red-600'
                              : p.stock <= 3
                                ? 'bg-orange-100 text-orange-600'
                                : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {p.stock}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* COLUNA DIREITA — Carrinho */}
        <aside className='w-[360px] bg-white border-l flex flex-col flex-shrink-0'>
          <div className='px-4 py-3 border-b flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <ShoppingCart size={18} className='text-[#FF6600]' />
              <h2 className='font-bold'>Carrinho</h2>
              {cart.length > 0 && (
                <span className='text-xs bg-[#FF6600] text-white px-2 py-0.5 rounded-full font-bold'>
                  {totalItems}
                </span>
              )}
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className='text-xs text-gray-400 hover:text-red-600 transition-colors'
              >
                Limpar
              </button>
            )}
          </div>

          <div className='flex-1 overflow-y-auto'>
            {cart.length === 0 ? (
              <div className='flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center'>
                <ShoppingCart size={36} className='mb-3 opacity-30' />
                <p className='text-sm'>Carrinho vazio</p>
                <p className='text-xs mt-1'>
                  Clique nos produtos para adicionar
                </p>
              </div>
            ) : (
              <div className='divide-y'>
                {cart.map(item => (
                  <div key={item.productId} className='p-3 flex gap-3'>
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={48}
                        height={48}
                        className='w-12 h-12 rounded object-cover flex-shrink-0'
                      />
                    ) : (
                      <div className='w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0'>
                        <Package size={16} className='text-gray-400' />
                      </div>
                    )}
                    <div className='flex-1 min-w-0'>
                      <p className='text-xs font-medium text-gray-900 line-clamp-2 leading-tight'>
                        {item.name}
                      </p>
                      <p className='text-[10px] text-gray-400 font-mono'>
                        {formatPrice(item.price)}
                      </p>
                      <div className='flex items-center gap-1.5 mt-1.5'>
                        <button
                          onClick={() => updateQty(item.productId, -1)}
                          className='w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded transition-colors'
                        >
                          <Minus size={12} />
                        </button>
                        <span className='text-sm font-bold w-6 text-center'>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.productId, 1)}
                          className='w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded transition-colors'
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className='ml-auto text-red-500 hover:text-red-700 transition-colors'
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className='text-sm font-bold text-gray-900 whitespace-nowrap'>
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className='border-t bg-gray-50 p-4 space-y-3 flex-shrink-0'>
            <div className='flex justify-between text-sm text-gray-600'>
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className='flex justify-between items-end'>
              <span className='text-sm font-medium text-gray-700'>Total</span>
              <span className='text-2xl font-black text-[#FF6600]'>
                {formatPrice(total)}
              </span>
            </div>
            <button
              onClick={() => setShowPayment(true)}
              disabled={cart.length === 0}
              className='w-full py-4 bg-[#FF6600] text-white font-bold rounded-lg hover:bg-[#e55b00] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-lg shadow-lg'
            >
              Finalizar Venda
              <kbd className='text-[10px] bg-white/20 px-1.5 py-0.5 rounded'>
                F4
              </kbd>
            </button>
          </div>
        </aside>
      </div>

      {/* MODAL PAGAMENTO */}
      {showPayment && (
        <PosPaymentModal
          total={total}
          saving={saving}
          onClose={() => !saving && setShowPayment(false)}
          onConfirm={handleConfirmPayment}
        />
      )}

      {/* MODAL CADASTRO RÁPIDO */}
      {showQuickAdd && (
        <QuickProductModal
          onClose={() => setShowQuickAdd(false)}
          onCreated={handleProductCreated}
        />
      )}
      {/* MODAL ATALHOS */}
      {showHelp && <PosShortcutsHelp onClose={() => setShowHelp(false)} />}

      {/* MODAL SUCESSO */}
      {successMessage && (
        <div className='fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg shadow-2xl max-w-md w-full p-6 text-center'>
            <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Check size={32} className='text-green-600' />
            </div>
            <h2 className='text-2xl font-bold text-gray-900 mb-2'>
              Venda Concluída!
            </h2>
            <p className='text-sm text-gray-500 mb-1'>Pedido</p>
            <p className='font-mono text-lg font-bold text-[#FF6600] mb-4'>
              {successMessage.orderNumber}
            </p>
            {successMessage.change !== undefined &&
              successMessage.change > 0 && (
                <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center justify-between'>
                  <span className='text-sm text-yellow-900 font-medium'>
                    💵 Troco:
                  </span>
                  <span className='text-xl font-bold text-yellow-900 font-mono'>
                    {formatPrice(successMessage.change)}
                  </span>
                </div>
              )}
            <button
              onClick={() => {
                window.open(
                  `/admin/pedidos/${successMessage.orderId}/cupom?format=80mm&autoprint=1`,
                  '_blank',
                );
              }}
              className='w-full mb-3 px-4 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 font-bold flex items-center justify-center gap-2'
            >
              🖨️ Imprimir Cupom 80mm
            </button>
            <div className='flex gap-3'>
              <button
                onClick={() =>
                  router.push(`/admin/pedidos/${successMessage.orderId}`)
                }
                className='flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm'
              >
                Ver detalhes
              </button>
              <button
                onClick={() => {
                  setSuccessMessage(null);
                  searchInputRef.current?.focus();
                }}
                className='flex-1 px-4 py-2 bg-[#FF6600] text-white rounded-md hover:bg-[#e55b00] font-medium'
              >
                Nova Venda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
