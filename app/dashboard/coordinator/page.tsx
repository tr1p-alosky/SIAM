'use client';

import { useState } from 'react';
import { MOCK_TICKETS } from '@/lib/mock-data';
import { Ticket } from '@/types';

export default function CoordinatorDashboard() {
  // Inicializamos la pantalla usando los datos de prueba
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);

  // Simulación de acción de Aprobar / Rechazar
  const handleStatusChange = (id: string, newStatus: 'APROBADO' | 'DENEGADO') => {
    setTickets((prev: Ticket[]) =>
      prev.map(t => (t.id === id ? { ...t, status: newStatus } : t))
    );
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Panel de Administración de Tickets</h1>

      {/* Tabla de Trámites */}
      <div className="border rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-3">Folio</th>
              <th className="p-3">Estudiante</th>
              <th className="p-3">Materia</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Documento</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-mono">{ticket.id}</td>
                <td className="p-3">{ticket.studentName}</td>
                <td className="p-3">{ticket.subjectName}</td>
                <td className="p-3 font-semibold">{ticket.type}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    ticket.status === 'REVISIÓN' ? 'bg-yellow-100 text-yellow-800' :
                    ticket.status === 'APROBADO' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {ticket.status}
                  </span>
                </td>
                <td className="p-3">
                  <button 
                    onClick={() => setSelectedPdf(ticket.documentUrl)}
                    className="text-blue-600 underline text-xs"
                  >
                    Ver Kardex
                  </button>
                </td>
                <td className="p-3 space-x-2">
                  <button 
                    onClick={() => handleStatusChange(ticket.id, 'APROBADO')}
                    className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
                  >
                    Aprobar
                  </button>
                  <button 
                    onClick={() => handleStatusChange(ticket.id, 'DENEGADO')}
                    className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                  >
                    Rechazar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Visor de Documentos (Modal sencillo) */}
      {selectedPdf && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-4 w-full max-w-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold">Documento Probatorio</h3>
              <button onClick={() => setSelectedPdf(null)} className="text-gray-500 font-bold">✕</button>
            </div>
            <iframe src={selectedPdf} className="w-full h-96 border rounded" />
          </div>
        </div>
      )}
    </div>
  );
}