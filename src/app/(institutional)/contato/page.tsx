'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, Send, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ContatoPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.message) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    setSending(true);
    // TODO: integrate with email API (Resend/Nodemailer)
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Mensagem enviada com sucesso! Retornaremos em breve.');
    setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    setSending(false);
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
        Estamos prontos para ajudar! Envie sua mensagem ou visite nossa loja.
      </p>

      <div className='grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8'>
        {/* Contact Form */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <h2 className='text-lg font-bold text-gray-900 mb-4'>
            Envie sua Mensagem
          </h2>

          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Nome *
                </label>
                <input
                  type='text'
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder='Seu nome completo'
                  className='w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  E-mail *
                </label>
                <input
                  type='email'
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder='seu@email.com'
                  className='w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Telefone
                </label>
                <input
                  type='tel'
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder='(11) 99999-9999'
                  className='w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Assunto
                </label>
                <select
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  className='w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent bg-white'
                >
                  <option value=''>Selecione um assunto</option>
                  <option value='duvida-produto'>Dúvida sobre produto</option>
                  <option value='status-pedido'>Status do pedido</option>
                  <option value='troca-devolucao'>Troca ou devolução</option>
                  <option value='problema-pagamento'>
                    Problema com pagamento
                  </option>
                  <option value='parceria'>Parceria comercial</option>
                  <option value='elogio'>Elogio</option>
                  <option value='reclamacao'>Reclamação</option>
                  <option value='outro'>Outro assunto</option>
                </select>
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Mensagem *
              </label>
              <textarea
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                required
                rows={5}
                placeholder='Escreva sua mensagem aqui...'
                className='w-full px-4 py-2.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600] focus:border-transparent resize-none'
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
        </div>

        {/* Sidebar — Contact Info */}
        <div className='space-y-6'>
          {/* Quick WhatsApp */}
          <a
            href='https://wa.me/5511947169003?text=Olá! Vim pelo site da Surfers Paradise e gostaria de mais informações.'
            target='_blank'
            rel='noopener noreferrer'
            className='flex items-center gap-3 bg-[#25D366] text-white rounded-lg p-4 hover:bg-[#20bd5a] transition-colors group'
          >
            <MessageCircle size={24} />
            <div>
              <p className='font-bold text-sm'>Atendimento por WhatsApp</p>
              <p className='text-xs opacity-90'>
                (11) 94716-9003 — Resposta rápida!
              </p>
            </div>
          </a>

          {/* Contact Details */}
          <div className='bg-white rounded-lg shadow-sm p-6 space-y-5'>
            <h3 className='font-bold text-gray-900'>Informações de Contato</h3>

            <div className='flex items-start gap-3'>
              <MapPin
                size={18}
                className='text-[#FF6600] mt-0.5 flex-shrink-0'
              />
              <div>
                <p className='text-sm font-medium text-gray-900'>Endereço</p>
                <p className='text-sm text-gray-600'>
                  Alameda dos Maracatins, 1317
                </p>
                <p className='text-sm text-gray-600'>
                  Indianópolis, São Paulo - SP
                </p>
                <p className='text-sm text-gray-600'>CEP: 04089-014</p>
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
                  href='https://wa.me/5511947169003'
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-sm text-gray-600 hover:text-[#FF6600] transition-colors'
                >
                  (11) 94716-9003
                </a>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <Mail size={18} className='text-[#FF6600] mt-0.5 flex-shrink-0' />
              <div>
                <p className='text-sm font-medium text-gray-900'>E-mail</p>
                <a
                  href='mailto:contato@surfersparadise.com.br'
                  className='text-sm text-gray-600 hover:text-[#FF6600] transition-colors'
                >
                  contato@surfersparadise.com.br
                </a>
              </div>
            </div>

            <div className='flex items-start gap-3'>
              <Clock
                size={18}
                className='text-[#FF6600] mt-0.5 flex-shrink-0'
              />
              <div>
                <p className='text-sm font-medium text-gray-900'>Horário</p>
                <p className='text-sm text-gray-600'>Seg a Sex: 10h às 20h</p>
                <p className='text-sm text-gray-600'>Sábado: 10h às 19h</p>
                <p className='text-sm text-gray-600'>Domingo: Fechado</p>
              </div>
            </div>

            {/* Social */}
            <div className='pt-3 border-t border-gray-100'>
              <p className='text-sm font-medium text-gray-900 mb-3'>
                Redes Sociais
              </p>
              <div className='flex items-center gap-3'>
                <a
                  href='https://www.instagram.com/lojasurfersparadiseoficial/'
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
                  href='https://web.facebook.com/lojasurfersparadise/'
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

          {/* Google Maps */}
          <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
            <iframe
              src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3656.8675!2d-46.6658!3d-23.6047!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce5a2b8e7c0001%3A0x0!2sAlameda+dos+Maracatins%2C+1317+-+India%C3%B3polis%2C+S%C3%A3o+Paulo+-+SP!5e0!3m2!1spt-BR!2sbr!4v1'
              width='100%'
              height='250'
              style={{ border: 0 }}
              allowFullScreen
              loading='lazy'
              referrerPolicy='no-referrer-when-downgrade'
              title='Localização Surfers Paradise'
              className='w-full'
            />
          </div>
        </div>
      </div>
    </div>
  );
}
