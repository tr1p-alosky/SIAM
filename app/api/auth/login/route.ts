import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { crearTokenSesion } from "@/lib/auth";
import { apiErrorResponse } from "@/lib/api-response";

const loginSchema = z
  .object({
    "correo-institucional": z.string().trim().optional(),
    "expediente-alumno": z.string().trim().optional(),
    "contrasena-usuario": z
      .string({ required_error: "La contraseña es requerida" })
      .min(1, "La contraseña no puede estar vacía"),
  })
  .refine(
    (data) => Boolean(data["correo-institucional"] || data["expediente-alumno"]),
    {
      message: "Debe ingresar el correo institucional o el expediente del alumno",
      path: ["correo-institucional"],
    },
  );

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        {
          estatus: "error",
          mensaje: "El cuerpo de la petición no puede estar vacío",
        },
        { status: 400 },
      );
    }

    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          estatus: "error",
          mensaje: "Campos de inicio de sesión no válidos",
          "errores-validacion": validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const {
      "correo-institucional": correoInput,
      "expediente-alumno": expedienteInput,
      "contrasena-usuario": contrasenaInput,
    } = validation.data;

    const identificador = (correoInput || expedienteInput || "").toLowerCase();

    // Buscar al usuario por correo o por expediente (case-insensitive)
    const usuario = await prisma.usuario.findFirst({
      where: {
        OR: [
          { correo: { equals: identificador, mode: "insensitive" } },
          { expediente: { equals: identificador, mode: "insensitive" } },
        ],
      },
    });

    if (!usuario) {
      return NextResponse.json(
        {
          estatus: "error",
          mensaje: "Credenciales de acceso incorrectas o usuario no encontrado",
        },
        { status: 401 },
      );
    }

    // Verificar contraseña encriptada con bcryptjs
    const esContrasenaValida = await bcrypt.compare(
      contrasenaInput,
      usuario.contrasenaHash,
    );

    if (!esContrasenaValida) {
      return NextResponse.json(
        {
          estatus: "error",
          mensaje: "Credenciales de acceso incorrectas",
        },
        { status: 401 },
      );
    }

    if (!usuario.rol) {
      return NextResponse.json(
        {
          estatus: "error",
          mensaje: "El usuario no cuenta con un rol asignado",
        },
        { status: 403 },
      );
    }

    // Generar token de sesión firmado
    const token = crearTokenSesion({
      id: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
    });

    const response = NextResponse.json(
      {
        estatus: "exito",
        mensaje: "Inicio de sesión exitoso",
        "token-acceso": token,
        "datos-usuario": {
          "usuario-id": usuario.id,
          "expediente-alumno": usuario.expediente,
          "correo-institucional": usuario.correo,
          "nombre-completo": usuario.nombreCompleto,
          "rol-usuario": usuario.rol,
          "es-2fa-activo": usuario.es2faActivo ?? false,
        },
      },
      { status: 200 },
    );

    // Asignar cookie httpOnly de sesión
    response.cookies.set({
      name: "siam_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 horas
    });

    return response;
  } catch (error) {
    return apiErrorResponse(
      error,
      "Error interno del servidor al procesar el inicio de sesión",
    );
  }
}

