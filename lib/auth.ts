import { createClient } from "@supabase/supabase-js";
import { RolUsuario } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonymousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonymousKey) {
    throw new ApiAuthError("La configuración de Supabase no está disponible", 500);
  }

  return createClient(url, anonymousKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function requireAuthenticatedUser(
  request: Request,
): Promise<AuthenticatedUser> {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : undefined;

  if (!accessToken) {
    throw new ApiAuthError("Debe iniciar sesión para acceder a esta API", 401);
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data.user.email) {
    throw new ApiAuthError("La sesión de Supabase no es válida", 401);
  }

  const correo = data.user.email.toLowerCase();
  let usuario: Awaited<ReturnType<typeof prisma.usuario.findUnique>>;

  try {
    usuario = await prisma.usuario.findUnique({
      where: { correo },
    });
  } catch (error) {
    console.error("Error al consultar el usuario autenticado", error);
    throw new ApiAuthError("No se pudo verificar la sesión", 500);
  }

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
