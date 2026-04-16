interface OtpVerificationProps {
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
