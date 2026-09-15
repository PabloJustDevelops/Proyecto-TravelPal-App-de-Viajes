"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Trip, Expense } from "@/lib/insforge";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import {
  CakeIcon,
  CalendarIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  HeartIcon,
  MapPinIcon,
  PaperAirplaneIcon,
  ShoppingBagIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";
import { formatCurrency, getLoadErrorMessage } from "@/lib/utils";
import { useApiResource } from "@/hooks/use-api-resource";
import { motion } from "framer-motion";

// Skeleton Component
const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg p-5"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gray-200 dark:bg-gray-700 rounded-md p-3 h-12 w-12"></div>
            <div className="ml-5 w-0 flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {[...Array(2)].map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 shadow rounded-lg h-64"
        ></div>
      ))}
    </div>
  </div>
);

interface ExpenseWithTrip extends Expense {
  trips?: {
    title: string;
  };
}

const getCategoryIcon = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'food':
    case 'comida':
      return <CakeIcon className="h-5 w-5 text-orange-500" />;
    case 'transport':
    case 'transporte':
      return <PaperAirplaneIcon className="h-5 w-5 text-blue-500" />;
    case 'accommodation':
    case 'alojamiento':
      return <MapPinIcon className="h-5 w-5 text-purple-500" />;
    case 'shopping':
    case 'compras':
      return <ShoppingBagIcon className="h-5 w-5 text-pink-500" />;
    case 'entertainment':
    case 'entretenimiento':
      return <TicketIcon className="h-5 w-5 text-yellow-500" />;
    case 'health':
    case 'salud':
      return <HeartIcon className="h-5 w-5 text-red-500" />;
    default:
      return <CreditCardIcon className="h-5 w-5 text-gray-500" />;
  }
};

const getCategoryName = (category: string) => {
  const categories: Record<string, string> = {
    food: 'Comida',
    transport: 'Transporte',
    accommodation: 'Alojamiento',
    shopping: 'Compras',
    entertainment: 'Entretenimiento',
    health: 'Salud',
    other: 'Otros'
  };
  return categories[category?.toLowerCase()] || category || 'Gasto';
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const url = !authLoading && user?.id ? "/api/dashboard" : null;
  const {
    data,
    loading,
    error: loadError,
    refetch,
  } = useApiResource<{
    trips: Trip[];
    expenses: Expense[];
    budgets: { total_amount: number }[];
  }>(url);

  const { trips, recentExpenses, totalBudget, totalSpent } = useMemo(() => {
    const tripsData = data?.trips ?? [];
    const expensesData = data?.expenses ?? [];
    const budgetsData = data?.budgets ?? [];

    // Efficient In-Memory Join for Recent Expenses
    const tripMap = new Map(tripsData.map((trip) => [trip.id, trip.title]));

    const enrichedExpenses: ExpenseWithTrip[] = expensesData.map((expense) => ({
      ...expense,
      trips: expense.trip_id
        ? { title: tripMap.get(expense.trip_id) || "Viaje desconocido" }
        : undefined,
    }));

    return {
      trips: tripsData,
      recentExpenses: enrichedExpenses,
      totalSpent: expensesData.reduce((acc, curr) => acc + curr.amount, 0),
      totalBudget: budgetsData.reduce(
        (acc, curr) => acc + curr.total_amount,
        0,
      ),
    };
  }, [data]);

  const error = getLoadErrorMessage(loadError, {
    timeout: "La carga de datos ha tardado demasiado. Por favor, reintenta.",
    request: "Error al cargar los datos. Por favor, intenta recargar.",
  });

  const showSkeleton =
    authLoading || loading || (url !== null && data === null && !loadError);

  const activeTrips = useMemo(
    () =>
      trips.filter(
        (trip) =>
          trip.status === "confirmed" ||
          (new Date(trip.departure_date) <= new Date() &&
            new Date(trip.return_date || "") >= new Date()),
      ).length,
    [trips],
  );

  const upcomingTrips = useMemo(
    () =>
      trips.filter((trip) => new Date(trip.departure_date) > new Date()).length,
    [trips],
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (showSkeleton) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="text-red-500 mb-4">
            <svg
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-gray-900 font-medium mb-2">
            Error al cargar el dashboard
          </p>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => refetch()}>Reintentar</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div 
        className="space-y-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Bienvenido, {user?.full_name?.split(" ")[0] || "Viajero"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Aquí tienes un resumen de tus viajes y actividades recientes.
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {/* Card 1: Presupuesto Total */}
          <motion.div variants={item} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border border-gray-100 dark:border-gray-700">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3">
                  <CurrencyDollarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Presupuesto Total
                    </dt>
                    <dd className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                      {formatCurrency(totalBudget, 'USD')}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Gastado */}
          <motion.div variants={item} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border border-gray-100 dark:border-gray-700">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 dark:bg-red-900/30 rounded-lg p-3">
                  <CreditCardIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Gastado
                    </dt>
                    <dd className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                      {formatCurrency(totalSpent, 'USD')}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 3: Viajes Activos */}
          <motion.div variants={item} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border border-gray-100 dark:border-gray-700">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 dark:bg-green-900/30 rounded-lg p-3">
                  <PaperAirplaneIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Viajes Activos
                    </dt>
                    <dd className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                      {activeTrips}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 4: Próximos Viajes */}
          <motion.div variants={item} className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border border-gray-100 dark:border-gray-700">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-3">
                  <CalendarIcon className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Próximos Viajes
                    </dt>
                    <dd className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                      {upcomingTrips}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Trips Section */}
          <motion.div variants={item} className="bg-white dark:bg-gray-800 shadow rounded-xl transition-all duration-200 border border-gray-100 dark:border-gray-700">
            <div className="px-6 py-5 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white flex items-center gap-2">
                <MapPinIcon className="h-5 w-5 text-blue-500" />
                Viajes Recientes
              </h2>
              <Link
                href="/trips"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors hover:underline"
              >
                Ver todos
              </Link>
            </div>
            <ul
              role="list"
              className="divide-y divide-gray-200 dark:divide-gray-700"
            >
              {trips.slice(0, 3).map((trip) => (
                <li key={trip.id}>
                  <Link
                    href={`/trips/${trip.id}`}
                    className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                  >
                    <div className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate group-hover:text-blue-700 dark:group-hover:text-blue-300">
                          {trip.title}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <span
                            className={`px-2.5 py-0.5 inline-flex text-xs font-medium rounded-full ${
                              trip.status === "confirmed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : trip.status === "planned"
                                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                  : trip.status === "cancelled"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {trip.status === "confirmed"
                              ? "Confirmado"
                              : trip.status === "planned"
                                ? "Planificado"
                                : trip.status === "cancelled"
                                  ? "Cancelado"
                                  : "Completado"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <MapPinIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {trip.destination}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                          <CalendarIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <p>
                            {new Date(trip.departure_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
              {trips.length === 0 && (
                <li className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 text-sm flex flex-col items-center">
                  <PaperAirplaneIcon className="h-10 w-10 text-gray-300 mb-2" />
                  No tienes viajes recientes
                </li>
              )}
            </ul>
          </motion.div>

          {/* Recent Expenses Section */}
          <motion.div variants={item} className="bg-white dark:bg-gray-800 shadow rounded-xl transition-all duration-200 border border-gray-100 dark:border-gray-700">
            <div className="px-6 py-5 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold leading-6 text-gray-900 dark:text-white flex items-center gap-2">
                <CreditCardIcon className="h-5 w-5 text-purple-500" />
                Gastos Recientes
              </h2>
              <Link
                href="/expenses"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors hover:underline"
              >
                Ver todos
              </Link>
            </div>
            <ul
              role="list"
              className="divide-y divide-gray-200 dark:divide-gray-700"
            >
              {recentExpenses.slice(0, 5).map((expense) => (
                <li
                  key={expense.id}
                  className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg group-hover:bg-white dark:group-hover:bg-gray-600 transition-colors">
                      {getCategoryIcon(expense.category)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {expense.description || getCategoryName(expense.category)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                        {expense.trips ? (
                          <>
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full inline-block" />
                            {expense.trips.title}
                          </>
                        ) : (
                          getCategoryName(expense.category)
                        )}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatCurrency(expense.amount, expense.currency)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
              {recentExpenses.length === 0 && (
                <li className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 text-sm flex flex-col items-center">
                  <CreditCardIcon className="h-10 w-10 text-gray-300 mb-2" />
                  No tienes gastos recientes
                </li>
              )}
            </ul>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
