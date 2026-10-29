import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { TipoTramite, CategoriaMateria, EstadoTicket, Prisma } from '@prisma/client';
import { requireAuthenticatedUser, requireRoles } from '@/lib/auth';
import { apiErrorResponse } from '@/lib/api-response';

const adjuntoSchema = z.object({
  'nombre-archivo': z.string().min(1, 'El nombre del archivo es requerido'),
  'url-archivo': z.string().url('La URL del archivo debe ser válida'),
  'tipo-documento': z.string().optional(),
});

const crearTicketSchema = z.object({
  'materia-id': z.coerce.number({ required_error: 'El ID de la materia es requerido' }),
  'grupo-materia-id': z.coerce.number().optional().nullable(),
  'tipo-tramite': z.nativeEnum(TipoTramite, { required_error: 'El tipo de trámite es requerido' }),
  'motivo-justificacion': z.string().min(10, 'La justificación debe tener al menos 10 caracteres'),
  'archivos-adjuntos': z.array(adjuntoSchema).optional().default([]),
});

/**
 * POST /api/tickets
 * Creación de nueva solicitud académica por parte del alumno
 */
export async function POST(request: NextRequest) {
  try {
    const usuario = await requireAuthenticatedUser(request);
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

    if (usuario.rol !== 'ALUMNO') {
      return NextResponse.json(
        {
          estatus: 'error',
          mensaje: 'Solo los alumnos pueden crear solicitudes',
        },
        { status: 403 }
      );
    }

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

    // Obtener periodo académico activo para la categoría de la materia
    let periodoActivo = await prisma.periodoAcademico.findFirst({
      where: {
        estaActivo: true,
        categoria: materia.categoria ?? CategoriaMateria.CURRICULAR,
      },
      orderBy: { id: 'desc' },
    });

    // Fallback si no hay periodo específico por categoría, buscar cualquier periodo activo
    if (!periodoActivo) {
      periodoActivo = await prisma.periodoAcademico.findFirst({
        where: { estaActivo: true },
        orderBy: { id: 'desc' },
      });
    }

    if (!periodoActivo) {
      return NextResponse.json(
        {
          estatus: 'error',
          mensaje: 'No hay un periodo académico activo para realizar trámites',
        },
        { status: 400 }
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

/**
 * GET /api/tickets
 * Consulta general de todos los trámites con sus datos de estudiante asociados (JOIN)
 * para el personal de Coordinación y Administración (Sprint 3 / RF11).
 */
export async function GET(request: NextRequest) {
  try {
    await requireRoles(request, ['COORDINADOR', 'ADMINISTRADOR']);

    const { searchParams } = new URL(request.url);
    const estadoFiltro = searchParams.get('estado-ticket') as EstadoTicket | null;
    const categoriaFiltro = searchParams.get('categoria-materia') as CategoriaMateria | null;
    const tipoTramiteFiltro = searchParams.get('tipo-tramite') as TipoTramite | null;
    const busquedaTexto = searchParams.get('busqueda-texto')?.trim();
    const expedienteFiltro = searchParams.get('expediente-alumno')?.trim();

    const tickets = await prisma.ticket.findMany({
      where: {
        ...(estadoFiltro ? { estado: estadoFiltro } : {}),
        ...(categoriaFiltro ? { categoria: categoriaFiltro } : {}),
        ...(tipoTramiteFiltro ? { tipoTramite: tipoTramiteFiltro } : {}),
        ...(expedienteFiltro
          ? {
              alumno: {
                expediente: {
                  equals: expedienteFiltro,
                  mode: 'insensitive',
                },
              },
            }
          : {}),
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
            telefono: true,
            informacionAcademica: {
              include: {
                carrera: {
                  select: {
                    id: true,
                    nombre: true,
                    clave: true,
                  },
                },
              },
            },
          },
        },
        detalles: {
          include: {
            materia: {
              include: {
                carrera: true,
              },
            },
            grupoDestino: true,
            grupoOrigen: true,
          },
        },
        adjuntos: true,
        periodo: true,
      },
      orderBy: {
        creadoEn: 'desc',
      },
    });

    const datosTramites = tickets.map((t) => {
      const detalle = t.detalles[0];
      const carreraAlumno = t.alumno.informacionAcademica?.carrera?.nombre ?? null;
      const semestreAlumno = t.alumno.informacionAcademica?.semestreActual ?? null;

      return {
        'ticket-id': t.id,
        'folio-ticket': `TCK-${new Date(t.creadoEn || Date.now()).getFullYear()}-${String(t.folio).padStart(4, '0')}`,
        'tipo-tramite': t.tipoTramite,
        'estado-ticket': t.estado,
        'categoria-materia': t.categoria,
        'motivo-justificacion': t.comentarios,
        'fecha-creacion': t.creadoEn,
        'fecha-actualizacion': t.actualizadoEn,
        'periodo-nombre': t.periodo?.nombre ?? null,
        // Datos del estudiante (JOIN)
        'alumno-id': t.alumno.id,
        'expediente-alumno': t.alumno.expediente,
        'nombre-alumno': t.alumno.nombreCompleto,
        'correo-alumno': t.alumno.correo,
        'telefono-alumno': t.alumno.telefono,
        'carrera-alumno': carreraAlumno,
        'semestre-alumno': semestreAlumno,
        // Datos de la materia asociada (JOIN)
        'materia-id': detalle?.materia?.id ?? null,
        'materia-clave': detalle?.materia?.clave ?? null,
        'materia-nombre': detalle?.materia?.nombre ?? null,
        'grupo-destino-clave': detalle?.grupoDestino?.claveGrupo ?? null,
        'grupo-origen-clave': detalle?.grupoOrigen?.claveGrupo ?? null,
        // Adjuntos
        'archivos-adjuntos': t.adjuntos.map((a) => ({
          'adjunto-id': a.id,
          'nombre-archivo': a.nombreArchivo,
          'url-archivo': a.urlArchivo,
          'subido-en': a.subidoEn,
        })),
      };
    });

    return NextResponse.json(
      {
        estatus: 'exito',
        'total-tramites': datosTramites.length,
        'datos-tramites': datosTramites,
      },
      { status: 200 }
    );
  } catch (error) {
    return apiErrorResponse(
      error,
      'Error interno del servidor al consultar el registro general de trámites',
    );
  }
}
