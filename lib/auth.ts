import crypto from "node:crypto";
import { RolUsuario } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSupabaseAuthClient } from "@/lib/supabase";

export class ApiAuthError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiAuthError";
  }
}

export type AuthenticatedUser = {
  id: string;
  correo: string;
  nombreCompleto: string;
  rol: RolUsuario;
};

interface TokenPayload {
  sub: string;
  correo: string;
  rol: RolUsuario;
  exp: number;
}

const AUTH_SECRET =
  process.env.NEXTAUTH_SECRET ||
  process.env.AUTH_SECRET ||
  "siam_secreto_desarrollo_temporal_seguro_123456789";

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString();
}

/**
 * Crea un token de sesión firmado para autenticación de API y navegación.
 */
export function crearTokenSesion(payload: {
  id: string;
  correo: string;
  rol: RolUsuario;
}): string {
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const data: TokenPayload = {
    sub: payload.id,
    correo: payload.correo.toLowerCase(),
    rol: payload.rol,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 horas de validez
  };
  const body = base64UrlEncode(JSON.stringify(data));
  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(`${header}.${body}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${header}.${body}.${signature}`;
}

/**
 * Valida un token de sesión firmado. Retorna el payload si es válido o null si expiró o está alterado.
 */
export function verificarTokenSesion(token: string): TokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const [header, body, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", AUTH_SECRET)
      .update(`${header}.${body}`)
      .digest("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
      )
    ) {
      return null;
    }

    const parsed = JSON.parse(base64UrlDecode(body)) as TokenPayload;
    if (!parsed.exp || parsed.exp < Date.now()) {
      return null; // Expirado
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Extrae el token de acceso desde Authorization Header o Cookie.
 */
function extractAccessToken(request: Request): string | undefined {
  const authorization = request.headers.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice(7).trim();
  }

  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split("; ").map((c) => {
        const [k, ...v] = c.split("=");
        return [k, decodeURIComponent(v.join("="))];
      }),
    );
    if (cookies["siam_token"]) {
      return cookies["siam_token"];
    }
    if (cookies["session_token"]) {
      return cookies["session_token"];
    }
  }

  return undefined;
}

export async function requireAuthenticatedUser(
  request: Request,
): Promise<AuthenticatedUser> {
  const accessToken = extractAccessToken(request);

  if (!accessToken) {
    throw new ApiAuthError("Debe iniciar sesión para acceder a esta API", 401);
  }

  // 1. Intentar validar mediante token de sesión interno SIAM (HMAC/JWT)
  const sessionData = verificarTokenSesion(accessToken);
  if (sessionData) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: sessionData.sub },
    });

    if (!usuario || !usuario.rol) {
      throw new ApiAuthError("No se encontró un usuario autorizado", 403);
    }

    return {
      id: usuario.id,
      correo: usuario.correo,
      nombreCompleto: usuario.nombreCompleto,
      rol: usuario.rol,
    };
  }

  // 2. Si no es un token interno, intentar validar mediante Supabase si está disponible
  let supabaseAuthSuccess = false;
  let supabaseEmail: string | undefined;

  try {
    const supabase = getSupabaseAuthClient();
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (!error && data?.user?.email) {
      supabaseAuthSuccess = true;
      supabaseEmail = data.user.email.toLowerCase();
    }
  } catch {
    // Si Supabase no está configurado o falla, se continúa al fallo de sesión
  }

  if (supabaseAuthSuccess && supabaseEmail) {
    const usuario = await prisma.usuario.findUnique({
      where: { correo: supabaseEmail },
    });

    if (!usuario || !usuario.rol) {
      throw new ApiAuthError("No se encontró un usuario autorizado", 403);
    }

    return {
      id: usuario.id,
      correo: usuario.correo,
      nombreCompleto: usuario.nombreCompleto,
      rol: usuario.rol,
    };
  }

  throw new ApiAuthError("La sesión no es válida o ha expirado", 401);
}

export async function requireRoles(
  request: Request,
  roles: RolUsuario[],
): Promise<AuthenticatedUser> {
  const usuario = await requireAuthenticatedUser(request);

  if (!roles.includes(usuario.rol)) {
    throw new ApiAuthError("No tiene permiso para realizar esta operación", 403);
  }

  return usuario;
}
