'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  const navLinks = [
    { name: 'Características', href: '#features' },
    { name: 'Cómo funciona', href: '#how-it-works' },
    { name: 'Testimonios', href: '#testimonials' },
  ];

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        isScrolled || mobileMenuOpen ? 'bg-white shadow-md' : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
            <span className="sr-only">TravelPal</span>
            <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
            </svg>
            <span className={`text-xl font-bold ${isScrolled || mobileMenuOpen ? 'text-gray-900' : 'text-gray-900 lg:text-white'}`}>
              TravelPal
            </span>
          </Link>
        </div>
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
            onClick={() => setMobileMenuOpen(true)}
          >
            <span className="sr-only">Abrir menú</span>
            <Bars3Icon className={`h-6 w-6 ${isScrolled ? 'text-gray-900' : 'text-gray-900 lg:text-white'}`} aria-hidden="true" />
          </button>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          {navLinks.map((item) => (
            <Link 
              key={item.name} 
              href={item.href} 
              className={`text-sm font-semibold leading-6 ${isScrolled ? 'text-gray-900 hover:text-blue-600' : 'text-white hover:text-blue-200'}`}
            >
              {item.name}
            </Link>
          ))}
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
          <Link 
            href="/signin" 
            className={`text-sm font-semibold leading-6 px-4 py-2 rounded-lg transition-colors ${
              isScrolled 
                ? 'text-gray-900 hover:bg-gray-50' 
                : 'text-white hover:bg-white/10'
            }`}
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Registrarse
          </Link>
        </div>
      </nav>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2">
              <span className="sr-only">TravelPal</span>
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
              <span className="text-xl font-bold text-gray-900">TravelPal</span>
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="sr-only">Cerrar menú</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-2 py-6">
                {navLinks.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="py-6 flex flex-col gap-2">
                <Link
                  href="/signin"
                  className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/signup"
                  className="mt-2 block w-full rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Registrarse
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.header>
  );
}
