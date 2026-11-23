import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CategoriaMateria, EstadoTicket, Prisma } from '@prisma/client';
import { requireRoles } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    await requireRoles(request, ['COORDINADOR', 'ADMINISTRADOR']);
    const { searchParams } = new URL(request.url);
    const busquedaTexto = searchParams.get('busqueda-texto')?.trim();
    const categoriaFiltro = searchParams.get('categoria-materia') as CategoriaMateria | null;

    // Consultar tickets en estado pendiente (CREADO o EN_REVISION_COORDINACION)
    const ticketsPendientes = await prisma.ticket.findMany({
      where: {
        estado: {
          in: [EstadoTicket.CREADO, EstadoTicket.EN_REVISION_COORDINACION],
        },
        ...(categoriaFiltro ? { categoria: categoriaFiltro } : {}),
        ...(busquedaTexto
          ? {
              OR: [
                {
                  alumno: {
                    nombreCompleto: {
                      contains: busquedaTexto,
                      mode: 'insensitive',
                    },
                  },
                },
                {
                  alumno: {
                    expediente: {
                      contains: busquedaTexto,
                      mode: 'insensitive',
                    },
                  },
                },
                {
                  detalles: {
                    some: {
                      materia: {
                        nombre: {
                          contains: busquedaTexto,
                          mode: 'insensitive',
                        },
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        alumno: {
          select: {
            id: true,
            expediente: true,
            nombreCompleto: true,
            correo: true,
          },
        },
        detalles: {
          include: {
            materia: true,
            grupoDestino: true,
          },
        },
        adjuntos: true,
      },
      orderBy: {
        creadoEn: 'asc',
      },
    });

    const bandejaPendientes = ticketsPendientes.map((t: Prisma.TicketGetPayload<{ include: { alumno: { select: { id: true; expediente: true; nombreCompleto: true; correo: true } }; detalles: { include: { materia: true; grupoDestino: true } }; adjuntos: true } }>) => {
      const detalle = t.detalles[0];
      return {
        'ticket-id': t.id,
        'folio-ticket': `TCK-${new Date(t.creadoEn || Date.now()).getFullYear()}-${String(t.folio).padStart(4, '0')}`,
        'tipo-tramite': t.tipoTramite,
        'estado-ticket': t.estado,
        'categoria-materia': t.categoria,
        'expediente-alumno': t.alumno.expediente,
        'nombre-alumno': t.alumno.nombreCompleto,
        'correo-alumno': t.alumno.correo,
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
        'total-pendientes': bandejaPendientes.length,
        'bandeja-pendientes': bandejaPendientes,
      },
      { status: 200 }
    );
  } catch (error) {
    return apiErrorResponse(
      error,
      'Error interno del servidor al consultar solicitudes pendientes',
    );
  }
}
