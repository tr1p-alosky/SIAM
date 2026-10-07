import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { CategoriaMateria } from '@prisma/client';

const querySchema = z.object({
  'carrera-id': z.string().optional(),
  'semestre-numero': z.string().optional(),
  'categoria-materia': z.nativeEnum(CategoriaMateria).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryResult = querySchema.safeParse({
      'carrera-id': searchParams.get('carrera-id') || undefined,
      'semestre-numero': searchParams.get('semestre-numero') || undefined,
      'categoria-materia': searchParams.get('categoria-materia') || undefined,
    });

    if (!queryResult.success) {
      return NextResponse.json(
        {
          estatus: 'error',
          mensaje: 'Parámetros de búsqueda no válidos',
          'errores-validacion': queryResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const carreraId = queryResult.data['carrera-id']
      ? parseInt(queryResult.data['carrera-id'], 10)
      : undefined;
    const semestreNumero = queryResult.data['semestre-numero']
      ? parseInt(queryResult.data['semestre-numero'], 10)
      : undefined;
    const categoria = queryResult.data['categoria-materia'];

    const materias = await prisma.materia.findMany({
      where: {
        ...(carreraId && !isNaN(carreraId) ? { carreraId } : {}),
        ...(semestreNumero && !isNaN(semestreNumero) ? { semestre: semestreNumero } : {}),
        ...(categoria ? { categoria } : {}),
      },
      include: {
        carrera: {
          select: {
            nombre: true,
            clave: true,
          },
        },
      },
      orderBy: [
        { semestre: 'asc' },
        { nombre: 'asc' },
      ],
    });

    const datosMaterias = materias.map((m: any) => ({
      'materia-id': m.id,
      'clave-materia': m.clave,
      'nombre-materia': m.nombre,
      'creditos-materia': 8,
      'semestre-numero': m.semestre,
      'categoria-materia': m.categoria,
      'carrera-nombre': m.carrera?.nombre ?? null,
      'carrera-clave': m.carrera?.clave ?? null,
    }));

    return NextResponse.json(
      {
        estatus: 'exito',
        'total-registros': datosMaterias.length,
        'datos-materias': datosMaterias,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error al consultar materias:', error);
    return NextResponse.json(
      {
        estatus: 'error',
        mensaje: 'Error interno del servidor al consultar el catálogo de materias',
      },
      { status: 500 }
    );
  }
}
