import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface TokenPayload {
  sub: string;
  correo: string;
  rol: 'ALUMNO' | 'COORDINADOR' | 'ADMINISTRADOR';
  exp: number;
}

const AUTH_SECRET =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  'siam_secreto_desarrollo_temporal_seguro_123456789';

/**
 * Valida la firma HMAC-SHA256 del token usando Web Crypto API (compatible con Edge Runtime).
 */
async function verifyHmacSha256(
  data: string,
  signatureB64Url: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    let base64 = signatureB64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return await crypto.subtle.verify('HMAC', key, bytes, encoder.encode(data));
  } catch {
    return false;
  }
}

/**
 * Decodifica el payload en base64url de un token JWT.
 */
function decodeBase64UrlJson(str: string): TokenPayload | null {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonStr) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Extrae y valida el token de sesión de SIAM desde cookies o Authorization header.
 */
async function getValidatedTokenPayload(request: NextRequest): Promise<TokenPayload | null> {
  let token = request.cookies.get('siam_token')?.value;

  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [header, body, signature] = parts;
  const isValid = await verifyHmacSha256(`${header}.${body}`, signature, AUTH_SECRET);
  if (!isValid) {
    return null;
  }

  const payload = decodeBase64UrlJson(body);
  if (!payload || !payload.exp || payload.exp < Date.now()) {
    return null; // Expirado o corrupto
  }

  return payload;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const payload = await getValidatedTokenPayload(request);

  // 1. Proteger ruta de Login: si ya está autenticado, redirigir a su panel correspondiente
  if (pathname === '/login') {
    if (payload) {
      if (payload.rol === 'COORDINADOR' || payload.rol === 'ADMINISTRADOR') {
        return NextResponse.redirect(new URL('/dashboard/coordinator', request.url));
      }
      if (payload.rol === 'ALUMNO') {
        return NextResponse.redirect(new URL('/dashboard/student', request.url));
      }
    }
    return NextResponse.next();
  }

  // 2. Proteger rutas de Coordinador / Administrador
  if (pathname.startsWith('/dashboard/coordinator') || pathname.startsWith('/dashboard/admin')) {
    if (!payload) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (payload.rol !== 'COORDINADOR' && payload.rol !== 'ADMINISTRADOR') {
      // El alumno no tiene permisos de coordinador
      return NextResponse.redirect(new URL('/dashboard/student', request.url));
    }

    return NextResponse.next();
  }

  // 3. Proteger rutas de Estudiante
  if (pathname.startsWith('/dashboard/student')) {
    if (!payload) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (payload.rol !== 'ALUMNO') {
      // Si un coordinador entra a la vista de estudiante, redirigir a su panel
      return NextResponse.redirect(new URL('/dashboard/coordinator', request.url));
    }

    return NextResponse.next();
  }

  // 4. Redirección general de /dashboard a la vista de cada rol
  if (pathname === '/dashboard') {
    if (!payload) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (payload.rol === 'COORDINADOR' || payload.rol === 'ADMINISTRADOR') {
      return NextResponse.redirect(new URL('/dashboard/coordinator', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard/student', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
};
