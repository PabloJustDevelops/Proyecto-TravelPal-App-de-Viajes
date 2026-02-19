"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Trip, Expense } from "@/lib/supabase";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Plane, DollarSign, Calendar, MapPin, CreditCard } from "lucide-react";
import { logger } from "@/lib/logger";
import { getErrorMessage } from "@/lib/utils";

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

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<ExpenseWithTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      logger.debug("Dashboard: Starting data load via API");

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 15000),
      );

      // Use API route instead of direct client-side fetch
      const fetchPromise = fetch("/api/dashboard");

      const res = (await Promise.race([
        fetchPromise,
        timeoutPromise,
      ])) as Response;

      if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
      }

      const data = await res.json();

      const tripsData = data.trips || [];
      const expensesData = data.expenses || [];
      const budgetsData = data.budgets || [];

      // Efficient In-Memory Join for Recent Expenses
      const tripMap = new Map(tripsData.map((t: any) => [t.id, t.title]));

      const enrichedExpenses = expensesData.map((expense: any) => ({
        ...expense,
        trips: expense.trip_id
          ? { title: tripMap.get(expense.trip_id) || "Viaje desconocido" }
          : undefined,
      }));

      setTrips(tripsData);
      setRecentExpenses(enrichedExpenses);

      // Calculate Totals
      const calculatedSpent = expensesData.reduce(
        (acc: any, curr: any) => acc + curr.amount,
        0,
      );
      setTotalSpent(calculatedSpent);

      const calculatedBudget = budgetsData.reduce(
        (acc: any, curr: any) => acc + curr.total_amount,
        0,
      );
      setTotalBudget(calculatedBudget);

      logger.debug("Dashboard: Data load completed");
    } catch (error: any) {
      const msg = getErrorMessage(error);
      logger.error("Dashboard: Error loading data", { error: msg });

      if (error.message === "Timeout") {
        setError(
          "La carga de datos ha tardado demasiado. Por favor, reintenta.",
        );
      } else {
        setError("Error al cargar los datos. Por favor, intenta recargar.");
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  if (loading) {
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
          <button
            onClick={() => loadData()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
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
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 rounded-md p-3">
                  <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Presupuesto Total
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                      ${totalBudget.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Gastado */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 dark:bg-red-900/30 rounded-md p-3">
                  <CreditCard className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Gastado
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                      ${totalSpent.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Viajes Activos */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 dark:bg-green-900/30 rounded-md p-3">
                  <Plane className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Viajes Activos
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                      {activeTrips}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Próximos Viajes */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg transition-colors duration-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 dark:bg-yellow-900/30 rounded-md p-3">
                  <Calendar className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Próximos Viajes
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900 dark:text-white">
                      {upcomingTrips}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Trips Section */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                Viajes Recientes
              </h2>
              <Link
                href="/trips"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
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
                    className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
                          {trip.title}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                            <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {trip.destination}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 sm:mt-0">
                          <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
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
                <li className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No tienes viajes recientes
                </li>
              )}
            </ul>
          </div>

          {/* Recent Expenses Section */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-200">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                Gastos Recientes
              </h2>
              <Link
                href="/expenses"
                className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
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
                  className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {expense.description}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {expense.trips?.title}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {expense.currency} {expense.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
              {recentExpenses.length === 0 && (
                <li className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No tienes gastos recientes
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
