import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { InstitutionalCarousel, BannerItem } from '@/components/institutional-carousel';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Consultar banners activos desde la base de datos
  let dbBanners: Array<{
    id: number;
    titulo: string | null;
    urlImagen: string;
    urlDestino: string | null;
  }> = [];

  try {
    dbBanners = await prisma.bannerAnuncio.findMany({
      where: { estaActivo: true },
      orderBy: { id: 'asc' },
    });
  } catch (error) {
    console.error('Error al cargar banners desde la base de datos:', error);
  }

  // Enriquecer banners o utilizar banners predeterminados
  const banners: BannerItem[] =
    dbBanners.length > 0
      ? dbBanners.map((b, index) => {
          if (index === 0) {
            return {
              id: b.id,
              titulo: b.titulo || 'Periodo Oficial de Altas y Bajas 2026-2',
              urlImagen: b.urlImagen,
              urlDestino: b.urlDestino || '/login',
              etiqueta: 'Ventana Activa',
              subtitulo:
                'Recepción de solicitudes para materias curriculares y extracurriculares. Consulta grupos con espacios disponibles.',
              botonTexto: 'Solicitar Alta o Baja',
              botonColor: 'bg-amber-400 hover:bg-amber-300 text-blue-950',
            };
          }
          if (index === 1) {
            return {
              id: b.id,
              titulo: b.titulo || 'Módulo Especial de Lengua Extranjera (Inglés UAQ)',
              urlImagen: b.urlImagen,
              urlDestino: b.urlDestino || '/login',
              etiqueta: 'Inglés UAQ',
              subtitulo:
                'Sistema independiente para materias de inglés. Cumple con la restricción de un solo ticket activo por periodo.',
              botonTexto: 'Trámite de Inglés',
              botonColor: 'bg-blue-600 hover:bg-blue-500 text-white',
            };
          }
          return {
            id: b.id,
            titulo: b.titulo || 'Evidencias y Documentos',
            urlImagen: b.urlImagen,
            urlDestino: b.urlDestino || '/login',
            etiqueta: 'Documentación',
            subtitulo:
              'Ten a la mano tu Kardex actualizado e Identificación Oficial en PDF o imagen para adjuntarlos directamente a tu solicitud.',
            botonTexto: 'Iniciar Sesión',
            botonColor: 'bg-white hover:bg-gray-100 text-blue-950',
          };
        })
      : [
          {
            id: 1,
            titulo: 'Periodo Oficial de Altas y Bajas de Materias 2026-2',
            urlImagen:
              'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80',
            urlDestino: '/login',
            etiqueta: 'Ventana Activa UAQ',
            subtitulo:
              'Plataforma oficial para la gestión y seguimiento de solicitudes académicas de la Facultad de Informática UAQ.',
            botonTexto: 'Ingresar al Sistema',
            botonColor: 'bg-amber-400 hover:bg-amber-300 text-blue-950',
          },
        ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-gray-900">
      {/* Barra de Navegación Superior */}
      <header className="bg-blue-950 text-white sticky top-0 z-40 border-b border-blue-900 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo e Identidad */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-700 to-amber-400 p-0.5 shadow">
              <div className="w-full h-full bg-blue-950 rounded-[10px] flex items-center justify-center font-black text-amber-400 text-xl tracking-tighter">
                UAQ
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">SIAM</span>
                <span className="text-[11px] font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  Semestre 2026-2
                </span>
              </div>
              <p className="text-xs text-blue-200/80 hidden sm:block">
                Sistema Institucional de Altas y Bajas de Materias
              </p>
            </div>
          </div>

          {/* Menú de Enlaces */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-blue-100">
            <Link href="#tramites" className="hover:text-amber-300 transition">
              Trámites
            </Link>
            <Link href="#ingles" className="hover:text-amber-300 transition">
              Módulo Inglés
            </Link>
            <Link href="#soporte" className="hover:text-amber-300 transition">
              Soporte
            </Link>
          </nav>

          {/* Acceso / Login */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="bg-amber-400 hover:bg-amber-300 text-blue-950 font-bold px-4 py-2 rounded-xl text-xs sm:text-sm shadow transition transform hover:-translate-y-0.5"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Carrusel de Flyers en Horizontal (Requerimiento SIAM) */}
        <section aria-label="Anuncios y avisos institucionales">
          <InstitutionalCarousel banners={banners} />
        </section>

        {/* Acceso Directo a los Módulos del Sistema */}
        <section id="tramites" className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-100/60 px-3 py-1 rounded-full">
              Servicios Académicos Disponibles
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Módulos de Gestión de Materias
            </h2>
            <p className="text-sm text-gray-600">
              Selecciona el tipo de trámite que requieres realizar en el periodo académico vigente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Altas de Materias */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl font-bold">
                  +
                </div>
                <h3 className="font-bold text-lg text-gray-900">Alta de Materias</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Inscripción a materias regulares, atrasadas, de adelanto o extracurriculares en grupos con disponibilidad.
                </p>
              </div>
              <Link
                href="/login?tipo=ALTA"
                className="w-full text-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition"
              >
                Solicitar Alta
              </Link>
            </div>

            {/* Card 2: Bajas de Materias */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-2xl font-bold">
                  −
                </div>
                <h3 className="font-bold text-lg text-gray-900">Baja de Materias</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Descarga académica de materias registradas previamente sin repercusión en tu historial escolar.
                </p>
              </div>
              <Link
                href="/login?tipo=BAJA"
                className="w-full text-center py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-xs transition"
              >
                Solicitar Baja
              </Link>
            </div>

            {/* Card 3: Cambio de Grupo */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl font-bold">
                  ⇄
                </div>
                <h3 className="font-bold text-lg text-gray-900">Cambio de Grupo</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Ajuste por traslape de horario. El cupo del grupo origen se transfiere de forma atómica y segura.
                </p>
              </div>
              <Link
                href="/login?tipo=CAMBIO"
                className="w-full text-center py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs transition"
              >
                Solicitar Cambio
              </Link>
            </div>

            {/* Card 4: Módulo de Inglés */}
            <div id="ingles" className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 text-amber-400 flex items-center justify-center text-xl font-bold">
                  EN
                </div>
                <h3 className="font-bold text-lg text-white">Inglés UAQ</h3>
                <p className="text-xs text-blue-200 leading-relaxed">
                  Altas y bajas de lengua extranjera con validación de nivel y restricción de un solo ticket activo (RF04).
                </p>
              </div>
              <Link
                href="/login?categoria=INGLES"
                className="w-full text-center py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-blue-950 font-bold rounded-xl text-xs transition shadow"
              >
                Trámite de Inglés
              </Link>
            </div>
          </div>
        </section>

        {/* Sección Mesa de Ayuda y Soporte */}
        <section id="soporte" className="bg-gradient-to-r from-blue-900 to-blue-950 text-white rounded-3xl p-8 sm:p-12 shadow-lg flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              Atención Escolar UAQ
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              ¿Dudas o Aclaraciones con tu Solicitud?
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 leading-relaxed">
              Si tu solicitud requiere revisión especial o tienes problemas de acceso con tu correo institucional o expediente, acude a la Coordinación Académica o contacta a soporte técnico.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Link
              href="/login"
              className="bg-amber-400 hover:bg-amber-300 text-blue-950 font-bold px-6 py-3 rounded-xl text-center text-sm shadow transition"
            >
              Consultar Mis Tickets
            </Link>
            <a
              href="mailto:coordinacion.informatica@uaq.mx"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl text-center text-sm backdrop-blur-sm transition"
            >
              Contacto de Coordinación
            </a>
          </div>
        </section>
      </main>

      {/* Footer Institucional */}
      <footer className="bg-white border-t border-gray-200 text-gray-600 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-100 pb-6 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-black text-blue-900 text-base">UAQ</span>
              <span>•</span>
              <span>Facultad de Informática</span>
              <span>•</span>
              <span>Dirección de Servicios Académicos</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/login" className="hover:text-blue-600 transition">
                Acceso al Sistema
              </Link>
              <Link href="/dashboard/coordinator" className="hover:text-blue-600 transition">
                Panel de Coordinación
              </Link>
              <Link href="/dashboard/student" className="hover:text-blue-600 transition">
                Panel de Alumno
              </Link>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 gap-2">
            <p>© 2026 Universidad Autónoma de Querétaro. Todos los derechos reservados.</p>
            <p>SIAM v0.1.0 • Sistema de Altas y Bajas de Materias</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
