'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  
  // Estados para capturar los datos del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulación de validación de credenciales
    setTimeout(() => {
      if (email === 'coordinador@siam.edu' && password === '123456') {
        router.push('/dashboard/coordinator');
      } else if (email === 'estudiante@siam.edu' && password === '123456') {
        router.push('/dashboard/student');
      } else {
        setError('Credenciales incorrectas. Usa coordinador@siam.edu o estudiante@siam.edu (Contraseña: 123456)');
        setIsLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        
        {/* Encabezado */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Sistema SIAM</h2>
          <p className="mt-2 text-sm text-gray-600">
            Ingresa tus credenciales para acceder a la plataforma
          </p>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo institucional / Matrícula
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                //placeholder="usuario@siam.edu"
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
                //placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Guía rápida de prueba */}
        <div className="bg-gray-50 p-3 rounded-lg border text-xs text-gray-500 space-y-1">
          <p className="font-semibold text-gray-700">Credenciales para probarr:</p>
          <p>• <b>Coordinador:</b> admin@coordinador.edu - 123456</p>
          <p>• <b>Estudiante:</b> usuario@estudiante.edu - 123456</p>
        </div>

      </div>
    </div>
  );
}