"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import NotificationSystem from "@/components/notifications/NotificationSystem";
import TravelSearch from "@/components/search/TravelSearch";
interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}
interface NavbarProps {
  navigation: NavigationItem[];
}
export default function Navbar({ navigation }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      // Forzamos una recarga completa para limpiar cualquier estado residual
      // y asegurar que el middleware reevalúe la sesión correctamente.
      // Esto soluciona el problema de que a veces se requiere un segundo intento.
      window.location.href = "/signin";
    }
  };
  return (
    <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-[100] border-b border-gray-200 dark:bg-gray-900/80 dark:border-gray-800 transition-all duration-300">
      {" "}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {" "}
        <div className="flex h-16 items-center justify-between">
          {" "}
          {/* Logo Section */}{" "}
          <div className="flex-shrink-0 flex items-center">
            {" "}
            <Link
              href="/dashboard"
              className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {" "}
              <span className="text-2xl">✈️</span>{" "}
              <span className="hidden md:inline font-extrabold tracking-tight">
                Gestión de Vuelos
              </span>{" "}
            </Link>{" "}
          </div>{" "}
          {/* Centered Navigation Links - Desktop */}{" "}
          <div className="hidden lg:flex flex-1 items-center justify-center px-2 lg:px-4">
            {" "}
            <div className="flex items-center space-x-1 bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-full border border-gray-200/50 dark:border-gray-700/50 overflow-x-auto max-w-full no-scrollbar">
              {" "}
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname?.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={` inline-flex items-center px-2.5 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ease-in-out whitespace-nowrap ${isActive ? "bg-white text-blue-600 shadow-sm dark:bg-gray-700 dark:text-blue-400" : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700/50"} `}
                  >
                    {" "}
                    <item.icon
                      className={`h-4 w-4 mr-1.5 ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-400 group-hover:text-gray-500"}`}
                    />{" "}
                    {item.name}{" "}
                  </Link>
                );
              })}{" "}
            </div>{" "}
          </div>{" "}
          {/* Right Actions Section */}{" "}
          <div className="hidden lg:flex items-center space-x-1 shrink-0">
            {" "}
            {/* Ancho reducido drásticamente para mover los iconos a la izquierda */}{" "}
            <div className="w-16 lg:w-24 xl:w-32 transition-all duration-300 focus-within:w-28 lg:focus-within:w-40 xl:focus-within:w-56">
              {" "}
              <TravelSearch />{" "}
            </div>{" "}
            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-0.5"></div>{" "}
            <NotificationSystem className="shrink-0" />{" "}
            <div className="relative shrink-0">
              {" "}
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 rounded-full p-1 pl-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label="Abrir menú de perfil"
              >
                {" "}
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200 max-w-[80px] truncate hidden xl:block">
                  {" "}
                  {user?.full_name?.split(" ")[0] || "Usuario"}{" "}
                </span>{" "}
                {user?.avatar_url && !avatarError ? (
                  <img
                    src={user.avatar_url}
                    alt={user.full_name || "Usuario"}
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                    {" "}
                    <UserCircleIcon className="h-5 w-5" />{" "}
                  </div>
                )}{" "}
              </button>{" "}
              {profileMenuOpen && (
                <div
                  className="origin-top-right absolute right-0 mt-2 w-64 rounded-xl shadow-2xl bg-white ring-1 ring-black ring-opacity-5 z-50 transform transition-all duration-200 ease-out opacity-100 scale-100 dark:bg-gray-800 dark:ring-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                >
                  {" "}
                  <div className="px-4 py-4 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                    {" "}
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400 mb-1">
                      {" "}
                      Conectado como{" "}
                    </p>{" "}
                    <p className="text-sm font-bold text-gray-900 truncate dark:text-white">
                      {" "}
                      {user?.full_name || "Usuario"}{" "}
                    </p>{" "}
                    <p className="text-xs text-gray-500 truncate dark:text-gray-400">
                      {" "}
                      {user?.email}{" "}
                    </p>{" "}
                  </div>{" "}
                  <div className="py-1">
                    {" "}
                    <Link
                      href="/profile"
                      className="group flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-300 transition-colors"
                      onClick={() => setProfileMenuOpen(false)}
                      role="menuitem"
                    >
                      {" "}
                      <UserCircleIcon
                        className="mr-3 h-5 w-5 text-gray-400 group-hover:text-blue-500 dark:text-gray-500 dark:group-hover:text-blue-400 transition-colors"
                        aria-hidden="true"
                      />{" "}
                      Mi Perfil{" "}
                    </Link>{" "}
                    <Link
                      href="/settings"
                      className="group flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-blue-900/20 dark:hover:text-blue-300 transition-colors"
                      onClick={() => setProfileMenuOpen(false)}
                      role="menuitem"
                    >
                      {" "}
                      <Cog6ToothIcon
                        className="mr-3 h-5 w-5 text-gray-400 group-hover:text-blue-500 dark:text-gray-500 dark:group-hover:text-blue-400 transition-colors"
                        aria-hidden="true"
                      />{" "}
                      Configuración{" "}
                    </Link>{" "}
                  </div>{" "}
                  <div className="py-1 bg-gray-50 dark:bg-gray-900/50">
                    {" "}
                    <button
                      onClick={handleSignOut}
                      className="group flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300 transition-colors"
                      role="menuitem"
                    >
                      {" "}
                      <ArrowRightOnRectangleIcon
                        className="mr-3 h-5 w-5 text-red-400 group-hover:text-red-500 dark:text-red-500 dark:group-hover:text-red-400 transition-colors"
                        aria-hidden="true"
                      />{" "}
                      Cerrar Sesión{" "}
                    </button>{" "}
                  </div>{" "}
                </div>
              )}{" "}
            </div>{" "}
          </div>{" "}
          <div className="lg:hidden flex items-center gap-2">
            {" "}
            {/* Search Icon Mobile */}{" "}
            <div className="text-gray-500">
              {" "}
              <TravelSearch />{" "}
            </div>{" "}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
            >
              {" "}
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}{" "}
            </button>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Mobile menu */}{" "}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-800">
          {" "}
          <div className="pt-2 pb-3 space-y-1">
            {" "}
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block pl-3 pr-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                {" "}
                <item.icon className="h-5 w-5 inline mr-3" /> {item.name}{" "}
              </Link>
            ))}{" "}
          </div>{" "}
          <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
            {" "}
            <div className="flex items-center px-4">
              {" "}
              {user?.avatar_url && !avatarError ? (
                <img
                  src={user.avatar_url}
                  alt={user.full_name || "Usuario"}
                  className="h-10 w-10 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <UserCircleIcon className="h-10 w-10 text-gray-400" />
              )}{" "}
              <div className="ml-3">
                {" "}
                <div className="text-base font-medium text-gray-800 dark:text-white">
                  {" "}
                  {user?.full_name || "Usuario"}{" "}
                </div>{" "}
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {" "}
                  {user?.email}{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            <div className="mt-3 space-y-1">
              {" "}
              <Link
                href="/profile"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                {" "}
                Mi Perfil{" "}
              </Link>{" "}
              <Link
                href="/settings"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                {" "}
                Configuración{" "}
              </Link>{" "}
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800"
              >
                {" "}
                Cerrar Sesión{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}{" "}
    </nav>
  );
}
