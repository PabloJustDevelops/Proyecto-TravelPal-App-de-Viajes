'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

export default function Hero() {
  return (
    <div className="relative isolate overflow-hidden bg-gray-900 min-h-screen flex items-center justify-center">
      <Image
        src="https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
        alt="Travel background"
        fill
        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-40"
        priority
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent -z-10" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="hidden sm:mb-8 sm:flex sm:justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-300 ring-1 ring-white/10 hover:ring-white/20">
              La nueva forma de viajar está aquí.{' '}
              <Link href="/signup" className="font-semibold text-blue-400">
                <span className="absolute inset-0" aria-hidden="true" />
                Regístrate gratis <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Tu compañero de viaje perfecto
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300 max-w-2xl mx-auto">
            Planifica, organiza y disfruta tus aventuras sin estrés. Desde el itinerario hasta el presupuesto, TravelPal tiene todo lo que necesitas en un solo lugar.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/signup"
              className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all transform hover:scale-105"
            >
              Comenzar gratis
            </Link>
            <Link href="#features" className="text-sm font-semibold leading-6 text-white hover:text-blue-300 transition-colors">
              Saber más <span aria-hidden="true">→</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
