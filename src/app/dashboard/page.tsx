"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { createSupabaseClient, Trip, Expense } from "@/lib/supabase";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Plane, DollarSign, Calendar, MapPin, CreditCard } from "lucide-react";
import { logger } from "@/lib/logger";
import { getErrorMessage, formatCurrency } from "@/lib/utils";

// Skeleton Component
const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white overflow-hidden shadow rounded-lg p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-gray-200 rounded-md p-3 h-12 w-12"></div>
            <div className="ml-5 w-0 flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-white shadow rounded-lg h-64"></div>
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

  const loadData = useCallback(async () => {
    if (!user?.id) return;

    // Use AbortController to cancel requests if component unmounts
    const controller = new AbortController();
    const signal = controller.signal;

    try {
      const supabase = createSupabaseClient();

      // Parallel Data Fetching
      const [tripsResult, expensesResult, allExpensesResult, budgetsResult] =
        await Promise.all([
          // 1. Fetch Trips
          supabase
            .from("trips")
            .select("*")
            .eq("user_id", user.id)
            .order("departure_date", { ascending: true })
            .abortSignal(signal),

          // 2. Fetch Recent Expenses (Limit 5)
          supabase
            .from("expenses")
            .select("*")
            .eq("user_id", user.id)
            .order("date", { ascending: false })
            .limit(5)
            .abortSignal(signal),

          // 3. Fetch All Expenses (for totals) - Optimized: select only amount
          supabase
            .from("expenses")
            .select("amount, currency")
            .eq("user_id", user.id)
            .abortSignal(signal),

          // 4. Fetch Budgets
          supabase
            .from("budgets")
            .select("total_amount")
            .eq("user_id", user.id)
            .abortSignal(signal),
        ]);

      if (tripsResult.error) throw tripsResult.error;
      if (expensesResult.error) throw expensesResult.error;
      // Continue even if totals fail, just log
      if (allExpensesResult.error)
        logger.error("Error fetching total expenses", allExpensesResult.error);
      if (budgetsResult.error)
        logger.error("Error fetching budgets", budgetsResult.error);

      const tripsData = tripsResult.data || [];
      const expensesData = expensesResult.data || [];

      // Efficient In-Memory Join for Recent Expenses
      // Create a map of tripId -> tripTitle for O(1) lookup
      const tripMap = new Map(tripsData.map((t) => [t.id, t.title]));

      const enrichedExpenses = expensesData.map((expense) => ({
        ...expense,
        trips: expense.trip_id
          ? { title: tripMap.get(expense.trip_id) || "Viaje desconocido" }
          : undefined,
      }));

      setTrips(tripsData);
      setRecentExpenses(enrichedExpenses);

      // Calculate Totals
      const calculatedSpent = (allExpensesResult.data || []).reduce(
        (acc, curr) => acc + curr.amount,
        0,
      );
      setTotalSpent(calculatedSpent);

      const calculatedBudget = (budgetsResult.data || []).reduce(
        (acc, curr) => acc + curr.total_amount,
        0,
      );
      setTotalBudget(calculatedBudget);
    } catch (error: any) {
      // Ignore abort errors
      if (error.name === "AbortError") return;

      const msg = getErrorMessage(error);
      logger.error("Dashboard: Error loading data", { error: msg });
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }

    return () => controller.abort();
  }, [user?.id]); // Only re-run if user ID changes

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    // Execute loadData and capture cleanup function
    loadData().then((c) => {
      cleanup = c;
    });

    return () => {
      if (cleanup) cleanup();
    };
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bienvenido, {user?.full_name?.split(" ")[0] || "Viajero"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Aquí tienes un resumen de tus viajes y actividades recientes.
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Presupuesto Total */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Presupuesto Total
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      ${totalBudget.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Gastado */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                  <CreditCard className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Gastado
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      ${totalSpent.toLocaleString()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Viajes Activos */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <Plane className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Viajes Activos
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {activeTrips}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Próximos Viajes */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                  <Calendar className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Próximos Viajes
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
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
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
              <h2 className="text-lg font-medium leading-6 text-gray-900">
                Viajes Recientes
              </h2>
              <Link
                href="/trips"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Ver todos
              </Link>
            </div>
            <ul role="list" className="divide-y divide-gray-200">
              {trips.slice(0, 3).map((trip) => (
                <li key={trip.id}>
                  <Link
                    href={`/trips/${trip.id}`}
                    className="block hover:bg-gray-50 transition-colors"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {trip.title}
                        </p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              trip.status === "ongoing"
                                ? "bg-green-100 text-green-800"
                                : trip.status === "upcoming"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {trip.status === "ongoing"
                              ? "En curso"
                              : trip.status === "upcoming"
                                ? "Próximo"
                                : "Completado"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            {trip.destination}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <p>{new Date(trip.startDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent Expenses Section */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
              <h2 className="text-lg font-medium leading-6 text-gray-900">
                Gastos Recientes
              </h2>
              <Link
                href="/expenses"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Ver todos
              </Link>
            </div>
            <ul role="list" className="divide-y divide-gray-200">
              {recentExpenses.slice(0, 5).map((expense) => (
                <li
                  key={expense.id}
                  className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-gray-900">
                        {expense.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {expense.trips?.title}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {expense.currency} {expense.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
