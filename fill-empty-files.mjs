// ============================================================
// Surfers Paradise - Fill Empty Files for Vercel Deploy
// Run: node fill-empty-files.mjs
// ============================================================
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';

function writeFile(path, content) {
  const full = join(process.cwd(), path);
  const dir = dirname(full);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(full, content, 'utf8');
  console.log(`  ✓ ${path}`);
}

const files = {};

// ============================================================
// 1. UI COMPONENTS
// ============================================================

files['src/components/ui/Badge.tsx'] = `import { cn } from '@/lib/utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const variants = {
  default: 'bg-gray-100 text-gray-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
};

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}
`;

files['src/components/ui/Breadcrumb.tsx'] = `import Link from 'next/link';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
      <ol className="flex items-center gap-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            {i > 0 && <span>/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-gray-900">{item.label}</Link>
            ) : (
              <span className="text-gray-900 font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
`;

files['src/components/ui/Button.tsx'] = `import { cn } from '@/lib/utils/cn';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variants = {
  primary: 'bg-[#FF6600] text-white hover:bg-[#e55b00]',
  secondary: 'bg-[#1A1A1A] text-white hover:bg-black',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
  ghost: 'text-gray-700 hover:bg-gray-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6600]/50 disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
export default Button;
`;

files['src/components/ui/Input.tsx'] = `import { cn } from '@/lib/utils/cn';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
        <input
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#FF6600]/50',
            error ? 'border-red-500' : 'border-gray-300',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
export default Input;
`;

files['src/components/ui/LoadingSpinner.tsx'] = `import { cn } from '@/lib/utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' };

export default function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div className={cn('animate-spin rounded-full border-2 border-gray-200 border-t-[#FF6600]', sizes[size], className)} />
  );
}
`;

files['src/components/ui/Modal.tsx'] = `'use client';
import { useEffect, useRef } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={(e) => e.target === overlayRef.current && onClose()}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {title && (
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
`;

files['src/components/ui/Pagination.tsx'] = `'use client';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1} className="px-3 py-1 rounded border text-sm disabled:opacity-50 hover:bg-gray-50">Anterior</button>
      <span className="text-sm text-gray-600">P\\u00e1gina {currentPage} de {totalPages}</span>
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} className="px-3 py-1 rounded border text-sm disabled:opacity-50 hover:bg-gray-50">Pr\\u00f3xima</button>
    </div>
  );
}
`;

files['src/components/ui/PriceDisplay.tsx'] = `import { cn } from '@/lib/utils/cn';
import { formatCurrency } from '@/lib/utils/formatCurrency';

interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  className?: string;
}

export default function PriceDisplay({ price, originalPrice, className }: PriceDisplayProps) {
  const hasDiscount = originalPrice && originalPrice > price;
  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <span className="text-xl font-bold text-gray-900">{formatCurrency(price)}</span>
      {hasDiscount && <span className="text-sm text-gray-500 line-through">{formatCurrency(originalPrice)}</span>}
    </div>
  );
}
`;

files['src/components/ui/Rating.tsx'] = `interface RatingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md';
  showValue?: boolean;
}

export default function Rating({ value, max = 5, size = 'md', showValue = false }: RatingProps) {
  const starSize = size === 'sm' ? 'text-sm' : 'text-lg';
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={\`\${starSize} \${i < Math.round(value) ? 'text-yellow-400' : 'text-gray-300'}\`}>&#9733;</span>
      ))}
      {showValue && <span className="ml-1 text-sm text-gray-600">{value.toFixed(1)}</span>}
    </div>
  );
}
`;

files['src/components/ui/Select.tsx'] = `import { cn } from '@/lib/utils/cn';
import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, options, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
        <select
          ref={ref}
          id={id}
          className={cn('w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]/50', error ? 'border-red-500' : 'border-gray-300', className)}
          {...props}
        >
          {options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';
export default Select;
`;

files['src/components/ui/Skeleton.tsx'] = `import { cn } from '@/lib/utils/cn';

interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded bg-gray-200', className)} />;
}
`;

files['src/components/ui/Toast.tsx'] = `'use client';
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
}

const colors = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-[#FF6600]',
};

export default function Toast({ message, type = 'info', isVisible, onClose }: ToastProps) {
  useEffect(() => {
    if (isVisible) { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className={\`fixed bottom-4 right-4 z-50 \${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3\`}>
      <span className="text-sm">{message}</span>
      <button onClick={onClose} className="text-white/80 hover:text-white">&times;</button>
    </div>
  );
}
`;

// ============================================================
// 2. UTILS
// ============================================================

files['src/lib/utils/disposableEmails.ts'] = `const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.email',
  'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
  'dispostable.com', 'trashmail.com', 'maildrop.cc', 'temp-mail.org',
];

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return DISPOSABLE_DOMAINS.includes(domain);
}

export { DISPOSABLE_DOMAINS };
`;

files['src/lib/utils/formatDate.ts'] = `export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
}

export function formatRelativeDate(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return \`\${minutes}min atr\\u00e1s\`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return \`\${hours}h atr\\u00e1s\`;
  const days = Math.floor(hours / 24);
  if (days < 30) return \`\${days}d atr\\u00e1s\`;
  return formatDate(date);
}
`;

files['src/lib/utils/pixUtils.ts'] = `export function generatePixPayload(params: {
  key: string;
  name: string;
  city: string;
  amount: number;
  txid?: string;
}): string {
  // TODO: Implement full EMV QR code generation
  return \`PIX:\${params.key}:\${params.amount}\`;
}

export function formatPixKey(key: string, type: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random'): string {
  return key;
}
`;

files['src/lib/utils/slugify.ts'] = `export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
`;

files['src/lib/utils/validators.ts'] = `export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\\D/g, '');
  if (cleaned.length !== 11 || /^(\\d)\\1+$/.test(cleaned)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (parseInt(cleaned[9]) !== check) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  return parseInt(cleaned[10]) === check;
}

export function isValidCEP(cep: string): boolean {
  return /^\\d{5}-?\\d{3}$/.test(cep);
}

export function isValidEmail(email: string): boolean {
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
}

export function formatCPF(cpf: string): string {
  const c = cpf.replace(/\\D/g, '');
  return c.replace(/(\\d{3})(\\d{3})(\\d{3})(\\d{2})/, '$1.$2.$3-$4');
}

export function formatCEP(cep: string): string {
  const c = cep.replace(/\\D/g, '');
  return c.replace(/(\\d{5})(\\d{3})/, '$1-$2');
}

export function formatPhone(phone: string): string {
  const c = phone.replace(/\\D/g, '');
  if (c.length === 11) return c.replace(/(\\d{2})(\\d{5})(\\d{4})/, '($1) $2-$3');
  return c.replace(/(\\d{2})(\\d{4})(\\d{4})/, '($1) $2-$3');
}
`;

// ============================================================
// 3. HOOKS
// ============================================================

files['src/lib/hooks/useAuth.ts'] = `'use client';
import { useSession } from 'next-auth/react';

export function useAuth() {
  const { data: session, status } = useSession();
  return {
    user: session?.user ?? null,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    status,
  };
}
`;

files['src/lib/hooks/useDebounce.ts'] = `'use client';
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}
`;

files['src/lib/hooks/useMediaQuery.ts'] = `'use client';
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);
  return matches;
}
`;

files['src/lib/hooks/useMetaPixel.ts'] = `'use client';

export function useMetaPixel() {
  const track = (event: string, params?: Record<string, unknown>) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', event, params);
    }
  };

  return {
    trackPageView: () => track('PageView'),
    trackViewContent: (params: { content_name: string; content_ids: string[]; value: number }) => track('ViewContent', params),
    trackAddToCart: (params: { content_ids: string[]; value: number; currency?: string }) => track('AddToCart', { currency: 'BRL', ...params }),
    trackPurchase: (params: { value: number; content_ids: string[] }) => track('Purchase', { currency: 'BRL', ...params }),
    trackSearch: (query: string) => track('Search', { search_string: query }),
  };
}
`;

// ============================================================
// 4. SERVICES
// ============================================================

files['src/lib/services/email.ts'] = `interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams): Promise<boolean> {
  // TODO: Implement with Resend or Nodemailer
  console.log(\`[Email Stub] To: \${to}, Subject: \${subject}\`);
  return true;
}

export async function sendOtpEmail(to: string, code: string): Promise<boolean> {
  return sendEmail({ to, subject: 'Codigo de Verificacao - Surfers Paradise', html: \`<p>Seu codigo: <strong>\${code}</strong></p>\` });
}

export async function sendOrderConfirmation(to: string, orderId: string): Promise<boolean> {
  return sendEmail({ to, subject: \`Pedido Confirmado #\${orderId} - Surfers Paradise\`, html: \`<p>Seu pedido #\${orderId} foi confirmado!</p>\` });
}
`;

files['src/lib/services/fraudProtection.ts'] = `import { isDisposableEmail } from '@/lib/utils/disposableEmails';

interface FraudCheckResult {
  passed: boolean;
  reason?: string;
}

export async function checkFraud(params: {
  email: string;
  ip?: string;
  cpf?: string;
  amount: number;
}): Promise<FraudCheckResult> {
  if (isDisposableEmail(params.email)) {
    return { passed: false, reason: 'E-mail descartavel nao permitido' };
  }
  // TODO: Add more fraud checks
  return { passed: true };
}
`;

files['src/lib/services/melhorEnvio.ts'] = `interface ShippingQuote {
  id: number;
  name: string;
  price: number;
  deliveryDays: number;
  company: string;
}

interface ShippingParams {
  cepOrigem: string;
  cepDestino: string;
  weight: number;
  height: number;
  width: number;
  length: number;
}

export async function calculateShipping(params: ShippingParams): Promise<ShippingQuote[]> {
  // TODO: Integrate with Melhor Envio API
  console.log('[Melhor Envio Stub] Calculating shipping for CEP:', params.cepDestino);
  return [
    { id: 1, name: 'PAC', price: 25.90, deliveryDays: 8, company: 'Correios' },
    { id: 2, name: 'SEDEX', price: 45.90, deliveryDays: 3, company: 'Correios' },
  ];
}

export async function generateLabel(shipmentId: string): Promise<string | null> {
  // TODO: Implement label generation
  console.log('[Melhor Envio Stub] Generating label for:', shipmentId);
  return null;
}
`;

files['src/lib/services/otp.ts'] = `export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createOtp(email: string): Promise<string> {
  const code = generateOtpCode();
  // TODO: Store OTP in database with expiry
  console.log(\`[OTP Stub] Code for \${email}: \${code}\`);
  return code;
}

export async function verifyOtp(email: string, code: string): Promise<boolean> {
  // TODO: Verify against database
  console.log(\`[OTP Stub] Verifying \${code} for \${email}\`);
  return false;
}
`;

files['src/lib/services/pagarme.ts'] = `interface PagarmeOrderParams {
  amount: number;
  customerId: string;
  paymentMethod: 'credit_card' | 'boleto' | 'pix';
  items: Array<{ name: string; quantity: number; amount: number }>;
}

interface PagarmeOrderResult {
  id: string;
  status: string;
  charges: Array<{ id: string; status: string }>;
}

export async function createOrder(params: PagarmeOrderParams): Promise<PagarmeOrderResult | null> {
  // TODO: Implement Pagar.me V5 API
  console.log('[Pagar.me Stub] Creating order:', params.paymentMethod);
  return null;
}

export async function getOrder(orderId: string): Promise<PagarmeOrderResult | null> {
  console.log('[Pagar.me Stub] Getting order:', orderId);
  return null;
}

export function validateWebhookSignature(body: string, signature: string): boolean {
  // TODO: Validate HMAC signature
  return false;
}
`;

files['src/lib/services/whatsapp.ts'] = `const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || '5511999999999';

export function getWhatsAppLink(message?: string): string {
  const encoded = message ? encodeURIComponent(message) : '';
  return \`https://wa.me/\${WHATSAPP_NUMBER}\${encoded ? \`?text=\${encoded}\` : ''}\`;
}

export function getOrderWhatsAppLink(orderId: string): string {
  return getWhatsAppLink(\`Ola! Gostaria de informacoes sobre meu pedido #\${orderId}\`);
}
`;

// ============================================================
// 5. EMAIL TEMPLATES
// ============================================================

files['src/emails/OrderConfirmation.tsx'] = `interface OrderConfirmationProps {
  customerName: string;
  orderId: string;
  total: number;
}

export default function OrderConfirmation({ customerName, orderId, total }: OrderConfirmationProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ color: '#FF6600' }}>Pedido Confirmado!</h1>
      <p>Ola {customerName},</p>
      <p>Seu pedido <strong>#{orderId}</strong> foi confirmado com sucesso.</p>
      <p>Total: <strong>R$ {total.toFixed(2)}</strong></p>
      <p>Obrigado por comprar na Surfers Paradise!</p>
    </div>
  );
}
`;

files['src/emails/OrderStatusUpdate.tsx'] = `interface OrderStatusUpdateProps {
  customerName: string;
  orderId: string;
  status: string;
  trackingCode?: string;
}

export default function OrderStatusUpdate({ customerName, orderId, status, trackingCode }: OrderStatusUpdateProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ color: '#FF6600' }}>Atualizacao do Pedido</h1>
      <p>Ola {customerName},</p>
      <p>Seu pedido <strong>#{orderId}</strong> foi atualizado para: <strong>{status}</strong></p>
      {trackingCode && <p>Codigo de rastreio: <strong>{trackingCode}</strong></p>}
    </div>
  );
}
`;

files['src/emails/OtpVerification.tsx'] = `interface OtpVerificationProps {
  code: string;
}

export default function OtpVerification({ code }: OtpVerificationProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 600, margin: '0 auto', textAlign: 'center' as const }}>
      <h1 style={{ color: '#FF6600' }}>Codigo de Verificacao</h1>
      <p>Use o codigo abaixo para verificar sua conta:</p>
      <p style={{ fontSize: 32, fontWeight: 'bold', letterSpacing: 8, color: '#1A1A1A' }}>{code}</p>
      <p style={{ color: '#666', fontSize: 14 }}>Este codigo expira em 10 minutos.</p>
    </div>
  );
}
`;

files['src/emails/WelcomeEmail.tsx'] = `interface WelcomeEmailProps {
  customerName: string;
}

export default function WelcomeEmail({ customerName }: WelcomeEmailProps) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ color: '#FF6600' }}>Bem-vindo a Surfers Paradise!</h1>
      <p>Ola {customerName},</p>
      <p>Sua conta foi criada com sucesso. Agora voce pode aproveitar todos os produtos da nossa loja!</p>
      <p>Boas ondas!</p>
    </div>
  );
}
`;

// ============================================================
// 6. SHARED COMPONENTS
// ============================================================

files['src/components/shared/CookieConsent.tsx'] = `'use client';
import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setShow(true);
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg p-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-600">Utilizamos cookies para melhorar sua experiencia. Ao continuar navegando, voce concorda com nossa politica de privacidade.</p>
        <button onClick={accept} className="bg-[#FF6600] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#e55b00] whitespace-nowrap">Aceitar</button>
      </div>
    </div>
  );
}
`;

files['src/components/shared/HealthCheck.tsx'] = `export default function HealthCheck() {
  return <div data-testid="health-check" className="hidden">OK</div>;
}
`;

files['src/components/shared/ScrollToTop.tsx'] = `'use client';
import { useState, useEffect } from 'react';

export default function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-20 right-4 z-40 bg-[#FF6600] text-white p-3 rounded-full shadow-lg hover:bg-[#e55b00] transition-colors"
      aria-label="Voltar ao topo"
    >
      &uarr;
    </button>
  );
}
`;

// ============================================================
// 7. SEO + SITEMAP
// ============================================================

files['src/components/seo/JsonLd.tsx'] = `interface JsonLdProps {
  data: Record<string, unknown>;
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
`;

files['src/app/sitemap.ts'] = `import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://surfersparadise.com.br';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: \`\${BASE_URL}/produtos\`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: \`\${BASE_URL}/a-empresa\`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: \`\${BASE_URL}/contato\`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: \`\${BASE_URL}/faq\`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: \`\${BASE_URL}/blog\`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ];
}
`;

// ============================================================
// 8. PRODUCT COMPONENTS
// ============================================================

files['src/components/product/ProductGallery.tsx'] = `'use client';
import { useState } from 'react';
import Image from 'next/image';

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);
  const displayImages = images.length > 0 ? images : ['/images/placeholder.jpg'];

  return (
    <div className="space-y-4">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-100">
        <Image src={displayImages[selected]} alt={productName} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
      </div>
      {displayImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {displayImages.map((img, i) => (
            <button key={i} onClick={() => setSelected(i)} className={\`relative w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 \${i === selected ? 'border-[#FF6600]' : 'border-transparent'}\`}>
              <Image src={img} alt={\`\${productName} \${i + 1}\`} fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
`;

files['src/components/product/ProductInfo.tsx'] = `interface ProductInfoProps {
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  sku?: string;
  brand?: string;
  inStock?: boolean;
}

export default function ProductInfo({ name, price, originalPrice, description, sku, brand, inStock = true }: ProductInfoProps) {
  return (
    <div className="space-y-4">
      {brand && <p className="text-sm text-gray-500 uppercase tracking-wide">{brand}</p>}
      <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-bold text-[#FF6600]">R$ {price.toFixed(2)}</span>
        {originalPrice && originalPrice > price && <span className="text-lg text-gray-400 line-through">R$ {originalPrice.toFixed(2)}</span>}
      </div>
      <p className="text-gray-600 leading-relaxed">{description}</p>
      {sku && <p className="text-xs text-gray-400">SKU: {sku}</p>}
      <p className={\`text-sm font-medium \${inStock ? 'text-green-600' : 'text-red-600'}\`}>{inStock ? 'Em estoque' : 'Fora de estoque'}</p>
    </div>
  );
}
`;

files['src/components/product/ProductPriceDisplay.tsx'] = `import { formatCurrency } from '@/lib/utils/formatCurrency';
import { getInstallments } from '@/lib/utils/installments';

interface ProductPriceDisplayProps {
  price: number;
  originalPrice?: number;
}

export default function ProductPriceDisplay({ price, originalPrice }: ProductPriceDisplayProps) {
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const installment = getInstallments(price);

  return (
    <div className="space-y-1">
      {originalPrice && originalPrice > price && (
        <p className="text-sm text-gray-500 line-through">{formatCurrency(originalPrice)}</p>
      )}
      <p className="text-2xl font-bold text-gray-900">{formatCurrency(price)}</p>
      {discount > 0 && <span className="text-sm font-semibold text-green-600">{discount}% OFF</span>}
      {installment && <p className="text-sm text-gray-500">{installment.count}x de {formatCurrency(installment.value)} sem juros</p>}
    </div>
  );
}
`;

files['src/components/product/ProductReviews.tsx'] = `'use client';

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Avaliacoes</h3>
      <p className="text-gray-500 text-sm">Nenhuma avaliacao ainda. Seja o primeiro a avaliar!</p>
    </div>
  );
}
`;

files['src/components/product/ProductTabs.tsx'] = `'use client';
import { useState } from 'react';

interface Tab {
  label: string;
  content: React.ReactNode;
}

interface ProductTabsProps {
  tabs: Tab[];
}

export default function ProductTabs({ tabs }: ProductTabsProps) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="flex border-b">
        {tabs.map((tab, i) => (
          <button key={i} onClick={() => setActive(i)} className={\`px-4 py-3 text-sm font-medium border-b-2 transition-colors \${i === active ? 'border-[#FF6600] text-[#FF6600]' : 'border-transparent text-gray-500 hover:text-gray-700'}\`}>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="py-6">{tabs[active]?.content}</div>
    </div>
  );
}
`;

files['src/components/product/RelatedProducts.tsx'] = `interface RelatedProductsProps {
  productId: string;
  categoryId?: string;
}

export default function RelatedProducts({ productId, categoryId }: RelatedProductsProps) {
  return (
    <section className="mt-16">
      <h2 className="text-xl font-bold mb-6">Produtos Relacionados</h2>
      <p className="text-gray-500 text-sm">Em breve...</p>
    </section>
  );
}
`;

files['src/components/product/ShareProduct.tsx'] = `'use client';

interface ShareProductProps {
  url: string;
  title: string;
}

export default function ShareProduct({ url, title }: ShareProductProps) {
  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title, url });
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copiado!');
    }
  };

  return (
    <button onClick={share} className="text-sm text-gray-500 hover:text-[#FF6600] transition-colors">
      Compartilhar
    </button>
  );
}
`;

files['src/components/product/ShippingCalculator.tsx'] = `'use client';
import { useState } from 'react';

interface ShippingCalculatorProps {
  productId: string;
}

export default function ShippingCalculator({ productId }: ShippingCalculatorProps) {
  const [cep, setCep] = useState('');

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">Calcular frete</label>
      <div className="flex gap-2">
        <input type="text" value={cep} onChange={(e) => setCep(e.target.value.replace(/\\D/g, '').slice(0, 8))} placeholder="00000-000" className="flex-1 border rounded-lg px-3 py-2 text-sm" maxLength={9} />
        <button className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg text-sm hover:bg-black">Calcular</button>
      </div>
    </div>
  );
}
`;

// ============================================================
// 9. BLOG COMPONENTS
// ============================================================

files['src/components/blog/BlogCard.tsx'] = `import Link from 'next/link';
import Image from 'next/image';

interface BlogCardProps {
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  date: string;
}

export default function BlogCard({ title, slug, excerpt, coverImage, date }: BlogCardProps) {
  return (
    <Link href={\`/blog/\${slug}\`} className="group block">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 mb-4">
        {coverImage && <Image src={coverImage} alt={title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 100vw, 33vw" />}
      </div>
      <p className="text-xs text-gray-400 mb-2">{date}</p>
      <h3 className="font-semibold text-gray-900 group-hover:text-[#FF6600] transition-colors">{title}</h3>
      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{excerpt}</p>
    </Link>
  );
}
`;

files['src/components/blog/BlogContent.tsx'] = `interface BlogContentProps {
  content: string;
}

export default function BlogContent({ content }: BlogContentProps) {
  return (
    <article className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
  );
}
`;

files['src/components/blog/BlogHero.tsx'] = `import Image from 'next/image';

interface BlogHeroProps {
  title: string;
  coverImage?: string;
  date: string;
  author?: string;
}

export default function BlogHero({ title, coverImage, date, author }: BlogHeroProps) {
  return (
    <div className="mb-8">
      {coverImage && (
        <div className="relative aspect-video rounded-xl overflow-hidden mb-6">
          <Image src={coverImage} alt={title} fill className="object-cover" sizes="100vw" priority />
        </div>
      )}
      <h1 className="text-3xl font-bold text-gray-900 mb-3">{title}</h1>
      <div className="flex items-center gap-3 text-sm text-gray-500">
        {author && <span>{author}</span>}
        <span>{date}</span>
      </div>
    </div>
  );
}
`;

// ============================================================
// 10. HOME COMPONENT
// ============================================================

files['src/components/home/NewArrivals.tsx'] = `export default function NewArrivals() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Novidades</h2>
        <p className="text-gray-500">Novos produtos chegando em breve...</p>
      </div>
    </section>
  );
}
`;

// ============================================================
// 11. LAYOUT COMPONENTS
// ============================================================

files['src/components/layout/MegaMenu.tsx'] = `'use client';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MegaMenu({ isOpen, onClose }: MegaMenuProps) {
  if (!isOpen) return null;
  return (
    <div className="absolute top-full left-0 right-0 bg-white shadow-xl border-t z-50" onMouseLeave={onClose}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-gray-500">Menu em construcao...</p>
      </div>
    </div>
  );
}
`;

files['src/components/layout/MobileMenu.tsx'] = `'use client';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-bold text-lg">Menu</span>
          <button onClick={onClose} className="text-gray-500 text-2xl">&times;</button>
        </div>
        <nav className="p-4">
          <p className="text-gray-500 text-sm">Menu em construcao...</p>
        </nav>
      </div>
    </div>
  );
}
`;

files['src/components/layout/SearchBar.tsx'] = `'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(\`/busca?q=\${encodeURIComponent(query.trim())}\`);
  };

  return (
    <form onSubmit={handleSearch} className="relative w-full max-w-md">
      <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar produtos..." className="w-full rounded-full border border-gray-300 px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6600]/50" />
      <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#FF6600]">Buscar</button>
    </form>
  );
}
`;

// ============================================================
// 12. CHECKOUT COMPONENTS
// ============================================================

files['src/components/checkout/AddressForm.tsx'] = `'use client';
import { useState } from 'react';

interface AddressFormProps {
  onSubmit: (address: Record<string, string>) => void;
  initialData?: Record<string, string>;
}

export default function AddressForm({ onSubmit, initialData }: AddressFormProps) {
  const [cep, setCep] = useState(initialData?.cep || '');

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Endereco de Entrega</h3>
      <p className="text-sm text-gray-500">Formulario de endereco em construcao...</p>
    </div>
  );
}
`;

files['src/components/checkout/AddressSelector.tsx'] = `'use client';

interface AddressSelectorProps {
  addresses: Array<{ _id: string; street: string; number: string; city: string; state: string; cep: string }>;
  selectedId?: string;
  onSelect: (id: string) => void;
}

export default function AddressSelector({ addresses, selectedId, onSelect }: AddressSelectorProps) {
  if (!addresses.length) return <p className="text-sm text-gray-500">Nenhum endereco cadastrado.</p>;
  return (
    <div className="space-y-3">
      {addresses.map((addr) => (
        <button key={addr._id} onClick={() => onSelect(addr._id)} className={\`w-full text-left p-4 border rounded-lg \${addr._id === selectedId ? 'border-[#FF6600] bg-orange-50' : 'border-gray-200'}\`}>
          <p className="font-medium">{addr.street}, {addr.number}</p>
          <p className="text-sm text-gray-500">{addr.city} - {addr.state} | CEP {addr.cep}</p>
        </button>
      ))}
    </div>
  );
}
`;

files['src/components/checkout/CartItem.tsx'] = `import Image from 'next/image';

interface CartItemProps {
  item: { id: string; name: string; price: number; quantity: number; image?: string };
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex gap-4 py-4 border-b">
      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
        {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium truncate">{item.name}</h4>
        <p className="text-sm font-bold text-[#FF6600] mt-1">R$ {item.price.toFixed(2)}</p>
        <div className="flex items-center gap-2 mt-2">
          <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 border rounded text-sm">-</button>
          <span className="text-sm w-8 text-center">{item.quantity}</span>
          <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 border rounded text-sm">+</button>
          <button onClick={() => onRemove(item.id)} className="ml-auto text-xs text-red-500 hover:underline">Remover</button>
        </div>
      </div>
    </div>
  );
}
`;

files['src/components/checkout/CartSummary.tsx'] = `import { formatCurrency } from '@/lib/utils/formatCurrency';

interface CartSummaryProps {
  subtotal: number;
  shipping?: number;
  discount?: number;
  total: number;
}

export default function CartSummary({ subtotal, shipping = 0, discount = 0, total }: CartSummaryProps) {
  return (
    <div className="space-y-3 border-t pt-4">
      <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
      {shipping > 0 && <div className="flex justify-between text-sm"><span>Frete</span><span>{formatCurrency(shipping)}</span></div>}
      {discount > 0 && <div className="flex justify-between text-sm text-green-600"><span>Desconto</span><span>-{formatCurrency(discount)}</span></div>}
      <div className="flex justify-between font-bold text-lg border-t pt-3"><span>Total</span><span>{formatCurrency(total)}</span></div>
    </div>
  );
}
`;

files['src/components/checkout/CouponInput.tsx'] = `'use client';
import { useState } from 'react';

interface CouponInputProps {
  onApply: (code: string) => void;
}

export default function CouponInput({ onApply }: CouponInputProps) {
  const [code, setCode] = useState('');
  return (
    <div className="flex gap-2">
      <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Cupom de desconto" className="flex-1 border rounded-lg px-3 py-2 text-sm" />
      <button onClick={() => code.trim() && onApply(code.trim())} className="bg-[#1A1A1A] text-white px-4 py-2 rounded-lg text-sm hover:bg-black">Aplicar</button>
    </div>
  );
}
`;

files['src/components/checkout/CreditCardForm.tsx'] = `'use client';

interface CreditCardFormProps {
  onSubmit: (data: Record<string, string>) => void;
}

export default function CreditCardForm({ onSubmit }: CreditCardFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Cartao de Credito</h3>
      <p className="text-sm text-gray-500">Formulario de cartao em construcao...</p>
    </div>
  );
}
`;

files['src/components/checkout/OrderSummary.tsx'] = `interface OrderSummaryProps {
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
}

export default function OrderSummary({ items, total }: OrderSummaryProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <h3 className="font-semibold mb-4">Resumo do Pedido</h3>
      {items.map((item, i) => (
        <div key={i} className="flex justify-between text-sm py-2 border-b last:border-0">
          <span>{item.quantity}x {item.name}</span>
          <span>R$ {(item.price * item.quantity).toFixed(2)}</span>
        </div>
      ))}
      <div className="flex justify-between font-bold mt-4 pt-4 border-t"><span>Total</span><span>R$ {total.toFixed(2)}</span></div>
    </div>
  );
}
`;

files['src/components/checkout/OtpVerification.tsx'] = `'use client';
import { useState } from 'react';

interface OtpVerificationProps {
  email: string;
  onVerify: (code: string) => void;
}

export default function OtpVerification({ email, onVerify }: OtpVerificationProps) {
  const [code, setCode] = useState('');
  return (
    <div className="space-y-4 text-center">
      <h3 className="font-semibold">Verificacao por E-mail</h3>
      <p className="text-sm text-gray-500">Enviamos um codigo para <strong>{email}</strong></p>
      <input type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\\D/g, '').slice(0, 6))} placeholder="000000" className="text-center text-2xl tracking-[0.5em] border rounded-lg px-4 py-3 w-48 mx-auto block" maxLength={6} />
      <button onClick={() => code.length === 6 && onVerify(code)} className="bg-[#FF6600] text-white px-6 py-2 rounded-lg text-sm">Verificar</button>
    </div>
  );
}
`;

files['src/components/checkout/PaymentForm.tsx'] = `'use client';

interface PaymentFormProps {
  total: number;
  onSubmit: (method: string) => void;
}

export default function PaymentForm({ total, onSubmit }: PaymentFormProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Forma de Pagamento</h3>
      <div className="grid gap-3">
        <button onClick={() => onSubmit('credit_card')} className="p-4 border rounded-lg text-left hover:border-[#FF6600]">Cartao de Credito</button>
        <button onClick={() => onSubmit('boleto')} className="p-4 border rounded-lg text-left hover:border-[#FF6600]">Boleto Bancario</button>
        <button onClick={() => onSubmit('pix')} className="p-4 border rounded-lg text-left hover:border-[#FF6600]">PIX</button>
      </div>
    </div>
  );
}
`;

files['src/components/checkout/ShippingOptions.tsx'] = `'use client';

interface ShippingOption {
  id: number;
  name: string;
  price: number;
  deliveryDays: number;
  company: string;
}

interface ShippingOptionsProps {
  options: ShippingOption[];
  selectedId?: number;
  onSelect: (option: ShippingOption) => void;
}

export default function ShippingOptions({ options, selectedId, onSelect }: ShippingOptionsProps) {
  if (!options.length) return <p className="text-sm text-gray-500">Informe o CEP para calcular o frete.</p>;
  return (
    <div className="space-y-3">
      {options.map((opt) => (
        <button key={opt.id} onClick={() => onSelect(opt)} className={\`w-full flex items-center justify-between p-4 border rounded-lg \${opt.id === selectedId ? 'border-[#FF6600] bg-orange-50' : 'border-gray-200'}\`}>
          <div>
            <p className="font-medium text-sm">{opt.name} - {opt.company}</p>
            <p className="text-xs text-gray-500">{opt.deliveryDays} dias uteis</p>
          </div>
          <span className="font-bold text-sm">R$ {opt.price.toFixed(2)}</span>
        </button>
      ))}
    </div>
  );
}
`;

// ============================================================
// 13. ADMIN COMPONENTS
// ============================================================

const adminComponents = [
  'BannerManager', 'BrandForm', 'CategoryForm', 'ClientTable', 'CouponForm',
  'DashboardStats', 'DataTable', 'ImageUpload', 'OrderStatusBadge', 'OrderTable',
  'ProductForm', 'ReviewTable', 'RichTextEditor', 'ShippingLabel'
];

for (const name of adminComponents) {
  files[`src/components/admin/${name}.tsx`] = `'use client';

export default function ${name}() {
  return (
    <div className="p-6">
      <p className="text-gray-500 text-sm">Componente em construcao...</p>
    </div>
  );
}
`;
}

// ============================================================
// 14. PAGES - Account
// ============================================================

files['src/app/(account)/avaliacoes/page.tsx'] = `export default function AvaliacoesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Minhas Avaliacoes</h1>
      <p className="text-gray-500">Voce ainda nao fez nenhuma avaliacao.</p>
    </div>
  );
}
`;

files['src/app/(account)/meus-pedidos/[id]/page.tsx'] = `interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Pedido #{id}</h1>
      <p className="text-gray-500">Detalhes do pedido em construcao...</p>
    </div>
  );
}
`;

// ============================================================
// 15. PAGES - Auth
// ============================================================

files['src/app/(auth)/verificar-email/page.tsx'] = `export default function VerificarEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold">Verifique seu E-mail</h1>
        <p className="text-gray-500">Enviamos um codigo de verificacao para o seu e-mail.</p>
      </div>
    </div>
  );
}
`;

// ============================================================
// 16. PAGES - Checkout
// ============================================================

files['src/app/(checkout)/pagamento/boleto/page.tsx'] = `export default function BoletoPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Pagamento por Boleto</h1>
      <p className="text-gray-500">Seu boleto sera gerado em instantes...</p>
    </div>
  );
}
`;

files['src/app/(checkout)/pagamento/pix/page.tsx'] = `export default function PixPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 text-center">
      <h1 className="text-2xl font-bold mb-4">Pagamento por PIX</h1>
      <p className="text-gray-500">Escaneie o QR Code abaixo para realizar o pagamento.</p>
    </div>
  );
}
`;

files['src/app/(checkout)/pedido-confirmado/page.tsx'] = `import Link from 'next/link';

export default function PedidoConfirmadoPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">&#10003;</div>
      <h1 className="text-2xl font-bold mb-2">Pedido Confirmado!</h1>
      <p className="text-gray-500 mb-8">Obrigado pela sua compra. Voce recebera um e-mail com os detalhes do pedido.</p>
      <Link href="/produtos" className="inline-block bg-[#FF6600] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#e55b00]">Continuar Comprando</Link>
    </div>
  );
}
`;

// ============================================================
// 17. PAGES - Shop
// ============================================================

files['src/app/(shop)/colecao/[slug]/page.tsx'] = `interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ColecaoPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 capitalize">{slug.replace(/-/g, ' ')}</h1>
      <p className="text-gray-500">Produtos desta colecao em breve...</p>
    </div>
  );
}
`;

files['src/app/(shop)/promocao/page.tsx'] = `export default function PromocaoPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Promocoes</h1>
      <p className="text-gray-500">Nenhuma promocao ativa no momento. Volte em breve!</p>
    </div>
  );
}
`;

// ============================================================
// 18. PAGES - Blog
// ============================================================

files['src/app/blog/page.tsx'] = `export default function BlogPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Blog</h1>
      <p className="text-gray-500">Artigos em breve...</p>
    </div>
  );
}
`;

files['src/app/blog/[slug]/page.tsx'] = `interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4 capitalize">{slug.replace(/-/g, ' ')}</h1>
      <p className="text-gray-500">Conteudo em breve...</p>
    </div>
  );
}
`;

// ============================================================
// 19. PAGES - Admin
// ============================================================

files['src/app/admin/avaliacoes/page.tsx'] = `export default function AdminAvaliacoesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Avaliacoes</h1>
      <p className="text-gray-500">Gestao de avaliacoes em construcao...</p>
    </div>
  );
}
`;

files['src/app/admin/blog/page.tsx'] = `export default function AdminBlogPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Blog</h1>
      <p className="text-gray-500">Gestao de posts em construcao...</p>
    </div>
  );
}
`;

files['src/app/admin/clientes/page.tsx'] = `export default function AdminClientesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Clientes</h1>
      <p className="text-gray-500">Gestao de clientes em construcao...</p>
    </div>
  );
}
`;

files['src/app/admin/cupons/page.tsx'] = `export default function AdminCuponsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Cupons</h1>
      <p className="text-gray-500">Gestao de cupons em construcao...</p>
    </div>
  );
}
`;

files['src/app/admin/pedidos/page.tsx'] = `export default function AdminPedidosPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pedidos</h1>
      <p className="text-gray-500">Gestao de pedidos em construcao...</p>
    </div>
  );
}
`;

files['src/app/admin/pedidos/[id]/page.tsx'] = `interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pedido #{id}</h1>
      <p className="text-gray-500">Detalhes do pedido em construcao...</p>
    </div>
  );
}
`;

files['src/app/admin/romaneios/page.tsx'] = `export default function AdminRomaneiosPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Romaneios</h1>
      <p className="text-gray-500">Gestao de romaneios em construcao...</p>
    </div>
  );
}
`;

files['src/app/admin/romaneios/[id]/page.tsx'] = `interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminRomaneioDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Romaneio #{id}</h1>
      <p className="text-gray-500">Detalhes do romaneio em construcao...</p>
    </div>
  );
}
`;

// ============================================================
// 20. API ROUTES
// ============================================================

files['src/app/api/blog/route.ts'] = `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ posts: [], total: 0 });
}

export async function POST() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
`;

files['src/app/api/blog/[id]/route.ts'] = `import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ error: 'Not implemented', id }, { status: 501 });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ error: 'Not implemented', id }, { status: 501 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ error: 'Not implemented', id }, { status: 501 });
}
`;

files['src/app/api/cart/route.ts'] = `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ items: [], total: 0 });
}

export async function POST(request: Request) {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
`;

files['src/app/api/clients/route.ts'] = `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ clients: [], total: 0 });
}
`;

files['src/app/api/coupons/route.ts'] = `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ coupons: [], total: 0 });
}

export async function POST() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
`;

files['src/app/api/coupons/[id]/route.ts'] = `import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ error: 'Not implemented', id }, { status: 501 });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ error: 'Not implemented', id }, { status: 501 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ error: 'Not implemented', id }, { status: 501 });
}
`;

files['src/app/api/coupons/validate/route.ts'] = `import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ valid: false, message: 'Cupom invalido', code: body.code });
}
`;

files['src/app/api/orders/route.ts'] = `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ orders: [], total: 0 });
}

export async function POST() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
`;

files['src/app/api/orders/[id]/route.ts'] = `import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ error: 'Not implemented', id }, { status: 501 });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ error: 'Not implemented', id }, { status: 501 });
}
`;

files['src/app/api/otp/route.ts'] = `import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({ success: false, message: 'Not implemented', email: body.email });
}
`;

files['src/app/api/payments/pagarme/route.ts'] = `import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
`;

files['src/app/api/payments/pix/route.ts'] = `import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
`;

files['src/app/api/payments/webhook/route.ts'] = `import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.text();
  console.log('[Webhook] Received:', body.substring(0, 100));
  return NextResponse.json({ received: true });
}
`;

files['src/app/api/reviews/route.ts'] = `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ reviews: [], total: 0 });
}

export async function POST() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
`;

files['src/app/api/reviews/[id]/route.ts'] = `import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ error: 'Not implemented', id }, { status: 501 });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ error: 'Not implemented', id }, { status: 501 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ error: 'Not implemented', id }, { status: 501 });
}
`;

files['src/app/api/romaneios/route.ts'] = `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ romaneios: [], total: 0 });
}

export async function POST() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
`;

files['src/app/api/romaneios/[id]/route.ts'] = `import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ error: 'Not implemented', id }, { status: 501 });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ error: 'Not implemented', id }, { status: 501 });
}
`;

files['src/app/api/seller/route.ts'] = `import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
`;

files['src/app/api/shipping/calculate/route.ts'] = `import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  return NextResponse.json({
    quotes: [
      { id: 1, name: 'PAC', price: 25.90, deliveryDays: 8, company: 'Correios' },
      { id: 2, name: 'SEDEX', price: 45.90, deliveryDays: 3, company: 'Correios' },
    ],
    cep: body.cep,
  });
}
`;

files['src/app/api/shipping/label/route.ts'] = `import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
`;

// ============================================================
// EXECUTE
// ============================================================

console.log('\\n=== Surfers Paradise - Filling Empty Files ===');
console.log(`Total: ${Object.keys(files).length} files\\n`);

for (const [path, content] of Object.entries(files)) {
  writeFile(path, content);
}

console.log(`\\n=== Done! ${Object.keys(files).length} files written ===`);
console.log('Now run: npm run build\\n');
