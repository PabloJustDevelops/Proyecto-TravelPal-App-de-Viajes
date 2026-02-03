"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Trip, Expense } from "@/lib/supabase";
import { createSupabaseClient } from "@/lib/supabase";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ExpenseChart from "@/components/charts/ExpenseChart";
import TripChart from "@/components/charts/TripChart";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { formatCurrency, getErrorMessage } from "@/lib/utils";
import { logger } from "@/lib/logger";

interface Budget {
  id: string;
  name: string;
  total_amount: number;
  spent_amount: number;
  currency: string;
  category: string;
}

interface AnalyticsData {
  totalTrips: number;
  totalExpenses: number;
  totalBudgets: number;
  averageExpensePerTrip: number;
  mostExpensiveCategory: string;
  mostVisitedDestination: string;
  monthlyTrend: "up" | "down" | "stable";
  budgetUtilization: number;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("all");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");

  const dateRanges = [
    { value: "all", label: "Todo el tiempo" },
    { value: "30", label: "Últimos 30 días" },
    { value: "90", label: "Últimos 3 meses" },
    { value: "365", label: "Último año" },
  ];

  const currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"];

  const calculateAnalytics = useCallback(
    (tripsData: Trip[], expensesData: Expense[], budgetsData: Budget[]) => {
      // Filter expenses by selected currency
      const filteredExpenses = expensesData.filter(
        (expense) => expense.currency === selectedCurrency,
      );

      // Total calculations
      const totalTrips = tripsData.length;
      const totalExpenses = filteredExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0,
      );
      const totalBudgets = budgetsData.reduce(
        (sum, budget) =>
          budget.currency === selectedCurrency
            ? sum + budget.total_amount
            : sum,
        0,
      );

      // Average expense per trip
      const averageExpensePerTrip =
        totalTrips > 0 ? totalExpenses / totalTrips : 0;

      // Most expensive category
      const categoryTotals = filteredExpenses.reduce(
        (acc, expense) => {
          acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
          return acc;
        },
        {} as Record<string, number>,
      );

      const mostExpensiveCategory =
        Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0]?.[0] ||
        "N/A";

      // Most visited destination
      const destinationCounts = tripsData.reduce(
        (acc, trip) => {
          const destination = trip.destination || "Desconocido";
          acc[destination] = (acc[destination] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const mostVisitedDestination =
        Object.entries(destinationCounts).sort(
          ([, a], [, b]) => b - a,
        )[0]?.[0] || "N/A";

      // Monthly trend (comparing last 2 months)
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

      const lastMonthExpenses = filteredExpenses
        .filter((expense) => new Date(expense.date) >= lastMonth)
        .reduce((sum, expense) => sum + expense.amount, 0);

      const twoMonthsAgoExpenses = filteredExpenses
        .filter((expense) => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= twoMonthsAgo && expenseDate < lastMonth;
        })
        .reduce((sum, expense) => sum + expense.amount, 0);

      let monthlyTrend: "up" | "down" | "stable" = "stable";
      if (lastMonthExpenses > twoMonthsAgoExpenses * 1.1) {
        monthlyTrend = "up";
      } else if (lastMonthExpenses < twoMonthsAgoExpenses * 0.9) {
        monthlyTrend = "down";
      }

      // Budget utilization
      const totalSpent = budgetsData.reduce(
        (sum, budget) =>
          budget.currency === selectedCurrency
            ? sum + budget.spent_amount
            : sum,
        0,
      );
      const budgetUtilization =
        totalBudgets > 0 ? (totalSpent / totalBudgets) * 100 : 0;

      setAnalytics({
        totalTrips,
        totalExpenses,
        totalBudgets: budgetsData.length,
        averageExpensePerTrip,
        mostExpensiveCategory,
        mostVisitedDestination,
        monthlyTrend,
        budgetUtilization,
      });
    },
    [selectedCurrency],
  );

  const loadData = useCallback(
    async (signal?: AbortSignal) => {
      if (!user) return;

      setLoading(true);
      try {
        const supabase = createSupabaseClient();

        // Compute start date based on dateRange
        let startISO: string | null = null;
        if (dateRange !== "all") {
          const days = parseInt(dateRange, 10);
          if (!isNaN(days)) {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - (days - 1));
            startISO = d.toISOString();
          }
        }

        // Load trips
        let tripsQuery = supabase
          .from("trips")
          .select(
            "id, user_id, title, origin, destination, departure_date, return_date, airline, flight_number, status, notes, created_at, updated_at",
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (startISO) {
          tripsQuery = tripsQuery.gte("departure_date", startISO);
        }

        const { data: tripsData, error: tripsError } = await (signal
          ? tripsQuery.abortSignal(signal)
          : tripsQuery);

        if (tripsError) throw tripsError;

        // Load expenses
        let expensesQuery = supabase
          .from("expenses")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false });

        if (startISO) {
          expensesQuery = expensesQuery.gte("date", startISO);
        }

        const { data: expensesData, error: expensesError } = await (signal
          ? expensesQuery.abortSignal(signal)
          : expensesQuery);

        if (expensesError) throw expensesError;

        // Load budgets (no date range filter)
        const budgetsQuery = supabase
          .from("budgets")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        const { data: budgetsData, error: budgetsError } = await (signal
          ? budgetsQuery.abortSignal(signal)
          : budgetsQuery);

        if (budgetsError) throw budgetsError;

        setTrips(tripsData || []);
        setExpenses(expensesData || []);
        setBudgets(budgetsData || []);

        // calculateAnalytics called by useEffect when data changes
      } catch (error: any) {
        if (
          (error instanceof Error && error.name === "AbortError") ||
          error?.code === 20 ||
          error?.message?.includes("AbortError")
        ) {
          return;
        }
        const msg = getErrorMessage(error, "Error loading analytics data");
        logger.error("AnalyticsPage: Error loading analytics data", {
          error: msg,
          raw: error,
        });
      } finally {
        setLoading(false);
      }
    },
    [user, dateRange],
  );

  useEffect(() => {
    if (trips.length > 0 || expenses.length > 0 || budgets.length > 0) {
      calculateAnalytics(trips, expenses, budgets);
    }
  }, [trips, expenses, budgets, calculateAnalytics]);

  useEffect(() => {
    if (user) {
      const controller = new AbortController();
      loadData(controller.signal);
      return () => controller.abort();
    } else {
      // Evitar spinner infinito cuando no hay usuario
      setLoading(false);
    }
  }, [user, loadData]);

  const exportData = async () => {
    try {
      const data = {
        trips,
        expenses: expenses.filter(
          (expense) => expense.currency === selectedCurrency,
        ),
        budgets: budgets.filter(
          (budget) => budget.currency === selectedCurrency,
        ),
        analytics,
        exportDate: new Date().toISOString(),
        dateRange,
        currency: selectedCurrency,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `travel-analytics-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error desconocido";
      logger.error("AnalyticsPage: Error exporting data", { error: msg });
    }
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      accommodation: "Alojamiento",
      food: "Comida",
      transport: "Transporte",
      entertainment: "Entretenimiento",
      shopping: "Compras",
      other: "Otros",
    };
    return names[category] || category;
  };

  // Mostrar mensaje de autenticación cuando no hay usuario
  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-900">
            Inicia sesión para ver el análisis
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            La sección de análisis requiere autenticación.
          </p>
          <Button
            className="mt-4"
            onClick={() => (window.location.href = "/signin")}
          >
            Ir a Login
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Análisis y Reportes
            </h1>
            <p className="text-gray-600">
              Insights detallados sobre tus viajes y gastos
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={exportData}
              className="flex items-center space-x-2"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              <span>Exportar</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-700">Moneda:</span>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="text-sm border rounded p-1"
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700">Rango de fechas:</span>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="text-sm border rounded p-1"
              >
                {dateRanges.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">
                    Total Gastado
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      analytics?.totalExpenses || 0,
                      selectedCurrency,
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">
                    Total Viajes
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics?.totalTrips || 0}
                  </div>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <MapPinIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">
                    Destino más visitado
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {analytics?.mostVisitedDestination || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {analytics?.monthlyTrend === "up" ? (
                    <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
                  ) : analytics?.monthlyTrend === "down" ? (
                    <ArrowTrendingDownIcon className="h-8 w-8 text-red-600" />
                  ) : (
                    <CalendarIcon className="h-8 w-8 text-gray-600" />
                  )}
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">
                    Tendencia mensual
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    {analytics?.monthlyTrend || "stable"}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                Gastos por Categoría
              </h3>
              <ExpenseChart
                expenses={expenses.filter(
                  (e) => e.currency === selectedCurrency,
                )}
              />
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Viajes por Destino</h3>
              <TripChart trips={trips} />
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
