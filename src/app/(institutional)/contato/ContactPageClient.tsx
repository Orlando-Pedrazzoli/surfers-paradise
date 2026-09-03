// 📄 src/app/(institutional)/contato/ContactPageClient.tsx
// v2: FORMULÁRIO REAL — o v1 tinha um setTimeout fake (TODO nunca ligado);
//     agora envia via POST /api/contact (Resend → e-mail da loja, com
//     auto-resposta ao cliente). Melhores práticas aplicadas:
//     • split: formulário + canais/mapa lado a lado (loja física);
//     • formulário curto: só nome/e-mail/mensagem obrigatórios; telefone,
//       assunto e nº do pedido opcionais (nº só aparece quando o assunto
//       é sobre pedido/troca);
//     • expectativa clara de resposta (1 dia útil) em vez de "em breve";
//     • honeypot invisível anti-spam;
//     • estado de SUCESSO substitui o formulário (confirmação forte);
//     • dados/canais vêm TODOS de company.ts (nada hardcoded — o v1
//       exibia um e-mail que não é o da loja);
//     • mapa via embed padrão do Google por ENDEREÇO (q=...&output=embed,
//       sem API key) — o v1 tinha um pb= com place-id inventado;
//     • WhatsApp em destaque + telefone/e-mail clicáveis.
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  MessageCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { company, getFormattedAddress } from '@/lib/config/company';

const SUBJECTS = [
  'Dúvida sobre produto',
  'Status do pedido',
  'Troca ou devolução',
  'Problema com pagamento',
  'Parceria comercial',
  'Elogio',
  'Reclamação',
  'Outro assunto',
];

const ORDER_SUBJECTS = new Set([
  'Status do pedido',
  'Troca ou devolução',
  'Problema com pagamento',
]);

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  orderNumber: '',
  message: '',
  website: '', // honeypot — humanos nunca veem/preenchem
};

// Embed oficial por endereço (sem API key): confiável e sempre no lugar certo
const mapsQuery = encodeURIComponent(
  `${company.name}, ${company.address.street}, ${company.address.number} - ${company.address.neighborhood}, ${company.address.city} - ${company.address.state}, ${company.address.cep}`,
);
const MAP_EMBED_URL = `https://maps.google.com/maps?q=${mapsQuery}&z=16&hl=pt-BR&output=embed`;
const MAP_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}`;

const inputCls =
  'w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent';

export default function ContatoPage() {
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (key: keyof typeof emptyForm, value: string) =>
    setForm(f => ({ ...f, [key]: value }));

  const showOrderField = ORDER_SUBJECTS.has(form.subject);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.name.trim().length < 3) {
      toast.error('Informe seu nome completo.');
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      toast.error('E-mail inválido.');
      return;
    }
    if (form.message.trim().length < 10) {
      toast.error('Escreva sua mensagem (mínimo 10 caracteres).');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setSent(true);
        toast.success('Mensagem enviada com sucesso!');
      } else {
        toast.error(
          data.error ||
            'Não foi possível enviar. Tente novamente ou chame no WhatsApp.',
        );
      }
    } catch {
      toast.error('Falha de conexão. Tente novamente ou chame no WhatsApp.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className='max-w-6xl mx-auto px-4 py-10'>
      <nav className='text-sm text-gray-500 mb-8'>
        <Link href='/' className='hover:text-[#FF6600]'>
          Início
        </Link>
        <span className='mx-2'>/</span>
        <span className='text-gray-700'>Fale Conosco</span>
      </nav>

      <h1 className='text-3xl font-black text-gray-900 mb-2'>Fale Conosco</h1>
      <p className='text-gray-500 mb-8'>
        Estamos prontos para ajudar! Envie sua mensagem ou visite nossa loja em{' '}
        {company.address.city}.
      </p>

      <div className='grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8'>
        {/* ═══ FORMULÁRIO ═══ */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          {sent ? (
            <div className='py-12 text-center'>
              <CheckCircle2
                size={52}
                className='mx-auto mb-4 text-green-500'
                aria-hidden='true'
              />
              <h2 className='text-xl font-bold text-gray-900 mb-2'>
                Mensagem enviada! 🤙
              </h2>
              <p className='text-gray-600 text-sm max-w-md mx-auto mb-1'>
                Recebemos sua mensagem e enviamos uma confirmação para{' '}
                <strong>{form.email}</strong>.
              </p>
              <p className='text-gray-600 text-sm max-w-md mx-auto mb-6'>
                Respondemos em até <strong>1 dia útil</strong>. Precisa de algo
                urgente? Chama no WhatsApp.
              </p>
              <div className='flex flex-col sm:flex-row items-center justify-center gap-3'>
                <a
                  href={`https://wa.me/${company.whatsapp}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='inline-flex items-center gap-2 px-6 py-2.5 bg-[#25D366] text-white text-sm font-bold rounded-md hover:bg-[#20bd5a] transition-colors'
                >
                  <MessageCircle size={16} />
                  WhatsApp
                </a>
                <button
                  type='button'
                  onClick={() => {
                    setForm(emptyForm);
                    setSent(false);
                  }}
                  className='inline-flex items-center gap-2 px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:border-[#FF6600] hover:text-[#FF6600] transition-colors'
                >
                  Enviar outra mensagem
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className='text-lg font-bold text-gray-900 mb-1'>
                Envie sua Mensagem
              </h2>
              <p className='text-xs text-gray-500 mb-4'>
                Respondemos em até <strong>1 dia útil</strong>, no horário de
                atendimento da loja.
              </p>

              <form onSubmit={handleSubmit} className='space-y-4'>
                {/* Honeypot anti-spam: invisível para humanos */}
                <div className='hidden' aria-hidden='true'>
                  <label htmlFor='website'>Não preencha este campo</label>
                  <input
                    id='website'
                    type='text'
                    tabIndex={-1}
                    autoComplete='off'
                    value={form.website}
                    onChange={e => set('website', e.target.value)}
                  />
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div>
                    <label
                      htmlFor='contact-name'
                      className='block text-sm font-medium text-gray-700 mb-1'
                    >
                      Nome *
                    </label>
                    <input
                      id='contact-name'
                      type='text'
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      required
                      maxLength={100}
                      autoComplete='name'
                      placeholder='Seu nome completo'
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor='contact-email'
                      className='block text-sm font-medium text-gray-700 mb-1'
                    >
                      E-mail *
                    </label>
                    <input
                      id='contact-email'
                      type='email'
                      value={form.email}
                      onChange={e => set('email', e.target.value)}
                      required
                      maxLength={200}
                      autoComplete='email'
                      placeholder='seu@email.com'
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div>
                    <label
                      htmlFor='contact-phone'
                      className='block text-sm font-medium text-gray-700 mb-1'
                    >
                      WhatsApp{' '}
                      <span className='text-gray-400 font-normal'>
                        (opcional)
                      </span>
                    </label>
                    <input
                      id='contact-phone'
                      type='tel'
                      value={form.phone}
                      onChange={e => set('phone', e.target.value)}
                      maxLength={30}
                      autoComplete='tel'
                      placeholder='(11) 99999-9999'
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor='contact-subject'
                      className='block text-sm font-medium text-gray-700 mb-1'
                    >
                      Assunto{' '}
                      <span className='text-gray-400 font-normal'>
                        (opcional)
                      </span>
                    </label>
                    <select
                      id='contact-subject'
                      value={form.subject}
                      onChange={e => set('subject', e.target.value)}
                      className={`${inputCls} bg-white`}
                    >
                      <option value=''>Selecione um assunto</option>
                      {SUBJECTS.map(s => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {showOrderField && (
                  <div>
                    <label
                      htmlFor='contact-order'
                      className='block text-sm font-medium text-gray-700 mb-1'
                    >
                      Número do pedido{' '}
                      <span className='text-gray-400 font-normal'>
                        (se tiver, agiliza muito!)
                      </span>
                    </label>
                    <input
                      id='contact-order'
                      type='text'
                      value={form.orderNumber}
                      onChange={e => set('orderNumber', e.target.value)}
                      maxLength={40}
                      placeholder='Ex: SP260901-1234'
                      className={inputCls}
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor='contact-message'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Mensagem *
                  </label>
                  <textarea
                    id='contact-message'
                    value={form.message}
                    onChange={e => set('message', e.target.value)}
                    required
                    rows={5}
                    maxLength={3000}
                    placeholder='Escreva sua mensagem aqui...'
                    className={`${inputCls} resize-none`}
                  />
                </div>

                <button
                  type='submit'
                  disabled={sending}
                  className='w-full sm:w-auto px-8 py-3 bg-[#FF6600] text-white font-bold text-sm rounded-md hover:bg-[#e55b00] disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2'
                >
                  <Send size={16} />
                  {sending ? 'Enviando...' : 'Enviar Mensagem'}
                </button>
              </form>
            </>
          )}
        </div>

        {/* ═══ CANAIS + MAPA ═══ */}
        <div className='space-y-6'>
          {/* WhatsApp em destaque */}
          <a
            href={`https://wa.me/${company.whatsapp}?text=${encodeURIComponent('Olá! Vim pelo site da Surfers Paradise e gostaria de mais informações.')}`}
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center gap-3 bg-[#25D366] text-white rounded-lg p-4 hover:bg-[#20bd5a] transition-colors'
          >
            <MessageCircle size={24} />
            <div>
              <p className='font-bold text-sm'>Atendimento por WhatsApp</p>
              <p className='text-xs opacity-90'>
                {company.phone} — Resposta rápida!
              </p>
            </div>
          </a>

          {/* Informações de contato (fonte única: company.ts) */}
          <div className='bg-white rounded-lg shadow-sm p-6 space-y-5'>
            <h3 className='font-bold text-gray-900'>Informações de Contato</h3>

            <div className='flex items-start gap-3'>
              <MapPin
                size={18}
                className='text-[#FF6600] mt-0.5 flex-shrink-0'
              />
              <div>
                <p className='text-sm font-medium text-gray-900'>Loja Física</p>
                <p className='text-sm text-gray-600'>
                  {company.address.street}, {company.address.number}
                </p>
                <p className='text-sm text-gray-600'>
                  {company.address.neighborhood}, {company.address.city} -{' '}
                  {company.address.state}
                </p>
                <p className='text-sm text-gray-600'>
                  CEP: {company.address.cep}
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <Phone
                size={18}
                className='text-[#FF6600] mt-0.5 flex-shrink-0'
              />
              <div>
                <p className='text-sm font-medium text-gray-900'>
                  Telefone / WhatsApp
                </p>
                <a
                  href={`https://wa.me/${company.whatsapp}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-sm text-gray-600 hover:text-[#FF6600] transition-colors'
                >
                  {company.phone}
                </a>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <Mail size={18} className='text-[#FF6600] mt-0.5 flex-shrink-0' />
              <div>
                <p className='text-sm font-medium text-gray-900'>E-mail</p>
                <a
                  href={`mailto:${company.email}`}
                  className='text-sm text-gray-600 hover:text-[#FF6600] transition-colors break-all'
                >
                  {company.email}
                </a>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <Clock
                size={18}
                className='text-[#FF6600] mt-0.5 flex-shrink-0'
              />
              <div>
                <p className='text-sm font-medium text-gray-900'>
                  Horário de Atendimento
                </p>
                {company.businessHours.split('|').map(line => (
                  <p key={line} className='text-sm text-gray-600'>
                    {line.trim()}
                  </p>
                ))}
              </div>
            </div>

            {/* Redes sociais */}
            <div className='pt-3 border-t border-gray-100'>
              <p className='text-sm font-medium text-gray-900 mb-3'>
                Redes Sociais
              </p>
              <div className='flex items-center gap-3'>
                <a
                  href={company.social.instagram}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-[#FF6600] hover:scale-110 transition-all duration-300 group'
                  aria-label='Instagram'
                >
                  <svg
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='none'
                    className='text-gray-500 group-hover:text-white transition-colors duration-300'
                  >
                    <rect
                      x='2'
                      y='2'
                      width='20'
                      height='20'
                      rx='5'
                      stroke='currentColor'
                      strokeWidth='2'
                    />
                    <circle
                      cx='12'
                      cy='12'
                      r='5'
                      stroke='currentColor'
                      strokeWidth='2'
                    />
                    <circle cx='18' cy='6' r='1.5' fill='currentColor' />
                  </svg>
                </a>
                <a
                  href={company.social.facebook}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-[#FF6600] hover:scale-110 transition-all duration-300 group'
                  aria-label='Facebook'
                >
                  <svg
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='currentColor'
                    className='text-gray-500 group-hover:text-white transition-colors duration-300'
                  >
                    <path d='M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z' />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Mapa da loja (embed padrão do Google por endereço — sem API key) */}
          <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
            <iframe
              src={MAP_EMBED_URL}
              width='100%'
              height='280'
              style={{ border: 0 }}
              allowFullScreen
              loading='lazy'
              referrerPolicy='no-referrer-when-downgrade'
              title={`Mapa — como chegar na ${company.name}`}
              className='w-full'
            />
            <a
              href={MAP_DIRECTIONS_URL}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center justify-center gap-2 py-3 text-sm font-medium text-[#FF6600] hover:bg-orange-50 transition-colors border-t border-gray-100'
            >
              <ExternalLink size={14} />
              Como chegar (Google Maps)
            </a>
          </div>

          <p className='text-xs text-gray-400 text-center'>
            {getFormattedAddress()}
          </p>
        </div>
      </div>
    </div>
  );
}
