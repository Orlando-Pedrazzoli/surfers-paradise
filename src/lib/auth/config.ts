// 📄 src/lib/auth/config.ts
// v2 (Google OAuth):
// - Provider Google adicionado. Sem adapter: find-or-create no callback
//   signIn direto no User model (Mongoose) — evita as coleções paralelas
//   accounts/sessions do MongoDBAdapter, que conflitariam com o nosso modelo.
// - Account linking por email é seguro AQUI porque exigimos
//   profile.email_verified === true (Google verifica a posse do email).
//   Cliente que se cadastrou com senha e depois usa Google entra na MESMA conta.
// - Users criados via Google nascem com isEmailVerified: true (pulam OTP)
//   e sem password (schema v2 tornou o campo opcional).
// - Callback jwt: no login Google, user.id é o "sub" do Google, não o _id
//   do Mongo — buscamos o user no banco para popular token.id/role corretos.
// - Credentials: conta Google sem senha tentando logar com senha lança
//   GoogleAccountError (code 'use-google') para a UI mostrar mensagem clara.
import NextAuth, { CredentialsSignin } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db/connect';
import User from '@/lib/models/User';

// Erro específico: conta criada via Google, sem senha cadastrada
class GoogleAccountError extends CredentialsSignin {
  code = 'use-google';
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // Lê AUTH_GOOGLE_ID e AUTH_GOOGLE_SECRET automaticamente do env
    Google,
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        await connectDB();
        const user = await User.findOne({
          email: (credentials.email as string).toLowerCase(),
        }).select('+password');
        if (!user) {
          return null;
        }
        // Conta criada via Google: não tem senha — orienta a usar o botão
        if (!user.password) {
          throw new GoogleAccountError();
        }
        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );
        if (!isPasswordValid) {
          return null;
        }
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'google') {
        // Segurança do account linking: só aceita emails VERIFICADOS pelo
        // Google. Sem isso, alguém poderia criar uma conta Google com email
        // alheio não-verificado e sequestrar a conta do cliente.
        if (!profile?.email || !profile.email_verified) {
          return false;
        }
        await connectDB();
        const email = profile.email.toLowerCase();
        const existing = await User.findOne({ email });
        if (!existing) {
          // Primeiro login com Google → cria a conta (registro implícito)
          await User.create({
            name: profile.name || email.split('@')[0],
            email,
            provider: 'google',
            image: profile.picture || '',
            isEmailVerified: true, // Google já verificou
          });
        } else if (!existing.isEmailVerified) {
          // Conta credentials existente com email não verificado:
          // o login Google comprova a posse do email → marca verificado
          existing.isEmailVerified = true;
          await existing.save();
        }
        return true;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === 'google' && token.email) {
        // OAuth: o user.id vindo do provider é o sub do Google.
        // Busca o _id/role reais no banco (roda só no momento do login).
        await connectDB();
        const dbUser = await User.findOne({
          email: token.email.toLowerCase(),
        });
        if (dbUser) {
          token.id = dbUser._id.toString();
          token.role = dbUser.role;
        }
      } else if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
      }
      return session;
    },
  },
});
