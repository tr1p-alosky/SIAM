import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { TipoTramite, CategoriaMateria, EstadoTicket, Prisma } from '@prisma/client';
import { requireAuthenticatedUser } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-response';

const adjuntoSchema = z.object({
  'nombre-archivo': z.string().min(1, 'El nombre del archivo es requerido'),
  'url-archivo': z.string().url('La URL del archivo debe ser válido'),
});

const crearTicketSchema = z.object({
  'materia-id': z.number({ required_error: 'El ID de la materia es requerido' }),
  'grupo-materia-id': z.number().optional(),
  'tipo-tramite': z.nativeEnum(TipoTramite, { required_error: 'El tipo de trámite es requerido' }),
  'motivo-justificacion': z.string().min(10, 'La justificación debe tener al menos 10 caracteres'),
  'archivos-adjuntos': z.array(adjuntoSchema).optional().default([]),
});

export async function POST(request: NextRequest) {
  try {
    const usuario = await requireAuthenticatedUser(request);
    const body = await request.json();
    const validation = crearTicketSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          estatus: 'error',
          mensaje: 'Campos del formulario no válidos',
          'errores-validacion': validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      'materia-id': materiaId,
      'grupo-materia-id': grupoMateriaId,
      'tipo-tramite': tipoTramite,
      'motivo-justificacion': motivoJustificacion,
      'archivos-adjuntos': archivosAdjuntos,
    } = validation.data;

    // Obtener materia seleccionada para determinar categoría
    const materia = await prisma.materia.findUnique({
      where: { id: materiaId },
    });

    if (!materia) {
      return NextResponse.json(
        {
          estatus: 'error',
          mensaje: 'La materia seleccionada no existe en el catálogo',
        },
        { status: 404 }
      );
    }

    // Obtener periodo académico activo
    const periodoActivo = await prisma.periodoAcademico.findFirst({
      where: { estaActivo: true },
      orderBy: { id: 'desc' },
    });

    if (!periodoActivo) {
      return NextResponse.json(
        {
          estatus: 'error',
          mensaje: 'No hay un periodo académico activo para realizar trámites',
        },
        { status: 400 }
      );
    }

    if (usuario.rol !== 'ALUMNO') {
      return NextResponse.json(
        {
          estatus: 'error',
          mensaje: 'Solo los alumnos pueden crear solicitudes',
        },
        { status: 403 }
      );
    }

    // Regla de Negocio (RF04): Cumplimiento de índice único para trámites de Inglés activos
    if (materia.categoria === CategoriaMateria.INGLES) {
      const ticketInglesExistente = await prisma.ticket.findFirst({
        where: {
          alumnoId: usuario.id,
          periodoId: periodoActivo.id,
          categoria: CategoriaMateria.INGLES,
          estado: {
            notIn: [EstadoTicket.RECHAZADO, EstadoTicket.CERRADO],
          },
        },
      });

      if (ticketInglesExistente) {
        return NextResponse.json(
          {
            estatus: 'error',
            mensaje:
              'Ya tienes una solicitud activa de materia de Inglés en este periodo. Debes esperar a que sea resuelta o cerrada para iniciar otra.',
          },
          { status: 400 }
        );
      }
    }

    // Transacción Prisma para crear Ticket + DetalleTicket + Adjuntos
    const nuevoTicket = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const ticket = await tx.ticket.create({
        data: {
          alumnoId: usuario.id,
          periodoId: periodoActivo.id,
          tipoTramite: tipoTramite,
          categoria: materia.categoria,
          estado: EstadoTicket.CREADO,
          comentarios: motivoJustificacion,
        },
      });

      await tx.detalleTicket.create({
        data: {
          ticketId: ticket.id,
          materiaId: materiaId,
          grupoDestinoId: grupoMateriaId || null,
        },
      });

      if (archivosAdjuntos.length > 0) {
        await tx.adjuntoTicket.createMany({
          data: archivosAdjuntos.map((adj) => ({
            ticketId: ticket.id,
            nombreArchivo: adj['nombre-archivo'],
            urlArchivo: adj['url-archivo'],
          })),
        });
      }

      return ticket;
    });

    return NextResponse.json(
      {
        estatus: 'exito',
        mensaje: 'Solicitud creada correctamente',
        'datos-ticket': {
          'ticket-id': nuevoTicket.id,
          'folio-ticket': `TCK-${new Date().getFullYear()}-${String(nuevoTicket.folio).padStart(4, '0')}`,
          'tipo-tramite': nuevoTicket.tipoTramite,
          'estado-ticket': nuevoTicket.estado,
          'fecha-creacion': nuevoTicket.creadoEn,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return apiErrorResponse(
      error,
      'Error interno del servidor al procesar la solicitud',
    );
  }
}
