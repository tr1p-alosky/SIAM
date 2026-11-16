'use client';

import { useState } from 'react';

interface StudentTicket {
  id: string;
  materia: string;
  type: 'ALTA' | 'BAJA';
  razon: string;
  fecha: string;
  status: 'REVISIÓN' | 'APROBADO' | 'RECHAZADO';
}

export default function StudentDashboard() {
  // Lista inicial de trámites del alumno
  const [tickets, setTickets] = useState<StudentTicket[]>([
    {
      id: 'TCK-001',
      materia: 'Estructura de Datos',
      type: 'BAJA',
      razon: 'Cruce de horarios con materia de especialidad.',
      fecha: '2026-10-10',
      status: 'REVISIÓN',
    },
    {
      id: 'TCK-002',
      materia: 'Bases de Datos Avanzadas',
      type: 'ALTA',
      razon: 'Materia prerrequisito aprobada en verano.',
      fecha: '2026-10-08',
      status: 'APROBADO',
    },
  ]);

  // Estados del formulario
  const [materia, setSubject] = useState('');
  const [type, setType] = useState<'ALTA' | 'BAJA'>('ALTA');
  const [razon, setReason] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Enviar nueva solicitud
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materia || !razon) return;

    const newTicket: StudentTicket = {
      id: `TCK-00${tickets.length + 1}`,
      materia,
      type,
      razon,
      fecha: new Date().toISOString().split('T')[0],
      status: 'REVISIÓN',
    };

    setTickets([newTicket, ...tickets]);
    
    // Limpiar formulario
    setSubject('');
    setType('ALTA');
    setReason('');
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Título de Bienvenida */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel del Estudiante</h1>
        <p className="text-sm text-gray-600">
          Gestiona tus solicitudes de Altas y Bajas de materias para el periodo actual.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de Nueva Solicitud */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Nueva Solicitud</h2>

          {isSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-xs p-3 rounded-lg">
              ¡Solicitud enviada correctamente a revisión!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Selecciona la Materia
              </label>
              <select
                value={materia}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">-- Seleccionar --</option>
                <option value="Sistemas Operativos">Sistemas Operativos</option>
                <option value="Frameworks">Frameworks</option>
                <option value="Diseño y creación de Redes">Diseño y creación de Redes</option>
                <option value="Administración de Base de Datos">Administración de Base de Datos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Tipo de Trámite
              </label>
              <div className="flex gap-4">
                <label className="flex items-center text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="ALTA"
                    checked={type === 'ALTA'}
                    onChange={() => setType('ALTA')}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  Alta
                </label>
                <label className="flex items-center text-sm cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    value="BAJA"
                    checked={type === 'BAJA'}
                    onChange={() => setType('BAJA')}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  Baja
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Motivo / Justificación
              </label>
              <textarea
                rows={3}
                value={razon}
                onChange={(e) => setReason(e.target.value)}
                required
                placeholder="Explica brevemente la razón de la solicitud..."
                className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-medium text-sm py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Enviar Trámite
            </button>
          </form>
        </div>

        {/* Tabla de Historial de Trámites */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Mis Solicitudes</h2>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-100 border-b text-gray-700">
                <tr>
                  <th className="py-3 px-4">Folio</th>
                  <th className="py-3 px-4">Materia</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {tickets.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{item.id}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-800">{item.materia}</p>
                        <p className="text-xs text-gray-400">{item.fecha}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-xs">{item.type}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          item.status === 'REVISIÓN'
                            ? 'bg-yellow-100 text-yellow-800'
                            : item.status === 'APROBADO'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}