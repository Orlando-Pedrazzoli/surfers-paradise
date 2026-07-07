// 📄 src/app/(checkout)/checkout/page.tsx
// v2: frete integrado — cotação automática ao completar o CEP (Melhor Envio),
// barra de progresso do frete grátis, 5 opções com seleção obrigatória,
// totais atualizados em tempo real com o frete escolhido.
// v3: userId da sessão passado ao PaymentForm — pedido de cliente logado é
//     vinculado à conta (Meus Pedidos) em vez de entrar como guest.
// v3: nome/e-mail pré-preenchidos para cliente logado.
// v3: CPF validado por dígitos verificadores no client — CPF inválido é
//     barrado aqui, não no antifraude no fim do funil.
// v3: removido disabled morto no botão de continuar.
// v4: onPricesChanged ligado ao updateItemPrices do CartProvider — no 409
//     PRICES_CHANGED o carrinho sincroniza com os preços do banco e o
//     resumo/totais atualizam na hora.
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/context/CartProvider';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatCurrency } from '@/lib/utils/formatCurrency';
import { ShoppingCart, MapPin, Pencil, Loader2, Package } from 'lucide-react';
import PaymentForm from '@/components/checkout/PaymentForm';
import ShippingOptions from '@/components/checkout/ShippingOptions';
import FreeShippingProgress from '@/components/checkout/FreeShippingProgress';
import {
  useShippingQuotes,
  type ShippingQuoteOption,
} from '@/lib/hooks/useShippingQuotes';
import type { PaymentItem } from '@/lib/types/payment';

const onlyDigits = (s: string) => s.replace(/\D/g, '');
const inputCls =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#FF6600]';

const maskCpf = (v: string) =>
  onlyDigits(v)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');

const maskCep = (v: string) =>
  onlyDigits(v)
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2');

const maskPhone = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10) {
    return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  }
  return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
};

/** Validação de CPF por dígitos verificadores (mesma regra do servidor). */
function isValidCpf(raw: string): boolean {
  const cpf = onlyDigits(raw);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  for (const factor of [10, 11]) {
    let sum = 0;
    for (let i = 0; i < factor - 1; i++) {
      sum += parseInt(cpf[i]) * (factor - i);
    }
    const digit = ((sum * 10) % 11) % 10;
    if (digit !== parseInt(cpf[factor - 1])) return false;
  }
  return true;
}

const emptyForm = {
  name: '',
  email: '',
  cpf: '',
  phone: '',
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
};

export default function CheckoutPage() {
  const {
    items,
    subtotal,
    pixTotal,
    total,
    discount,
    appliedCoupon,
    itemCount,
    clearCart,
    updateItemPrices,
  } = useCart();
  // Sessão: vincula o pedido à conta do cliente logado e pré-preenche dados.
  // (Se o shape do useAuth for diferente de { user }, ajustar aqui.)
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [addressDone, setAddressDone] = useState(false);
  const [error, setError] = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [selectedShipping, setSelectedShipping] =
    useState<ShippingQuoteOption | null>(null);

  const set = (k: keyof typeof emptyForm, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  // Pré-preenche nome/e-mail do cliente logado (sem sobrescrever o que ele
  // já digitou).
  useEffect(() => {
    if (!user) return;
    setForm(f => ({
      ...f,
      name: f.name || user.name || '',
      email: f.email || user.email || '',
    }));
  }, [user]);

  // ─── Cotação automática de frete (dispara quando o CEP completa) ───
  // Itens do carrinho podem ter dimensões cadastradas no produto; quando
  // não têm, a API usa o pacote padrão.
  const quoteItems = useMemo(
    () =>
      items.map(i => {
        const dims = i as Partial<{
          weight: number;
          height: number;
          width: number;
          length: number;
        }>;
        return {
          quantity: i.quantity,
          price: i.price,
          weight: dims.weight,
          height: dims.height,
          width: dims.width,
          length: dims.length,
        };
      }),
    [items],
  );

  const {
    quotes,
    loading: quotesLoading,
    error: quotesError,
  } = useShippingQuotes({
    cep: form.cep,
    items: quoteItems,
    subtotal,
  });

  // Se as cotações mudarem (CEP corrigido, carrinho alterado) e a opção
  // selecionada não existir mais, limpa a seleção.
  useEffect(() => {
    if (selectedShipping && !quotes.some(q => q.id === selectedShipping.id)) {
      setSelectedShipping(null);
    }
  }, [quotes, selectedShipping]);

  const shippingCost = selectedShipping?.finalPrice ?? 0;

  async function lookupCep(cep: string) {
    const digits = onlyDigits(cep);
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm(f => ({
          ...f,
          street: data.logradouro || f.street,
          neighborhood: data.bairro || f.neighborhood,
          city: data.localidade || f.city,
          state: data.uf || f.state,
        }));
      }
    } catch {
      /* silencioso */
    } finally {
      setCepLoading(false);
    }
  }

  function validateAddress(): string | null {
    if (form.name.trim().length < 3) return 'Informe seu nome completo.';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      return 'E-mail inválido.';
    if (!isValidCpf(form.cpf)) return 'CPF inválido. Confira os números.';
    if (onlyDigits(form.phone).length < 10) return 'Telefone inválido.';
    if (onlyDigits(form.cep).length !== 8) return 'CEP inválido.';
    if (!form.street.trim()) return 'Informe a rua.';
    if (!form.number.trim()) return 'Informe o número.';
    if (!form.neighborhood.trim()) return 'Informe o bairro.';
    if (!form.city.trim()) return 'Informe a cidade.';
    if (form.state.trim().length !== 2) return 'Informe o estado (UF).';
    return null;
  }

  function handleContinue() {
    const err = validateAddress();
    if (err) {
      setError(err);
      return;
    }
    if (!selectedShipping) {
      setError('Selecione o método de envio no Resumo do Pedido.');
      return;
    }
    setError('');
    setAddressDone(true);
  }

  if (items.length === 0) {
    return (
      <div className='max-w-7xl mx-auto px-4 py-16 text-center'>
        <ShoppingCart size={64} className='mx-auto mb-6 text-gray-200' />
        <h1 className='text-2xl font-bold text-gray-900 mb-2'>
          Seu carrinho está vazio
        </h1>
        <p className='text-gray-500 mb-8'>
          Adicione produtos antes de finalizar a compra
        </p>
        <Link
          href='/produtos'
          className='inline-block px-8 py-3 bg-[#FF6600] text-white font-bold rounded-md hover:bg-[#e55b00] transition-colors'
        >
          Explorar Produtos
        </Link>
      </div>
    );
  }

  const paymentItems: PaymentItem[] = items.map(i => ({
    productId: i.productId,
    sku: i.sku,
    name: i.name,
    slug: i.slug,
    image: i.image,
    variant: [i.color, i.size].filter(Boolean).join(' · '),
    quantity: i.quantity,
    price: i.price,
  }));

  return (
    <div className='max-w-7xl mx-auto px-4 py-6'>
      <nav className='text-sm text-gray-500 mb-6'>
        <Link href='/' className='hover:text-[#FF6600]'>
          Início
        </Link>
        <span className='mx-2'>/</span>
        <Link href='/carrinho' className='hover:text-[#FF6600]'>
          Carrinho
        </Link>
        <span className='mx-2'>/</span>
        <span className='text-gray-700'>Checkout</span>
      </nav>

      <h1 className='text-2xl font-bold text-gray-900 mb-8'>
        Finalizar Compra
      </h1>

      <div className='flex flex-col lg:flex-row gap-8'>
        <div className='flex-1 space-y-6'>
          {/* Endereço / dados */}
          <div className='bg-white rounded-lg shadow-sm p-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-lg font-semibold flex items-center gap-2'>
                <MapPin size={18} /> Dados e Endereço de Entrega
              </h2>
              {addressDone && (
                <button
                  onClick={() => setAddressDone(false)}
                  className='flex items-center gap-1 text-sm text-[#FF6600] hover:underline'
                >
                  <Pencil size={14} /> Editar
                </button>
              )}
            </div>

            {addressDone ? (
              <div className='text-sm text-gray-700 space-y-0.5'>
                <p className='font-medium'>
                  {form.name} · {form.cpf}
                </p>
                <p>
                  {form.street}, {form.number}
                  {form.complement && ` - ${form.complement}`}
                </p>
                <p>
                  {form.neighborhood} · {form.city} - {form.state} · {form.cep}
                </p>
                <p className='text-gray-500'>
                  {form.email} · {form.phone}
                </p>
                {selectedShipping && (
                  <p className='mt-2 flex items-center gap-1.5 text-gray-700'>
                    <Package size={14} className='text-[#FF6600]' />
                    {selectedShipping.company} — {selectedShipping.name} · até{' '}
                    {selectedShipping.deliveryDays} dias úteis ·{' '}
                    {selectedShipping.isFree ? (
                      <span className='font-semibold text-green-600'>
                        Frete grátis
                      </span>
                    ) : (
                      <span className='font-semibold'>
                        {formatCurrency(selectedShipping.finalPrice)}
                      </span>
                    )}
                  </p>
                )}
              </div>
            ) : (
              <div className='space-y-3'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <input
                    className={inputCls}
                    placeholder='Nome completo'
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                  />
                  <input
                    className={inputCls}
                    placeholder='E-mail'
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                  />
                  <input
                    className={inputCls}
                    placeholder='CPF'
                    value={form.cpf}
                    onChange={e => set('cpf', maskCpf(e.target.value))}
                  />
                  <input
                    className={inputCls}
                    placeholder='Celular (WhatsApp)'
                    value={form.phone}
                    onChange={e => set('phone', maskPhone(e.target.value))}
                  />
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                  <div className='relative'>
                    <input
                      className={inputCls}
                      placeholder='CEP'
                      value={form.cep}
                      onChange={e => set('cep', maskCep(e.target.value))}
                      onBlur={e => lookupCep(e.target.value)}
                    />
                    {cepLoading && (
                      <Loader2
                        size={16}
                        className='absolute right-3 top-2.5 animate-spin text-gray-400'
                      />
                    )}
                  </div>
                  <input
                    className={`${inputCls} sm:col-span-2`}
                    placeholder='Rua / Logradouro'
                    value={form.street}
                    onChange={e => set('street', e.target.value)}
                  />
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                  <input
                    className={inputCls}
                    placeholder='Número'
                    value={form.number}
                    onChange={e => set('number', e.target.value)}
                  />
                  <input
                    className={inputCls}
                    placeholder='Complemento (opcional)'
                    value={form.complement}
                    onChange={e => set('complement', e.target.value)}
                  />
                  <input
                    className={inputCls}
                    placeholder='Bairro'
                    value={form.neighborhood}
                    onChange={e => set('neighborhood', e.target.value)}
                  />
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
                  <input
                    className={`${inputCls} sm:col-span-2`}
                    placeholder='Cidade'
                    value={form.city}
                    onChange={e => set('city', e.target.value)}
                  />
                  <input
                    className={inputCls}
                    placeholder='UF'
                    maxLength={2}
                    value={form.state}
                    onChange={e => set('state', e.target.value.toUpperCase())}
                  />
                </div>

                {error && (
                  <p className='rounded-md bg-red-50 px-3 py-2 text-sm text-red-600'>
                    {error}
                  </p>
                )}

                <button
                  onClick={handleContinue}
                  className='w-full rounded-md bg-[#FF6600] px-4 py-3 font-bold text-white transition-colors hover:bg-[#e55b00]'
                >
                  Continuar para pagamento
                </button>
                {onlyDigits(form.cep).length === 8 && !selectedShipping && (
                  <p className='text-center text-xs text-gray-500'>
                    👉 Selecione o método de envio no Resumo do Pedido
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Pagamento */}
          <div className='bg-white rounded-lg shadow-sm p-6'>
            <h2 className='text-lg font-semibold mb-4'>Forma de Pagamento</h2>
            {addressDone && selectedShipping ? (
              <PaymentForm
                customer={{
                  name: form.name,
                  email: form.email,
                  document: form.cpf,
                  phone: form.phone,
                }}
                shippingAddress={{
                  name: form.name,
                  street: form.street,
                  number: form.number,
                  complement: form.complement,
                  neighborhood: form.neighborhood,
                  city: form.city,
                  state: form.state,
                  cep: form.cep,
                  phone: form.phone,
                  cpf: form.cpf,
                }}
                items={paymentItems}
                subtotal={subtotal}
                shippingCost={shippingCost}
                shipping={{
                  method: selectedShipping.name,
                  carrier: selectedShipping.company,
                  estimatedDays: selectedShipping.deliveryDays,
                }}
                coupon={appliedCoupon?.code}
                couponDiscount={discount}
                userId={user?.id}
                onOrderCreated={clearCart}
                onPricesChanged={updateItemPrices}
              />
            ) : (
              <p className='text-sm text-gray-500'>
                Preencha seus dados e selecione o envio para escolher a forma de
                pagamento.
              </p>
            )}
          </div>
        </div>

        {/* Resumo */}
        <div className='w-full lg:w-[360px] flex-shrink-0'>
          <div className='bg-gray-50 rounded-lg p-6 sticky top-24 space-y-4'>
            <h2 className='text-lg font-bold text-gray-900'>
              Resumo do Pedido
            </h2>

            <div className='divide-y divide-gray-200'>
              {items.map(item => (
                <div
                  key={item.productId}
                  className='flex items-center gap-3 py-3'
                >
                  <div className='w-12 h-12 bg-gray-100 rounded flex-shrink-0 overflow-hidden'>
                    {item.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt={item.name}
                        className='h-full w-full object-cover'
                      />
                    )}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm text-gray-900 line-clamp-1'>
                      {item.name}
                    </p>
                    <p className='text-xs text-gray-500'>
                      Qtd: {item.quantity}
                    </p>
                  </div>
                  <p className='text-sm font-medium text-gray-900'>
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            {/* Frete grátis: barra de progresso */}
            <FreeShippingProgress subtotal={subtotal} />

            {/* Opções de envio (aparecem quando o CEP completa) */}
            <div>
              <h3 className='mb-2 text-sm font-semibold text-gray-900'>
                Método de envio
              </h3>
              <ShippingOptions
                options={quotes}
                loading={quotesLoading}
                error={quotesError}
                selectedId={selectedShipping?.id}
                onSelect={setSelectedShipping}
              />
            </div>

            <div className='border-t border-gray-200 pt-4 space-y-2'>
              <div className='flex justify-between text-sm'>
                <span className='text-gray-600'>
                  Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'itens'})
                </span>
                <span className='font-medium'>{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>
                    Desconto {appliedCoupon ? `(${appliedCoupon.code})` : ''}
                  </span>
                  <span className='text-green-600'>
                    - {formatCurrency(discount)}
                  </span>
                </div>
              )}
              <div className='flex justify-between text-sm'>
                <span className='text-gray-600'>Frete</span>
                {selectedShipping ? (
                  selectedShipping.isFree ? (
                    <span className='font-medium text-green-600'>Grátis</span>
                  ) : (
                    <span className='font-medium'>
                      {formatCurrency(shippingCost)}
                    </span>
                  )
                ) : (
                  <span className='text-gray-400'>
                    {onlyDigits(form.cep).length === 8
                      ? 'Selecione acima'
                      : 'Informe o CEP'}
                  </span>
                )}
              </div>
            </div>

            <div className='border-t border-gray-200 pt-4'>
              <div className='flex justify-between items-center'>
                <span className='text-base font-bold'>Total</span>
                <span className='text-xl font-black'>
                  {formatCurrency(total + shippingCost)}
                </span>
              </div>
              <div className='flex justify-between items-center mt-1'>
                <span className='text-sm text-[#FF6600] font-medium'>
                  No PIX / Boleto
                </span>
                <span className='text-lg font-black text-[#FF6600]'>
                  {formatCurrency(pixTotal + shippingCost)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
