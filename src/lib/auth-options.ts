import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { saveGoogleCredentials } from './google-sync';
export function allowedEmail(email?: string | null) {
  return !!email && (process.env.CRM_ALLOWED_EMAILS || '').split(',').map(x => x.trim().toLowerCase()).includes(email.toLowerCase());
}
export const authOptions: NextAuthOptions = {
  providers: [GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    authorization: { params: { scope: 'openid email profile https://www.googleapis.com/auth/contacts', access_type: 'offline', prompt: 'consent' } } })],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!allowedEmail(user.email) || !(profile as any)?.email_verified) return false;
      if (account && user.email?.toLowerCase() === process.env.GOOGLE_CONTACTS_OWNER_EMAIL?.toLowerCase()) await saveGoogleCredentials(account);
      return true;
    },
  }, secret: process.env.NEXTAUTH_SECRET,
};
