// 📄 src/lib/context/WishlistProvider.tsx
// Lista de desejos global. Melhores práticas aplicadas:
//   • GUEST-FIRST: funciona sem conta (ids no localStorage) — não gatear a
//     lista atrás de login é a recomendação nº 1 dos estudos de UX;
//   • SYNC NO LOGIN: quando a sessão autentica, faz UMA vez o merge
//     (PUT /api/wishlist com os ids locais) e adota a união devolvida pelo
//     servidor — a lista sobrevive a troca de dispositivo;
//   • OPTIMISTIC UI: o coração responde na hora; a persistência remota roda
//     em background e, se falhar, o estado reverte com aviso;
//   • FONTE ÚNICA: ProductCard, página do produto, navbar e página da lista
//     leem todos deste contexto — nada de useState local órfão.
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
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'surfers-paradise-wishlist';

interface WishlistContextType {
  /** productIds na lista (mais recente primeiro) */
  ids: string[];
  count: number;
  isInWishlist: (productId: string) => boolean;
  /** Alterna o produto na lista. Retorna true se ADICIONOU. */
  toggleWishlist: (productId: string, productName?: string) => boolean;
  /** true depois de carregar o localStorage (evita flash de coração vazio) */
  hydrated: boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined,
);

function readLocal(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === 'string')
      : [];
  } catch {
    return [];
  }
}

function writeLocal(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // storage cheio/indisponível: segue só em memória
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const syncedRef = useRef(false);
  // Espelho dos ids para o "Desfazer" do toast: o callback do toast roda
  // depois do render e não pode confiar no closure de ids (estaria stale).
  const idsRef = useRef<string[]>([]);
  useEffect(() => {
    idsRef.current = ids;
  }, [ids]);

  // 1) Hidrata do localStorage (guest e logado começam daqui).
  // setIds só quando há algo salvo (mesmo padrão do CartProvider) —
  // evita re-render em cascata apontado pelo lint do React.
  useEffect(() => {
    const stored = readLocal();
    // Hidratação ÚNICA no mount (deps []): não há cascata possível — o
    // efeito nunca re-executa. Mesmo padrão do CartProvider (localStorage
    // é sistema externo; a leitura só pode acontecer no client, pós-mount).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratação única de sistema externo no mount
    if (stored.length > 0) setIds(stored);
    setHydrated(true);
  }, []);

  // 2) Persiste toda mudança no localStorage
  useEffect(() => {
    if (hydrated) writeLocal(ids);
  }, [ids, hydrated]);

  // 3) Login: merge única (local ∪ servidor) e adota o resultado
  useEffect(() => {
    if (status !== 'authenticated' || !hydrated || syncedRef.current) return;
    syncedRef.current = true;
    (async () => {
      try {
        const res = await fetch('/api/wishlist', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds: readLocal() }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success && Array.isArray(data.productIds)) {
          setIds(data.productIds);
        }
      } catch {
        // sem rede: mantém a lista local; próximo login tenta de novo
        syncedRef.current = false;
      }
    })();
  }, [status, hydrated]);

  // Logout: volta a operar como guest (mantém a lista local por conveniência)
  useEffect(() => {
    if (status === 'unauthenticated') syncedRef.current = false;
  }, [status]);

  const isInWishlist = useCallback(
    (productId: string) => ids.includes(productId),
    [ids],
  );

  const toggleWishlist = useCallback(
    (productId: string, productName?: string): boolean => {
      // idsRef (não o closure de ids): permite chamar com segurança a partir
      // de callbacks tardios, como o botão "Desfazer" do toast.
      const adding = !idsRef.current.includes(productId);

      // Optimistic: UI responde imediatamente
      setIds(prev =>
        adding ? [productId, ...prev] : prev.filter(id => id !== productId),
      );

      if (adding) {
        toast.success(
          `${productName || 'Produto'} adicionado à lista de desejos ❤️`,
        );
      } else {
        // Remoção com DESFAZER: rede de segurança contra clique acidental
        toast(
          t => (
            <span className='flex items-center gap-3'>
              <span>{productName || 'Produto'} removido da lista</span>
              <button
                type='button'
                onClick={() => {
                  // Undo inline: re-adiciona sem recursão nem refs de função
                  toast.dismiss(t.id);
                  setIds(prev =>
                    prev.includes(productId) ? prev : [productId, ...prev],
                  );
                  toast.success(
                    `${productName || 'Produto'} de volta à lista ❤️`,
                  );
                  if (status === 'authenticated') {
                    fetch('/api/wishlist', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ productId }),
                    }).catch(() => {});
                  }
                }}
                className='font-bold text-[#FF6600] hover:underline whitespace-nowrap'
              >
                Desfazer
              </button>
            </span>
          ),
          { duration: 5000 },
        );
      }

      // Persistência remota em background (só logado); reverte se falhar
      if (status === 'authenticated') {
        const req = adding
          ? fetch('/api/wishlist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productId }),
            })
          : fetch(`/api/wishlist?productId=${productId}`, {
              method: 'DELETE',
            });
        req
          .then(res => {
            if (!res.ok) throw new Error(String(res.status));
          })
          .catch(() => {
            setIds(prev =>
              adding
                ? prev.filter(id => id !== productId)
                : [productId, ...prev],
            );
            toast.error('Não foi possível salvar. Tente novamente.');
          });
      }

      return adding;
    },
    [status],
  );

  return (
    <WishlistContext.Provider
      value={{
        ids,
        count: ids.length,
        isInWishlist,
        toggleWishlist,
        hydrated,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error('useWishlist deve ser usado dentro de WishlistProvider');
  }
  return ctx;
}
