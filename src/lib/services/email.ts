interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams): Promise<boolean> {
  // TODO: Implement with Resend or Nodemailer
  console.log(`[Email Stub] To: ${to}, Subject: ${subject}`);
  return true;
}

export async function sendOtpEmail(to: string, code: string): Promise<boolean> {
  return sendEmail({ to, subject: 'Codigo de Verificacao - Surfers Paradise', html: `<p>Seu codigo: <strong>${code}</strong></p>` });
}

export async function sendOrderConfirmation(to: string, orderId: string): Promise<boolean> {
  return sendEmail({ to, subject: `Pedido Confirmado #${orderId} - Surfers Paradise`, html: `<p>Seu pedido #${orderId} foi confirmado!</p>` });
}
