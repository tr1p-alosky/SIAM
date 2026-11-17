'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SolicitudEstudiante {
  'ticket-id': string;
  'folio-ticket': string;
  'tipo-tramite': string;
  'estado-ticket': string;
  'categoria-materia': string | null;
  'motivo-justificacion': string | null;
  'fecha-creacion': string;
  'materia-nombre': string | null;
  'materia-clave': string | null;
  'grupo-clave': string | null;
  'archivos-adjuntos': Array<{
    'adjunto-id'?: number;
    'nombre-archivo': string;
    'url-archivo': string;
  }>;
}

interface UsuarioSesion {
  'usuario-id': string;
  'expediente-alumno': string;
  'correo-institucional': string;
  'nombre-completo': string;
  'rol-usuario': string;
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<SolicitudEstudiante[]>([]);
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarSolicitudes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('siam_token') : null;
      const storedUser = typeof window !== 'undefined' ? localStorage.getItem('siam_user') : null;

      if (storedUser) {
        setUsuario(JSON.parse(storedUser));
      }

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/tickets/mis-solicitudes', {
        method: 'GET',
        headers,
      });

      if (res.status === 401 || res.status === 403) {
        router.push('/login');
        return;
      }

      const data = await res.json();
      if (res.ok && data['lista-solicitudes']) {
        setSolicitudes(data['lista-solicitudes']);
      } else {
        setError(data.mensaje || 'No se pudieron obtener las solicitudes.');
      }
    } catch {
      setError('Error de comunicación con el servidor.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes]);

  const handleCerrarSesion = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('siam_token');
      localStorage.removeItem('siam_user');
      // Limpiar cookie
      document.cookie = 'siam_token=; Max-Age=0; path=/;';
    }
    router.push('/login');
  };

  const getBadgeColor = (estado: string) => {
    switch (estado) {
      case 'APROBADO_ADMIN':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'RECHAZADO':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'EN_REVISION_COORDINACION':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CREADO':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barra superior de navegación */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow">
                U
              </span>
              <div>
                <span className="text-base font-bold text-gray-900 block leading-tight">SIAM UAQ</span>
                <span className="text-[11px] text-gray-500 block leading-tight">Portal de Estudiante</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              Inicio Portal
            </Link>
            <button
              onClick={handleCerrarSesion}
              className="text-xs text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Tarjeta de bienvenida y datos del alumno */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase font-semibold tracking-wider text-blue-600">
              Panel del Alumno
            </span>
            <h1 className="text-2xl font-bold text-gray-900">
              {usuario ? usuario['nombre-completo'] : 'Estudiante UAQ'}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 pt-1">
              <span>
                <b>Expediente:</b> {usuario?.['expediente-alumno'] || 'No disponible'}
              </span>
              <span>•</span>
              <span>
                <b>Correo:</b> {usuario?.['correo-institucional'] || 'No disponible'}
              </span>
              <span>•</span>
              <span className="bg-green-50 text-green-700 font-medium px-2 py-0.5 rounded border border-green-200">
                Periodo 2026-2 Activo
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={cargarSolicitudes}
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition"
            >
              Actualizar Bandeja
            </button>
          </div>
        </div>

        {/* Resumen de Requisitos y Alertas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 space-y-1">
            <span className="font-bold text-sm block text-blue-950">📋 Regla RF04 (Límites)</span>
            <p>
              Máximo 5 materias por alumno y hasta 2 solicitudes activas por materia curricular.
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 space-y-1">
            <span className="font-bold text-sm block text-amber-950">🌐 Trámites de Inglés</span>
            <p>
              Límite estricto de 1 solo trámite activo de lengua extranjera por periodo académico.
            </p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 space-y-1">
            <span className="font-bold text-sm block text-emerald-950">📄 Evidencias Obligatorias</span>
            <p>
              Toda solicitud debe contar con comprobante probatorio (Kardex o carta de justificación).
            </p>
          </div>
        </div>

        {/* Mensaje de error si falla */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-xl">
            {error}
          </div>
        )}

        {/* Historial de Solicitudes */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Mis Solicitudes de Trámite</h2>
              <p className="text-xs text-gray-500">
                Seguimiento de estados en tiempo real (Creado, En revisión, Aprobado, Rechazado)
              </p>
            </div>
            <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
              {solicitudes.length} {solicitudes.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-gray-500">
              Cargando tus solicitudes desde el sistema...
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-500 space-y-2">
              <p className="text-sm font-medium text-gray-700">No tienes trámites registrados</p>
              <p>Las solicitudes que envíes aparecerán aquí con su estado y folio institucional.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-50 text-gray-700 uppercase tracking-wider font-semibold border-b">
                  <tr>
                    <th className="p-3.5">Folio</th>
                    <th className="p-3.5">Materia</th>
                    <th className="p-3.5">Trámite</th>
                    <th className="p-3.5">Categoría</th>
                    <th className="p-3.5">Estado</th>
                    <th className="p-3.5">Fecha</th>
                    <th className="p-3.5">Motivo</th>
                    <th className="p-3.5">Adjuntos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {solicitudes.map((s) => (
                    <tr key={s['ticket-id']} className="hover:bg-gray-50 transition">
                      <td className="p-3.5 font-mono font-semibold text-blue-900">
                        {s['folio-ticket']}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-gray-900">
                          {s['materia-nombre'] || 'Materia no especificada'}
                        </div>
                        {s['materia-clave'] && (
                          <span className="text-[11px] text-gray-500 font-mono">
                            {s['materia-clave']}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            s['tipo-tramite'] === 'ALTA'
                              ? 'bg-blue-100 text-blue-800'
                              : s['tipo-tramite'] === 'BAJA'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {s['tipo-tramite']}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-600">
                        {s['categoria-materia'] || 'CURRICULAR'}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${getBadgeColor(
                            s['estado-ticket']
                          )}`}
                        >
                          {s['estado-ticket']}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-500 whitespace-nowrap">
                        {new Date(s['fecha-creacion']).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td
                        className="p-3.5 text-gray-600 max-w-xs truncate"
                        title={s['motivo-justificacion'] || ''}
                      >
                        {s['motivo-justificacion'] || '—'}
                      </td>
                      <td className="p-3.5">
                        {s['archivos-adjuntos'] && s['archivos-adjuntos'].length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {s['archivos-adjuntos'].map((adj, idx) => (
                              <a
                                key={idx}
                                href={adj['url-archivo']}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline truncate max-w-[120px]"
                              >
                                {adj['nombre-archivo']}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">Sin archivo</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
