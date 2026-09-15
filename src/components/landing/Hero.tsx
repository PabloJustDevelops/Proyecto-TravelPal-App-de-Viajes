'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { accentLinkClassName } from '@/components/ui/actionStyles';

export default function Hero() {
  return (
    <div className="relative isolate flex min-h-[85vh] items-center overflow-hidden bg-ink">
      <Image
        src="https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
        alt=""
        fill
        className="absolute inset-0 -z-10 h-full w-full object-cover"
        priority
      />

      {/* Velo plano, no degradado: la portada sangra de borde a borde y el texto se apoya en tinta. */}
      <div className="absolute inset-0 -z-10 bg-ink/55" />

      <div className="mx-auto w-full max-w-7xl px-6 py-section-lg lg:px-8">
        <motion.div
          className="max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-paper/70">
            Editorial de viajes
          </p>
          <h1 className="mt-4 font-serif text-4xl leading-tight text-paper sm:text-6xl">
            Tu compañero de viaje perfecto
          </h1>
          <p className="mt-6 max-w-prose text-lg leading-reading text-paper/80">
            Planifica, organiza y disfruta tus aventuras sin estrés. Desde el itinerario hasta el presupuesto, TravelPal tiene todo lo que necesitas en un solo lugar.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              href="/signup"
              className={`${accentLinkClassName} focus-visible:outline-paper`}
            >
              Comenzar gratis
            </Link>
            <Link
              href="#features"
              className="text-sm font-semibold leading-6 text-paper hover:opacity-80"
            >
              Saber más <span aria-hidden="true">→</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
