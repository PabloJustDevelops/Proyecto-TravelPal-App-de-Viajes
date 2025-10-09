'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BellIcon, 
  XMarkIcon, 
  CheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { reminderFunctions } from '../../lib/supabase-functions';
import { formatDate } from '../../lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'reminder' | 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  reminderId?: string;
}

interface NotificationSystemProps {
  className?: string;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Cargar recordatorios pendientes
  const loadPendingReminders = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const pendingReminders = await reminderFunctions.getPending(user.id);
      
      const reminderNotifications: Notification[] = pendingReminders.map(reminder => ({
        id: `reminder_${reminder.id}`,
        title: reminder.title,
        message: reminder.message,
        type: 'reminder' as const,
        timestamp: reminder.reminder_datetime,
        read: false,
        reminderId: reminder.id,
        actionLabel: 'Marcar como visto'
      }));

      setNotifications(prev => {
        // Evitar duplicados
        const existingIds = prev.map(n => n.id);
        const newNotifications = reminderNotifications.filter(n => !existingIds.includes(n.id));
        return [...prev, ...newNotifications];
      });

    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    loadPendingReminders();
    
    // Configurar intervalo para verificar nuevos recordatorios cada 5 minutos
    const interval = setInterval(loadPendingReminders, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [loadPendingReminders]);

  // Actualizar contador de no leídas
  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  // Solicitar permisos de notificación del navegador
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Marcar notificación como leída
  const markAsRead = async (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification?.reminderId) {
      try {
        await reminderFunctions.markAsSent(notification.reminderId);
      } catch (error) {
        console.error('Error marking reminder as sent:', error);
      }
    }

    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  // Descartar notificación
  const dismissNotification = async (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification?.reminderId) {
      try {
        await reminderFunctions.dismiss(notification.reminderId);
      } catch (error) {
        console.error('Error dismissing reminder:', error);
      }
    }

    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  // Marcar todas como leídas
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Limpiar todas las notificaciones
  const clearAll = () => {
    setNotifications([]);
  };

  // Obtener icono según el tipo
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'reminder':
        return <ClockIcon className="h-5 w-5 text-blue-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XMarkIcon className="h-5 w-5 text-red-500" />;
      case 'success':
        return <CheckIcon className="h-5 w-5 text-green-500" />;
      default:
        return <InformationCircleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Obtener color de fondo según el tipo
  const getNotificationBg = (type: Notification['type'], read: boolean) => {
    const opacity = read ? 'bg-opacity-50' : 'bg-opacity-100';
    
    switch (type) {
      case 'reminder':
        return `bg-blue-50 ${opacity}`;
      case 'warning':
        return `bg-yellow-50 ${opacity}`;
      case 'error':
        return `bg-red-50 ${opacity}`;
      case 'success':
        return `bg-green-50 ${opacity}`;
      default:
        return `bg-gray-50 ${opacity}`;
    }
  };

  // Exponer funciones para uso externo (comentado por ahora)
  // React.useImperativeHandle(React.createRef(), () => ({
  //   addNotification,
  //   markAsRead,
  //   dismissNotification
  // }));

  return (
    <div className={`relative ${className}`}>
      {/* Botón de notificaciones */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Marcar todas
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Lista de notificaciones */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Cargando notificaciones...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <BellIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      getNotificationBg(notification.type, notification.read)
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              notification.read ? 'text-gray-600' : 'text-gray-900'
                            }`}>
                              {notification.title}
                            </p>
                            <p className={`text-sm mt-1 ${
                              notification.read ? 'text-gray-500' : 'text-gray-700'
                            }`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatDate(new Date(notification.timestamp))} a las{' '}
                              {new Date(notification.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-blue-600 hover:text-blue-800 text-xs"
                                title="Marcar como leída"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => dismissNotification(notification.id)}
                              className="text-gray-400 hover:text-gray-600 text-xs"
                              title="Descartar"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        {notification.actionLabel && notification.actionUrl && (
                          <div className="mt-3">
                            <a
                              href={notification.actionUrl}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {notification.actionLabel}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={clearAll}
                className="text-sm text-gray-600 hover:text-gray-800 w-full text-center"
              >
                Limpiar todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Hook para usar el sistema de notificaciones
export const useNotifications = () => {
  const [notificationSystem, setNotificationSystem] = useState<{
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => string;
    markAsRead: (id: string) => void;
    dismissNotification: (id: string) => void;
  } | null>(null);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    if (notificationSystem) {
      return notificationSystem.addNotification(notification);
    }
    return '';
  }, [notificationSystem]);

  const showSuccess = useCallback((title: string, message: string) => {
    return addNotification({ title, message, type: 'success' });
  }, [addNotification]);

  const showError = useCallback((title: string, message: string) => {
    return addNotification({ title, message, type: 'error' });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message: string) => {
    return addNotification({ title, message, type: 'warning' });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message: string) => {
    return addNotification({ title, message, type: 'info' });
  }, [addNotification]);

  const showReminder = useCallback((title: string, message: string, actionUrl?: string, actionLabel?: string) => {
    return addNotification({ 
      title, 
      message, 
      type: 'reminder',
      actionUrl,
      actionLabel
    });
  }, [addNotification]);

  return {
    addNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showReminder,
    setNotificationSystem
  };
};

export default NotificationSystem;