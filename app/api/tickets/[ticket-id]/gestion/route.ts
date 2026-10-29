import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { EstadoTicket, Prisma } from '@prisma/client';
import { requireRoles } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-response';

const gestionSchema = z.object({
  'accion-resolucion': z.enum(['APROBAR', 'RECHAZAR', 'CERRAR'], {
    required_error: 'La acción de resolución debe ser APROBAR, RECHAZAR o CERRAR',
  }),
  'observacion-coordinador': z
    .string({ required_error: 'La observación o motivo de resolución es obligatorio' })
    .min(5, 'La observación debe contener al menos 5 caracteres'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ 'ticket-id': string }> }
) {
  try {
    const coordinador = await requireRoles(request, ['COORDINADOR', 'ADMINISTRADOR']);
    const resolvedParams = await params;
    const ticketId = resolvedParams['ticket-id'];

    if (!ticketId) {
      return NextResponse.json(
        {
          estatus: 'error',
          mensaje: 'El identificador del ticket es requerido en la ruta',
        },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        {
          estatus: 'error',
          mensaje: 'El cuerpo de la petición no puede estar vacío',
        },
        { status: 400 }
      );
    }

    const validation = gestionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          estatus: 'error',
          mensaje: 'Datos de gestión no válidos',
          'errores-validacion': validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { 'accion-resolucion': accionResolucion, 'observacion-coordinador': observacionCoordinador } =
      validation.data;

    // Buscar ticket existente
    const ticketExistente = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticketExistente) {
      return NextResponse.json(
        {
          estatus: 'error',
          mensaje: 'No se encontró la solicitud especificada',
        },
        { status: 404 }
      );
    }

    const estadoAnterior = ticketExistente.estado;
    let nuevoEstado: EstadoTicket;
    if (accionResolucion === 'APROBAR') {
      nuevoEstado = EstadoTicket.APROBADO_ADMIN;
    } else if (accionResolucion === 'RECHAZAR') {
      nuevoEstado = EstadoTicket.RECHAZADO;
    } else {
      nuevoEstado = EstadoTicket.CERRADO;
    }

    // Transacción Prisma: Actualiza Ticket + Registro de Auditoría
    const ticketActualizado = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const ticket = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          estado: nuevoEstado,
          actualizadoEn: new Date(),
        },
      });

      // Registrar en Bitácora de Auditoría (Trazabilidad obligatoria)
      await tx.bitacoraAuditoria.create({
        data: {
          ticketId: ticket.id,
          realizadoPor: coordinador.id,
          accion: `RESOLUCION_${accionResolucion}`,
          estadoAnterior: estadoAnterior,
          estadoNuevo: nuevoEstado,
          descripcion: observacionCoordinador,
          direccionIp: request.headers.get('x-forwarded-for') || '127.0.0.1',
        },
      });

      // Si hay mensaje del coordinador, registrarlo en la conversación interna
      await tx.mensajeTicket.create({
        data: {
          ticketId: ticket.id,
          remitenteId: coordinador.id,
          mensaje: `[${accionResolucion}]: ${observacionCoordinador}`,
        },
      });

      return ticket;
    });

    const accionVerbo =
      accionResolucion === 'APROBAR'
        ? 'aprobada'
        : accionResolucion === 'RECHAZAR'
        ? 'rechazada'
        : 'cerrada';

    return NextResponse.json(
      {
        estatus: 'exito',
        mensaje: `La solicitud ha sido ${accionVerbo} correctamente`,
        'ticket-actualizado': {
          'ticket-id': ticketActualizado.id,
          'folio-ticket': `TCK-${new Date(ticketActualizado.creadoEn || Date.now()).getFullYear()}-${String(ticketActualizado.folio).padStart(4, '0')}`,
          'estado-anterior': estadoAnterior,
          'nuevo-estado': ticketActualizado.estado,
          'observacion-coordinador': observacionCoordinador,
          'fecha-actualizacion': ticketActualizado.actualizadoEn,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return apiErrorResponse(
      error,
      'Error interno del servidor al procesar la gestión de la solicitud',
    );
  }
}
