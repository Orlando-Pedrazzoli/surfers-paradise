import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/connect';
import Subscriber from '@/lib/models/Subscriber';
import Coupon from '@/lib/models/Coupon';
import { isValidEmail } from '@/lib/utils/validators';
import { isDisposableEmail } from '@/lib/utils/disposableEmails';
import { sendNewsletterWelcome } from '@/lib/services/email';

const DISCOUNT_PERCENT = 10;
const COUPON_VALID_DAYS = 30;

// Caracteres sem ambíguos (sem O/0, I/1) para o código ser fácil de digitar
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return `BV${s}`;
}

async function generateUniqueCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = generateCode();
    const exists = await Coupon.findOne({ code }).lean();
    if (!exists) return code;
  }
  // Fallback praticamente impossível de colidir
  return `BV${Date.now().toString(36).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, name, birthday, consent } = body;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 },
      );
    }

    if (!consent) {
      return NextResponse.json(
        { success: false, error: 'É necessário aceitar receber nossos emails' },
        { status: 400 },
      );
    }

    if (isDisposableEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'E-mail descartável não é permitido' },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Já inscrito? Não emite novo cupom (anti-abuso), apenas confirma.
    const existing = await Subscriber.findOne({
      email: normalizedEmail,
    }).lean();
    if (existing) {
      return NextResponse.json({
        success: true,
        alreadySubscribed: true,
        message: 'Você já está inscrito na nossa newsletter!',
      });
    }

    // Gera cupom único de uso único
    const code = await generateUniqueCode();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + COUPON_VALID_DAYS);

    await Coupon.create({
      code,
      type: 'percentage',
      value: DISCOUNT_PERCENT,
      minOrderValue: 0,
      maxDiscount: 0,
      usageLimit: 1,
      usedCount: 0,
      validFrom: new Date(),
      validUntil,
      isActive: true,
    });

    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';

    await Subscriber.create({
      email: normalizedEmail,
      name: name?.trim() || '',
      birthday: birthday ? new Date(birthday) : null,
      consent: true,
      source: 'newsletter_modal',
      couponCode: code,
      status: 'active',
      ip,
    });

    // Dispara o email sem bloquear a resposta (SMTP pode estar lento/off)
    sendNewsletterWelcome(
      normalizedEmail,
      name?.trim() || '',
      code,
      DISCOUNT_PERCENT,
      validUntil,
    ).catch(err => console.error('Newsletter email error:', err));

    return NextResponse.json({
      success: true,
      couponCode: code,
      discountPercent: DISCOUNT_PERCENT,
    });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar inscrição' },
      { status: 500 },
    );
  }
}
