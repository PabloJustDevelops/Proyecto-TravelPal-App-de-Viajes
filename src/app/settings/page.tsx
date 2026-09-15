"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import PageTitle from "@/components/ui/PageTitle";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Cog6ToothIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getErrorMessage } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { user, resetPassword } = useAuth();
  const { showSuccess, showError } = useToast();
  const [sendingReset, setSendingReset] = useState(false);

  const isDark = resolvedTheme === 'dark';

  const handleChangePassword = async () => {
    if (!user?.email) {
      showError('No hay una sesión activa para cambiar la contraseña');
      return;
    }

    setSendingReset(true);
    try {
      await resetPassword(user.email);
      showSuccess(`Te hemos enviado un enlace a ${user.email} para cambiar la contraseña`);
    } catch (err: unknown) {
      showError(getErrorMessage(err, 'No se pudo enviar el correo de recuperación'));
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <PageTitle title="Configuración" />

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cog6ToothIcon className="h-6 w-6" />
              Apariencia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Modo Oscuro</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Cambia entre tema claro y oscuro. 
                  {theme === 'system' && <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full dark:bg-blue-900 dark:text-blue-200">Automático</span>}
                </p>
              </div>
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isDark ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isDark ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheckIcon className="h-6 w-6" />
              Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gestiona la seguridad de tu cuenta, contraseña y sesiones activas.
              </p>
              <Button
                variant="ghost"
                onClick={handleChangePassword}
                loading={sendingReset}
                className="px-0 text-sm font-medium text-blue-600 hover:bg-transparent hover:text-blue-800 dark:text-blue-400 dark:hover:bg-transparent dark:hover:text-blue-300"
              >
                Cambiar Contraseña
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
