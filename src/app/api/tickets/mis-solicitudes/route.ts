import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EstadoTicket, Prisma } from '@prisma/client';
import { requireRoles } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const usuario = await requireRoles(request, ['ALUMNO']);
    const { searchParams } = new URL(request.url);
    const estadoFiltro = searchParams.get('estado-ticket') as EstadoTicket | null;

    const tickets = await prisma.ticket.findMany({
      where: {
        alumnoId: usuario.id,
        ...(estadoFiltro ? { estado: estadoFiltro } : {}),
      },
      include: {
        detalles: {
          include: {
            materia: true,
            grupoDestino: true,
          },
        },
        adjuntos: true,
      },
      orderBy: {
        creadoEn: 'desc',
      },
    });

    const listaSolicitudes = tickets.map((t: Prisma.TicketGetPayload<{ include: { detalles: { include: { materia: true; grupoDestino: true } }; adjuntos: true } }>) => {
      const detalle = t.detalles[0];
      return {
        'ticket-id': t.id,
        'folio-ticket': `TCK-${new Date(t.creadoEn || Date.now()).getFullYear()}-${String(t.folio).padStart(4, '0')}`,
        'tipo-tramite': t.tipoTramite,
        'estado-ticket': t.estado,
        'categoria-materia': t.categoria,
        'motivo-justificacion': t.comentarios,
        'fecha-creacion': t.creadoEn,
        'materia-nombre': detalle?.materia?.nombre ?? null,
        'materia-clave': detalle?.materia?.clave ?? null,
        'grupo-clave': detalle?.grupoDestino?.claveGrupo ?? null,
        'archivos-adjuntos': t.adjuntos.map((a) => ({
          'adjunto-id': a.id,
          'nombre-archivo': a.nombreArchivo,
          'url-archivo': a.urlArchivo,
        })),
      };
    });

    return NextResponse.json(
      {
        estatus: 'exito',
        'total-solicitudes': listaSolicitudes.length,
        'lista-solicitudes': listaSolicitudes,
      },
      { status: 200 }
    );
  } catch (error) {
    return apiErrorResponse(
      error,
      'Error interno del servidor al consultar la bandeja de solicitudes',
    );
  }
}
