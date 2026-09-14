"use client";

import { useState, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Trip, Expense } from "@/lib/insforge";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ExpenseChart from "@/components/charts/ExpenseChart";
import TripChart from "@/components/charts/TripChart";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PageSkeleton from "@/components/ui/PageSkeleton";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  DocumentTextIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import { formatCurrency, getLoadErrorMessage } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { useApiResource } from "@/hooks/use-api-resource";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

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
  const { user, loading: authLoading } = useAuth();
  const [dateRange, setDateRange] = useState("all");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const dateRanges = [
    { value: "all", label: "Todo el tiempo" },
    { value: "30", label: "Últimos 30 días" },
    { value: "90", label: "Últimos 3 meses" },
    { value: "365", label: "Último año" },
  ];

  const currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"];

  const url = !authLoading && user ? `/api/analytics?range=${dateRange}` : null;
  const {
    data,
    loading,
    error: loadError,
    refetch,
  } = useApiResource<{
    trips: Trip[];
    expenses: Expense[];
    budgets: Budget[];
  }>(url);

  const { trips, expenses, budgets, analytics } = useMemo(() => {
    const tripsData = data?.trips ?? [];
    const expensesData = data?.expenses ?? [];
    const budgetsData = data?.budgets ?? [];

    if (
      tripsData.length === 0 &&
      expensesData.length === 0 &&
      budgetsData.length === 0
    ) {
      return {
        trips: tripsData,
        expenses: expensesData,
        budgets: budgetsData,
        analytics: null as AnalyticsData | null,
      };
    }

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
        budget.currency === selectedCurrency ? sum + budget.total_amount : sum,
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
      Object.entries(destinationCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      "N/A";

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

    let monthlyTrend: AnalyticsData["monthlyTrend"] = "stable";
    if (lastMonthExpenses > twoMonthsAgoExpenses * 1.1) {
      monthlyTrend = "up";
    } else if (lastMonthExpenses < twoMonthsAgoExpenses * 0.9) {
      monthlyTrend = "down";
    }

    // Budget utilization
    const totalSpent = budgetsData.reduce(
      (sum, budget) =>
        budget.currency === selectedCurrency ? sum + budget.spent_amount : sum,
      0,
    );
    const budgetUtilization =
      totalBudgets > 0 ? (totalSpent / totalBudgets) * 100 : 0;

    return {
      trips: tripsData,
      expenses: expensesData,
      budgets: budgetsData,
      analytics: {
        totalTrips,
        totalExpenses,
        totalBudgets: budgetsData.length,
        averageExpensePerTrip,
        mostExpensiveCategory,
        mostVisitedDestination,
        monthlyTrend,
        budgetUtilization,
      },
    };
  }, [data, selectedCurrency]);

  const error = getLoadErrorMessage(loadError, {
    timeout:
      "La carga de datos ha tardado demasiado. Por favor, inténtalo de nuevo.",
    request:
      "Error al cargar los datos de análisis. Por favor, inténtalo de nuevo.",
  });

  const showSkeleton =
    authLoading || loading || (url !== null && data === null && !loadError);

  const exportToJSON = () => {
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
      logger.error("AnalyticsPage: Error exporting JSON", { error: msg });
    }
  };

  const exportToPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    try {
      const element = reportRef.current;
      
      // Generación optimizada de la imagen
      const dataUrl = await toPng(element, {
        backgroundColor: '#ffffff',
        pixelRatio: 1.5, // Equilibrio entre calidad y estabilidad
        cacheBust: true,
        fontEmbedCSS: '', // Evita el error "trim" al saltar el procesamiento de fuentes externas
        filter: (node) => {
          // Mantenemos STYLE y LINK para conservar el diseño
          if (node.tagName === 'SCRIPT') return false;
          
          // Excluimos elementos marcados explícitamente
          if (node instanceof HTMLElement && node.dataset.exportExclude === 'true') {
            return false;
          }
          return true;
        },
        skipAutoScale: true,
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`reporte-viajes-${new Date().toISOString().split("T")[0]}.pdf`);
      
      logger.info("AnalyticsPage: PDF exportado exitosamente");
    } catch (error) {
      console.error('Error generando PDF:', error);
      const msg = error instanceof Error ? error.message : "Error desconocido";
      logger.error("AnalyticsPage: Error exporting PDF", { 
        error: msg,
        stack: error instanceof Error ? error.stack : undefined
      });
    } finally {
      setIsExporting(false);
    }
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

  if (showSkeleton) {
    return (
      <DashboardLayout>
        <PageSkeleton />
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error al cargar los datos
          </h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => refetch()}>Reintentar</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6" ref={reportRef}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Análisis y Reportes
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Insights detallados sobre tus viajes y gastos
            </p>
          </div>
          
          <Menu as="div" className="relative inline-block text-left z-30" data-export-exclude="true">
            <div>
              <Menu.Button as={Fragment}>
                <Button
                  variant="outline"
                  className="flex items-center space-x-2"
                  disabled={isExporting}
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  <span>{isExporting ? 'Exportando...' : 'Exportar'}</span>
                </Button>
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="px-1 py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={exportToJSON}
                        className={`${
                          active ? 'bg-blue-500 text-white' : 'text-gray-900'
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <TableCellsIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                        Exportar JSON
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={exportToPDF}
                        className={`${
                          active ? 'bg-blue-500 text-white' : 'text-gray-900'
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        <DocumentTextIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                        Exportar PDF
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700" data-export-exclude="true">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Moneda:
              </span>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="text-sm border rounded p-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Rango de fechas:
              </span>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="text-sm border rounded p-1 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
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
          <Card className="hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-green-100 rounded-full dark:bg-green-900/30">
                  <CurrencyDollarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Gastado
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {formatCurrency(
                      analytics?.totalExpenses || 0,
                      selectedCurrency,
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-blue-100 rounded-full dark:bg-blue-900/30">
                  <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Viajes
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {analytics?.totalTrips || 0}
                  </div>
                </div>
              </div>
            </div>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-purple-100 rounded-full dark:bg-purple-900/30">
                  <MapPinIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Destino más visitado
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white mt-1 truncate max-w-[150px]" title={analytics?.mostVisitedDestination || "N/A"}>
                    {analytics?.mostVisitedDestination || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-gray-100 rounded-full dark:bg-gray-800">
                  {analytics?.monthlyTrend === "up" ? (
                    <ArrowTrendingUpIcon className="h-6 w-6 text-red-600" />
                  ) : analytics?.monthlyTrend === "down" ? (
                    <ArrowTrendingDownIcon className="h-6 w-6 text-green-600" />
                  ) : (
                    <CalendarIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                  )}
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Tendencia de Gastos
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                    {analytics?.monthlyTrend === "up" ? "Aumentando" : 
                     analytics?.monthlyTrend === "down" ? "Disminuyendo" : "Estable"}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white flex items-center">
                <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
                Gastos por Categoría
              </h3>
              <ExpenseChart
                expenses={expenses.filter(
                  (e) => e.currency === selectedCurrency,
                )}
                currency={selectedCurrency}
                height={350}
              />
            </div>
          </Card>
          <Card className="overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white flex items-center">
                <span className="w-1 h-6 bg-purple-500 rounded-full mr-3"></span>
                Estado de Viajes
              </h3>
              <TripChart trips={trips} height={350} />
            </div>
          </Card>
          
          <Card className="overflow-hidden lg:col-span-2">
             <div className="p-6">
              <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white flex items-center">
                <span className="w-1 h-6 bg-green-500 rounded-full mr-3"></span>
                Destinos más Populares
              </h3>
              <TripChart trips={trips} type="destinations" height={300} />
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}