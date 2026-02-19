'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function CTA() {
  return (
    <div className="bg-blue-600">
      <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <motion.h2 
            className="text-3xl font-bold tracking-tight text-white sm:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            ¿Listo para tu próxima aventura?
            <br />
            Empieza a usar TravelPal hoy mismo.
          </motion.h2>
          <motion.p 
            className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Únete a nuestra comunidad de viajeros y descubre la forma más fácil de planificar y disfrutar tus viajes.
          </motion.p>
          <motion.div 
            className="mt-10 flex items-center justify-center gap-x-6"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Link
              href="/signup"
              className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all transform hover:scale-105"
            >
              Regístrate gratis
            </Link>
            <Link href="/signin" className="text-sm font-semibold leading-6 text-white hover:text-blue-200 transition-colors">
              Iniciar Sesión <span aria-hidden="true">→</span>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
