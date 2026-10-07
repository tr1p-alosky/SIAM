import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EstadoTicket } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const estadoFiltro = searchParams.get('estado-ticket') as EstadoTicket | null;

    // Obtener alumno autenticado / en sesión
    const alumno = await prisma.usuario.findFirst({
      where: { rol: 'ALUMNO' },
    });

    if (!alumno) {
      return NextResponse.json(
        {
          estatus: 'error',
          mensaje: 'Debe iniciar sesión para ver sus solicitudes',
        },
        { status: 401 }
      );
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        alumnoId: alumno.id,
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

    const listaSolicitudes = tickets.map((t: any) => {
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
        'archivos-adjuntos': t.adjuntos.map((a: any) => ({
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
  } catch (error: any) {
    console.error('Error al consultar solicitudes del alumno:', error);
    return NextResponse.json(
      {
        estatus: 'error',
        mensaje: 'Error interno del servidor al consultar la bandeja de solicitudes',
      },
      { status: 500 }
    );
  }
}
