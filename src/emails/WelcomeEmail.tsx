interface WelcomeEmailProps {
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
