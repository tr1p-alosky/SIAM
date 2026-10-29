'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface TicketBandeja {
  'ticket-id': string;
  'folio-ticket': string;
  'expediente-alumno': string;
  'nombre-alumno': string;
  'nombre-materia': string | null;
  'materia-clave': string | null;
  'tipo-tramite': string;
  'estado-ticket': string;
  'motivo-justificacion': string | null;
  'archivos-adjuntos': Array<{
    'adjunto-id'?: number;
    'nombre-archivo': string;
    'url-archivo': string;
  }>;
}

export default function CoordinatorDashboard() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketBandeja[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  
  // Estado para modal de observación y gestión
  const [ticketEnGestion, setTicketEnGestion] = useState<{
    id: string;
    folio: string;
    accion: 'APROBAR' | 'RECHAZAR';
  } | null>(null);
  const [observacion, setObservacion] = useState<string>('');
  const [procesandoAccion, setProcesandoAccion] = useState<boolean>(false);
  const [busqueda, setBusqueda] = useState<string>('');

  const cargarTickets = useCallback(async (busquedaTexto = '') => {
    setLoading(true);
    setError('');
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('siam_token') : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const query = busquedaTexto ? `?busqueda-texto=${encodeURIComponent(busquedaTexto)}` : '';
      const response = await fetch(`/api/tickets/pendientes${query}`, {
        method: 'GET',
        headers,
      });

      if (response.status === 401 || response.status === 403) {
        router.push('/login');
        return;
      }

      const data = await response.json();
      if (response.ok && data['bandeja-pendientes']) {
        setTickets(data['bandeja-pendientes']);
      } else {
        setError(data.mensaje || 'Error al cargar las solicitudes pendientes.');
      }
    } catch {
      setError('Error de conexión al cargar las solicitudes pendientes.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    cargarTickets();
  }, [cargarTickets]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    cargarTickets(busqueda);
  };

  const abrirModalGestion = (ticket: TicketBandeja, accion: 'APROBAR' | 'RECHAZAR') => {
    setTicketEnGestion({
      id: ticket['ticket-id'],
      folio: ticket['folio-ticket'],
      accion,
    });
    setObservacion(
      accion === 'APROBAR'
        ? 'Cumple con los requisitos académicos para el trámite.'
        : 'Cupo completo en el grupo solicitado o requisitos no cubiertos.'
    );
  };

  const confirmarGestion = async () => {
    if (!ticketEnGestion) return;
    if (observacion.trim().length < 5) {
      alert('La observación debe contener al menos 5 caracteres.');
      return;
    }

    setProcesandoAccion(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('siam_token') : null;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/tickets/${ticketEnGestion.id}/gestion`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          'accion-resolucion': ticketEnGestion.accion,
          'observacion-coordinador': observacion.trim(),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        // Remover de la bandeja de pendientes
        setTickets((prev) => prev.filter((t) => t['ticket-id'] !== ticketEnGestion.id));
        setTicketEnGestion(null);
        setObservacion('');
      } else {
        alert(data.mensaje || 'No se pudo procesar la solicitud.');
      }
    } catch {
      alert('Error de conexión al procesar la resolución del ticket.');
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleCerrarSesion = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('siam_token');
      localStorage.removeItem('siam_user');
    }
    router.push('/login');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Encabezado y Barra de Acciones */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bandeja de Gestión de Coordinación</h1>
          <p className="text-sm text-gray-600">
            Revisión y resolución de solicitudes académicas pendientes (SIAM UAQ)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => cargarTickets(busqueda)}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition"
          >
            Actualizar
          </button>
          <button
            onClick={handleCerrarSesion}
            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Buscador */}
      <form onSubmit={handleBuscar} className="flex gap-2">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por expediente, nombre del alumno o nombre de materia..."
          className="flex-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
        >
          Filtrar
        </button>
      </form>

      {/* Mensajes de error o carga */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-sm">
          Cargando solicitudes desde la base de datos...
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 border border-dashed rounded-lg text-gray-500 text-sm">
          No hay solicitudes pendientes en la bandeja de entrada.
        </div>
      ) : (
        /* Tabla de Trámites */
        <div className="border rounded-lg overflow-x-auto shadow-sm bg-white">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-gray-100 border-b text-gray-700">
              <tr>
                <th className="p-3">Folio</th>
                <th className="p-3">Expediente</th>
                <th className="p-3">Estudiante</th>
                <th className="p-3">Materia</th>
                <th className="p-3">Tipo Trámite</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Justificación</th>
                <th className="p-3">Documentos</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <tr key={ticket['ticket-id']} className="hover:bg-gray-50 transition">
                  <td className="p-3 font-mono font-semibold text-blue-900">
                    {ticket['folio-ticket']}
                  </td>
                  <td className="p-3 font-mono text-xs text-gray-600">
                    {ticket['expediente-alumno']}
                  </td>
                  <td className="p-3 font-medium text-gray-900">
                    {ticket['nombre-alumno']}
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-gray-800">
                      {ticket['nombre-materia'] || 'Sin materia'}
                    </div>
                    {ticket['materia-clave'] && (
                      <span className="text-xs text-gray-500 font-mono">
                        {ticket['materia-clave']}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      ticket['tipo-tramite'] === 'ALTA'
                        ? 'bg-blue-100 text-blue-800'
                        : ticket['tipo-tramite'] === 'BAJA'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {ticket['tipo-tramite']}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {ticket['estado-ticket']}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-gray-600 max-w-xs truncate" title={ticket['motivo-justificacion'] || ''}>
                    {ticket['motivo-justificacion'] || '—'}
                  </td>
                  <td className="p-3">
                    {ticket['archivos-adjuntos'] && ticket['archivos-adjuntos'].length > 0 ? (
                      <div className="flex flex-col gap-1">
                        {ticket['archivos-adjuntos'].map((adj, idx) => (
                          <button
                            key={idx}
                            onClick={() => setSelectedPdf(adj['url-archivo'])}
                            className="text-blue-600 hover:text-blue-800 underline text-xs text-left"
                          >
                            {adj['nombre-archivo']}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Sin adjuntos</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => abrirModalGestion(ticket, 'APROBAR')}
                        className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1.5 rounded text-xs font-medium shadow-sm transition"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => abrirModalGestion(ticket, 'RECHAZAR')}
                        className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 rounded text-xs font-medium shadow-sm transition"
                      >
                        Rechazar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Resolución (Observaciones Obligatorias) */}
      {ticketEnGestion && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-lg text-gray-900">
                {ticketEnGestion.accion === 'APROBAR' ? 'Aprobar Solicitud' : 'Rechazar Solicitud'}{' '}
                ({ticketEnGestion.folio})
              </h3>
              <button
                onClick={() => setTicketEnGestion(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Es obligatorio registrar el motivo u observación de resolución para auditoría y trazabilidad.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observación / Motivo institucional
              </label>
              <textarea
                rows={4}
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Escriba la justificación institucional..."
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setTicketEnGestion(null)}
                disabled={procesandoAccion}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarGestion}
                disabled={procesandoAccion}
                className={`px-4 py-2 text-white rounded-lg text-sm font-medium transition ${
                  ticketEnGestion.accion === 'APROBAR'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:opacity-50`}
              >
                {procesandoAccion ? 'Procesando...' : `Confirmar ${ticketEnGestion.accion}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visor de Documentos (Modal sencillo) */}
      {selectedPdf && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-4 w-full max-w-3xl space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-gray-800">Visor de Documento Probatorio</h3>
              <button
                onClick={() => setSelectedPdf(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>
            <iframe
              src={selectedPdf}
              className="w-full h-[500px] border rounded bg-gray-50"
              title="Documento Probatorio"
            />
          </div>
        </div>
      )}
    </div>
  );
}
