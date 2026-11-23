import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const TAMANO_MAXIMO = 5 * 1024 * 1024; // 5 MB
const CARPETA_DESTINO = path.join(process.cwd(), 'uploads');

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const archivo = formData.get('archivo');
    const tipo = formData.get('tipo');

    if (!(archivo instanceof File)) {
      return NextResponse.json(
        { ok: false, mensaje: 'No se recibió ningún archivo.' },
        { status: 400 }
      );
    }

    if (
      tipo !== 'kardex' &&
      tipo !== 'documentacion' &&
      tipo !== 'constancia'
    ) {
      return NextResponse.json(
        { ok: false, mensaje: 'Tipo de documento inválido.' },
        { status: 400 }
      );
    }

    const esPdf =
      archivo.type === 'application/pdf' ||
      archivo.name.toLowerCase().endsWith('.pdf');

    if (!esPdf) {
      return NextResponse.json(
        { ok: false, mensaje: 'Solo se permiten archivos PDF.' },
        { status: 400 }
      );
    }

    if (archivo.size > TAMANO_MAXIMO) {
      return NextResponse.json(
        { ok: false, mensaje: 'El archivo no debe pesar más de 5 MB.' },
        { status: 400 }
      );
    }

    await mkdir(CARPETA_DESTINO, { recursive: true });

    const nombreSeguro = `${crypto.randomUUID()}.pdf`;
    const rutaFinal = path.join(CARPETA_DESTINO, nombreSeguro);

    const contenido = Buffer.from(await archivo.arrayBuffer());
    await writeFile(rutaFinal, contenido);

    return NextResponse.json({
      ok: true,
      mensaje: `Archivo ${tipo} cargado correctamente.`,
      nombreArchivo: nombreSeguro,
    });
  } catch {
    return NextResponse.json(
      { ok: false, mensaje: 'Error al procesar el archivo.' },
      { status: 500 }
    );
  }
}