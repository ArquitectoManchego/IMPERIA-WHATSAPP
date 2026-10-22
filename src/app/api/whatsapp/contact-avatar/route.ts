import { NextResponse } from 'next/server';
import axios from 'axios';

const baseURL = process.env.OPENWA_URL || 'http://localhost:2785/api';
const apiKey = process.env.OPENWA_API_KEY || 'imperia_secret_token';
const sessionId = process.env.OPENWA_SESSION_ID || 'imperia-session';

const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': apiKey,
};

// In-memory cache for profile pictures to avoid spamming the OpenWA engine
const avatarCache = new Map<string, { url: string | null; isReal: boolean; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getDeterministicAvatar(name: string, phone: string, size = 256): string {
  const cleanName = (name && name !== 'Sin Nombre' && !name.startsWith('+')) ? name : (phone || 'Cliente');
  // Elegant palette colors matching Imperia brand
  const colors = ['0f172a', '064e3b', '1e1b4b', '1f2937', '312e81', '042f2e'];
  let sum = 0;
  for (let i = 0; i < cleanName.length; i++) sum += cleanName.charCodeAt(i);
  const bg = colors[sum % colors.length];
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=${bg}&color=34d399&size=${size}&bold=true&format=svg`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId') || '';
    const phone = searchParams.get('phone') || '';
    const name = searchParams.get('name') || '';

    const cacheKey = chatId || phone;
    if (!cacheKey) {
      return NextResponse.json({ url: getDeterministicAvatar(name, phone), isReal: false });
    }

    const cached = avatarCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return NextResponse.json({ url: cached.url || getDeterministicAvatar(name, phone), isReal: cached.isReal });
    }

    // Try candidates in OpenWA: raw chatId, phone@c.us, 52...
    const digits = phone.replace(/\D/g, '') || chatId.replace(/\D/g, '');
    const candidates: string[] = [];
    if (chatId) candidates.push(chatId);
    if (digits) {
      candidates.push(`${digits}@c.us`);
      if (digits.length === 10) {
        candidates.push(`52${digits}@c.us`);
        candidates.push(`521${digits}@c.us`);
      }
    }

    let foundPhotoUrl: string | null = null;

    // Check OpenWA if not on cloud without gateway
    if (!process.env.VERCEL || !baseURL.includes('localhost')) {
      for (const candidate of candidates) {
        try {
          const res = await axios.get(
            `${baseURL}/sessions/${sessionId}/contacts/${encodeURIComponent(candidate)}/profile-picture`,
            { headers, timeout: 2500 }
          );
          if (res.data?.url) {
            foundPhotoUrl = res.data.url;
            break;
          }
        } catch (_) {}
      }
    }

    if (foundPhotoUrl) {
      avatarCache.set(cacheKey, { url: foundPhotoUrl, isReal: true, timestamp: Date.now() });
      return NextResponse.json({ url: foundPhotoUrl, isReal: true });
    }

    const fallback = getDeterministicAvatar(name, phone);
    avatarCache.set(cacheKey, { url: null, isReal: false, timestamp: Date.now() });
    return NextResponse.json({ url: fallback, isReal: false });

  } catch (error: any) {
    return NextResponse.json({
      url: getDeterministicAvatar('Cliente', ''),
      isReal: false
    });
  }
}
