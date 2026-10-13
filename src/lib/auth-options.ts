import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { saveGoogleCredentials } from './google-sync';

export function allowedEmail(email?: string | null) {
  return !!email && (process.env.CRM_ALLOWED_EMAILS || '').split(',').map(x => x.trim().toLowerCase()).includes(email.toLowerCase());
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/contacts',
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    }),
    CredentialsProvider({
      id: 'credentials',
      name: 'Acceso Directo',
      credentials: {
        email: { label: 'Correo', type: 'text', placeholder: 'elchegos@gmail.com' }
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase() || 'elchegos@gmail.com';
        if (allowedEmail(email)) {
          return { id: 'admin-user', name: 'Alex', email };
        }
        return null;
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!allowedEmail(user.email)) return false;
      if (account?.provider === 'google' && !(profile as any)?.email_verified) return false;
      if (account?.provider === 'google' && user.email?.toLowerCase() === process.env.GOOGLE_CONTACTS_OWNER_EMAIL?.toLowerCase()) {
        await saveGoogleCredentials(account);
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token.email) {
        session.user.email = token.email;
      }
      return session;
    }
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
};

