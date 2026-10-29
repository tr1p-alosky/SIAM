'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  
  // Estados para capturar los datos del formulario
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMensajeExito('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'correo-institucional': identificador.includes('@') ? identificador : undefined,
          'expediente-alumno': !identificador.includes('@') ? identificador : undefined,
          'contrasena-usuario': password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.mensaje || 'Error al iniciar sesión con las credenciales ingresadas.');
        setIsLoading(false);
        return;
      }

      // Guardar token en localStorage
      if (data['token-acceso']) {
        localStorage.setItem('siam_token', data['token-acceso']);
        localStorage.setItem('siam_user', JSON.stringify(data['datos-usuario']));
      }

      const rol = data['datos-usuario']?.['rol-usuario'];
      if (rol === 'COORDINADOR' || rol === 'ADMINISTRADOR') {
        router.push('/dashboard/coordinator');
      } else {
        setMensajeExito(
          `¡Bienvenido, ${data['datos-usuario']?.['nombre-completo']}! Sesión iniciada correctamente.`
        );
        setIsLoading(false);
      }
    } catch {
      setError('Ocurrió un error de conexión con el servidor. Intente nuevamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        
        {/* Encabezado */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Sistema SIAM</h2>
          <p className="mt-2 text-sm text-gray-600">
            Ingresa tus credenciales para acceder a la plataforma UAQ
          </p>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        {/* Mensaje de éxito */}
        {mensajeExito && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg p-3">
            {mensajeExito}
          </div>
        )}

        {/* Formulario */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo institucional / Matrícula o Expediente
              </label>
              <input
                type="text"
                required
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                placeholder="ejemplo@siam.local o SEEDCOORD001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Verificando credenciales...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Guía de acceso con datos de base de datos */}
        <div className="bg-gray-50 p-3 rounded-lg border text-xs text-gray-600 space-y-1">
          <p className="font-semibold text-gray-800">Cuentas activas en base de datos local:</p>
          <p>• <b>Coordinador:</b> coordinacion.seed@siam.local | PasswordSeguro1234</p>
          <p>• <b>Alumno 1:</b> alumno1.seed@siam.local | PasswordSeguro1234</p>
          <p>• <b>Alumno 2:</b> alumno2.seed@siam.local | PasswordSeguro1234</p>
        </div>

      </div>
    </div>
  );
}
