'use client';

import { useRef, useState } from 'react';

interface RespuestaSubida {
  ok: boolean;
  mensaje: string;
  nombreArchivo?: string;
}

const TAMANO_MAXIMO = 5 * 1024 * 1024; // 5 MB

export default function DocumentosPage() {
  const inputKardex = useRef<HTMLInputElement>(null);
  const inputDocumentacion = useRef<HTMLInputElement>(null);
  const inputConstancia = useRef<HTMLInputElement>(null);

  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const validarPdf = (archivo: File): string | null => {
    if (archivo.type !== 'application/pdf') {
      return 'Solo se permiten archivos PDF.';
    }

    if (archivo.size > TAMANO_MAXIMO) {
      return 'El archivo no debe pesar más de 5 MB.';
    }

    return null;
  };

  const mostrarVistaPrevia = (archivo: File) => {
    const url = URL.createObjectURL(archivo);
    setVistaPrevia(url);
  };

  const subirArchivo = async (
    event: React.FormEvent<HTMLFormElement>,
    tipo: 'kardex' | 'documentacion' | 'constancia',
    inputRef: React.RefObject<HTMLInputElement | null>
  ) => {
    event.preventDefault();
    setMensaje(null);

    const input = inputRef.current;
    const archivo = input?.files?.[0];

    if (!archivo) {
      setMensaje('Selecciona un archivo PDF.');
      return;
    }

    const errorValidacion = validarPdf(archivo);

    if (errorValidacion) {
      setMensaje(errorValidacion);
      return;
    }

    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('tipo', tipo);

    try {
      setCargando(true);

      const respuesta = await fetch('/api/subir-pdf', {
        method: 'POST',
        body: formData,
      });

      const datos = (await respuesta.json()) as RespuestaSubida;

      if (!respuesta.ok || !datos.ok) {
        throw new Error(datos.mensaje || 'No se pudo subir el archivo.');
      }

      setMensaje(datos.mensaje);
      mostrarVistaPrevia(archivo);

      if (input) {
        input.value = '';
      }
    } catch (error) {
      setMensaje(
        error instanceof Error
          ? error.message
          : 'Ocurrió un error inesperado.'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="documentos">
      <h1>Kardex</h1>

      <form
        onSubmit={(event) =>
          subirArchivo(event, 'kardex', inputKardex)
        }
      >
        <label htmlFor="pdf-kardex">Elige un archivo PDF:</label>

        <input
          ref={inputKardex}
          type="file"
          id="pdf-kardex"
          name="archivo"
          accept="application/pdf"
          onChange={(event) => {
            const archivo = event.target.files?.[0];

            if (!archivo) return;

            const error = validarPdf(archivo);

            if (error) {
              setMensaje(error);
              event.target.value = '';
              return;
            }

            setMensaje(`Archivo seleccionado: ${archivo.name}`);
            mostrarVistaPrevia(archivo);
          }}
        />

        <button type="submit" disabled={cargando}>
          {cargando ? 'Subiendo...' : 'Cargar archivo'}
        </button>
      </form>

      <h1>Documentación</h1>

      <form
        onSubmit={(event) =>
          subirArchivo(event, 'documentacion', inputDocumentacion)
        }
      >
        <label htmlFor="pdf-documentacion">Elige un archivo PDF:</label>

        <input
          ref={inputDocumentacion}
          type="file"
          id="pdf-documentacion"
          name="archivo"
          accept="application/pdf"
          onChange={(event) => {
            const archivo = event.target.files?.[0];

            if (!archivo) return;

            const error = validarPdf(archivo);

            if (error) {
              setMensaje(error);
              event.target.value = '';
              return;
            }

            setMensaje(`Archivo seleccionado: ${archivo.name}`);
          }}
        />

        <button type="submit" disabled={cargando}>
          {cargando ? 'Subiendo...' : 'Cargar archivo'}
        </button>
      </form>

      <h1>Constancia</h1>

      <form
        onSubmit={(event) =>
          subirArchivo(event, 'constancia', inputConstancia)
        }
      >
        <label htmlFor="pdf-constancia">Elige un archivo PDF:</label>

        <input
          ref={inputConstancia}
          type="file"
          id="pdf-constancia"
          name="archivo"
          accept="application/pdf"
          onChange={(event) => {
            const archivo = event.target.files?.[0];

            if (!archivo) return;

            const error = validarPdf(archivo);

            if (error) {
              setMensaje(error);
              event.target.value = '';
              return;
            }

            setMensaje(`Archivo seleccionado: ${archivo.name}`);
          }}
        />

        <button type="submit" disabled={cargando}>
          {cargando ? 'Subiendo...' : 'Cargar archivo'}
        </button>
      </form>

      {mensaje && <p className="mensaje">{mensaje}</p>}

      {vistaPrevia && (
        <iframe
          src={vistaPrevia}
          title="Vista previa del PDF"
          className="vista-pdf"
        />
      )}
    </div>
  );
}