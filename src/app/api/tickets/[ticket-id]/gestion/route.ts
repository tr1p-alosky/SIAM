import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { EstadoTicket, Prisma } from '@prisma/client';
import { requireRoles } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-response';

const gestionSchema = z.object({
  'accion-resolucion': z.enum(['APROBAR', 'RECHAZAR'], {
    required_error: 'La acción de resolución debe ser APROBAR o RECHAZAR',
  }),
  'observacion-coordinador': z
    .string({ required_error: 'La observación o motivo de resolución es obligatorio' })
    .min(5, 'La observación debe contener al menos 5 caracteres'),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { 'ticket-id': string } }
) {
  try {
    const coordinador = await requireRoles(request, ['COORDINADOR', 'ADMINISTRADOR']);
    const ticketId = params['ticket-id'];

    if (!ticketId) {
      return NextResponse.json(
        {
          estatus: 'error',
          mensaje: 'El identificador del ticket es requerido en la ruta',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
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
    const nuevoEstado =
      accionResolucion === 'APROBAR'
        ? EstadoTicket.APROBADO_ADMIN
        : EstadoTicket.RECHAZADO;

    // Transacción Prisma: Actualiza Ticket + Registro de Auditoría
    const ticketActualizado = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const ticket = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          estado: nuevoEstado,
          actualizadoEn: new Date(),
        },
      });

      // Registrar en Bitácora de Auditoría
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

      // Si hay mensaje del coordinador, registrarlo en la conversación
      await tx.mensajeTicket.create({
        data: {
          ticketId: ticket.id,
          remitenteId: coordinador.id,
          mensaje: `[${accionResolucion}]: ${observacionCoordinador}`,
        },
      });

      return ticket;
    });

    return NextResponse.json(
      {
        estatus: 'exito',
        mensaje: `La solicitud ha sido ${accionResolucion === 'APROBAR' ? 'aprobada' : 'rechazada'} correctamente`,
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
