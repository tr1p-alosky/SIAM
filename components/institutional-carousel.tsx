'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export interface BannerItem {
  id: number;
  titulo: string;
  urlImagen: string;
  urlDestino: string;
  subtitulo?: string;
  etiqueta?: string;
  botonTexto?: string;
  botonColor?: string;
}

interface InstitutionalCarouselProps {
  banners: BannerItem[];
}

export function InstitutionalCarousel({ banners }: InstitutionalCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (!banners || banners.length === 0) return null;

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-xl border border-gray-100 bg-slate-900">
      {/* Slides Container */}
      <div
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {banners.map((banner, index) => (
          <div key={banner.id || index} className="min-w-full relative h-[380px] sm:h-[420px] flex items-center">
            {/* Imagen de fondo con gradiente institucional */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${banner.urlImagen})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-950/95 via-blue-900/80 to-transparent" />

            {/* Contenido del Flyer / Banner */}
            <div className="relative z-10 max-w-2xl px-6 sm:px-12 py-8 space-y-4 text-white">
              {banner.etiqueta && (
                <span className="inline-block px-3 py-1 bg-amber-400 text-blue-950 font-bold text-xs uppercase tracking-wider rounded-full shadow-sm">
                  {banner.etiqueta}
                </span>
              )}
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white drop-shadow-md">
                {banner.titulo}
              </h2>
              {banner.subtitulo && (
                <p className="text-sm sm:text-base text-blue-100/90 max-w-xl leading-relaxed">
                  {banner.subtitulo}
                </p>
              )}
              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  href={banner.urlDestino || '/login'}
                  className={`inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-sm shadow-lg transition-all duration-200 transform hover:-translate-y-0.5 ${
                    banner.botonColor || 'bg-amber-400 hover:bg-amber-300 text-blue-950'
                  }`}
                >
                  {banner.botonTexto || 'Acceder al Trámite'}
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </Link>
                <Link
                  href="#tramites"
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm transition"
                >
                  Ver Trámites
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Flechas de Navegación */}
      {banners.length > 1 && (
        <>
          <button
            onClick={() => setCurrentSlide((prev) => (prev === 0 ? banners.length - 1 : prev - 1))}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition"
            aria-label="Anuncio anterior"
          >
            ❮
          </button>
          <button
            onClick={() => setCurrentSlide((prev) => (prev + 1) % banners.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm transition"
            aria-label="Siguiente anuncio"
          >
            ❯
          </button>

          {/* Indicadores de diapositiva */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  currentSlide === idx ? 'w-8 bg-amber-400' : 'w-2.5 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Ir al anuncio ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
