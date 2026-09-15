"use client";

import { Fragment, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Trip, Expense } from "@/lib/insforge";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ExpenseChart from "@/components/charts/ExpenseChart";
import TripChart from "@/components/charts/TripChart";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import PageTitle from "@/components/ui/PageTitle";
import ErrorState from "@/components/ui/ErrorState";
import { fieldClassName } from "@/components/ui/fieldStyles";
import {
  ArrowDownTrayIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  CakeIcon,
  CalendarIcon,
  ChartBarIcon,
  CreditCardIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  FunnelIcon,
  HeartIcon,
  MapPinIcon,
  PaperAirplaneIcon,
  ShoppingBagIcon,
  TableCellsIcon,
  TicketIcon,
} from "@heroicons/react/24/outline";
import { formatCurrency, getLoadErrorMessage, cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { useApiResource } from "@/hooks/use-api-resource";
import { Menu, Transition } from "@headlessui/react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import { motion } from "framer-motion";

// Skeleton Component
const DashboardSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(8)].map((_, i) => (
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

interface Budget {
  id: string;
  name: string;
  total_amount: number;
  spent_amount: number;
  currency: string;
  category: string;
}

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

const dateRanges = [
  { value: "all", label: "Todo el tiempo" },
  { value: "30", label: "Últimos 30 días" },
  { value: "90", label: "Últimos 3 meses" },
  { value: "365", label: "Último año" },
];

const currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [dateRange, setDateRange] = useState("all");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const url =
    !authLoading && user?.id ? `/api/dashboard?range=${dateRange}` : null;
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

  const {
    trips,
    recentExpenses,
    currencyExpenses,
    totalSpent,
    totalBudget,
    totalTrips,
    mostVisitedDestination,
    monthlyTrend,
    activeTrips,
    upcomingTrips,
  } = useMemo(() => {
    const tripsData = data?.trips ?? [];
    const expensesData = data?.expenses ?? [];
    const budgetsData = data?.budgets ?? [];

    // Join en memoria de los gastos recientes con el titulo de su viaje.
    const tripMap = new Map(tripsData.map((trip) => [trip.id, trip.title]));
    const enrichedExpenses: ExpenseWithTrip[] = expensesData.map((expense) => ({
      ...expense,
      trips: expense.trip_id
        ? { title: tripMap.get(expense.trip_id) || "Viaje desconocido" }
        : undefined,
    }));

    // Los totales y las graficas respetan la moneda elegida en el filtro.
    const currencyExpenses = expensesData.filter(
      (expense) => expense.currency === selectedCurrency,
    );

    const totalSpent = currencyExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );
    const totalBudget = budgetsData.reduce(
      (sum, budget) =>
        budget.currency === selectedCurrency ? sum + budget.total_amount : sum,
      0,
    );

    // Destino mas visitado.
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

    // Tendencia: ultimo mes frente al anterior.
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    const lastMonthExpenses = currencyExpenses
      .filter((expense) => new Date(expense.date) >= lastMonth)
      .reduce((sum, expense) => sum + expense.amount, 0);
    const twoMonthsAgoExpenses = currencyExpenses
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

    const activeTrips = tripsData.filter(
      (trip) =>
        trip.status === "confirmed" ||
        (new Date(trip.departure_date) <= new Date() &&
          new Date(trip.return_date || "") >= new Date()),
    ).length;
    const upcomingTrips = tripsData.filter(
      (trip) => new Date(trip.departure_date) > new Date(),
    ).length;

    return {
      trips: tripsData,
      recentExpenses: enrichedExpenses,
      currencyExpenses,
      totalSpent,
      totalBudget,
      totalTrips: tripsData.length,
      mostVisitedDestination,
      monthlyTrend,
      activeTrips,
      upcomingTrips,
    };
  }, [data, selectedCurrency]);

  const error = getLoadErrorMessage(loadError, {
    timeout: "La carga de datos ha tardado demasiado. Por favor, reintenta.",
    request: "Error al cargar los datos. Por favor, intenta recargar.",
  });

  const showSkeleton =
    authLoading || loading || (url !== null && data === null && !loadError);

  const exportToJSON = () => {
    try {
      const payload = {
        trips,
        expenses: currencyExpenses,
        budgets: data?.budgets.filter(
          (budget) => budget.currency === selectedCurrency,
        ) ?? [],
        exportDate: new Date().toISOString(),
        dateRange,
        currency: selectedCurrency,
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `travel-dashboard-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (exportError) {
      const msg =
        exportError instanceof Error ? exportError.message : "Error desconocido";
      logger.error("DashboardPage: Error exporting JSON", { error: msg });
    }
  };

  const exportToPDF = async () => {
    if (!reportRef.current) return;

    setIsExporting(true);
    try {
      const element = reportRef.current;

      const dataUrl = await toPng(element, {
        backgroundColor: "#ffffff",
        pixelRatio: 1.5,
        cacheBust: true,
        fontEmbedCSS: "",
        filter: (node) => {
          if (node.tagName === "SCRIPT") return false;

          if (
            node instanceof HTMLElement &&
            node.dataset.exportExclude === "true"
          ) {
            return false;
          }
          return true;
        },
        skipAutoScale: true,
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`reporte-viajes-${new Date().toISOString().split("T")[0]}.pdf`);

      logger.info("DashboardPage: PDF exportado exitosamente");
    } catch (exportError) {
      const msg =
        exportError instanceof Error ? exportError.message : "Error desconocido";
      logger.error("DashboardPage: Error exporting PDF", {
        error: msg,
        stack: exportError instanceof Error ? exportError.stack : undefined,
      });
    } finally {
      setIsExporting(false);
    }
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
        <ErrorState
          message={error}
          onRetry={() => refetch()}
          title="Error al cargar el dashboard"
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        ref={reportRef}
        className="space-y-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Cabecera: bienvenida y menu de exportacion */}
        <PageTitle
          title={`Bienvenido, ${user?.full_name?.split(" ")[0] || "Viajero"}`}
          subtitle="Resumen de tus viajes y gastos. Filtra y exporta el informe."
          action={
            <Menu
              as="div"
              className="relative inline-block text-left z-30"
              data-export-exclude="true"
            >
              <div>
                <Menu.Button as={Fragment}>
                  <Button
                    variant="outline"
                    className="flex items-center space-x-2"
                    disabled={isExporting}
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    <span>{isExporting ? "Exportando..." : "Exportar"}</span>
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
                            active ? "bg-blue-500 text-white" : "text-gray-900"
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                        >
                          <TableCellsIcon
                            className="mr-2 h-5 w-5"
                            aria-hidden="true"
                          />
                          Exportar JSON
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={exportToPDF}
                          className={`${
                            active ? "bg-blue-500 text-white" : "text-gray-900"
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                        >
                          <DocumentTextIcon
                            className="mr-2 h-5 w-5"
                            aria-hidden="true"
                          />
                          Exportar PDF
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          }
        />

        {/* Filtros: moneda y rango de fechas */}
        <div
          className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          data-export-exclude="true"
        >
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Moneda:
              </span>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className={cn(fieldClassName, "h-auto w-auto")}
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
                className={cn(fieldClassName, "h-auto w-auto")}
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

        {/* Resumen: metricas del panel y del analisis, sin repetir bloques */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <motion.div variants={item}>
            <Card className="h-full">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-lg p-3 bg-green-100 dark:bg-green-900/30">
                    <CurrencyDollarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Total Gastado
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                      {formatCurrency(totalSpent, selectedCurrency)}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="h-full">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-lg p-3 bg-blue-100 dark:bg-blue-900/30">
                    <ChartBarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Presupuesto Total
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                      {formatCurrency(totalBudget, selectedCurrency)}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="h-full">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-lg p-3 bg-blue-100 dark:bg-blue-900/30">
                    <PaperAirplaneIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Total Viajes
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                      {totalTrips}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="h-full">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-lg p-3 bg-purple-100 dark:bg-purple-900/30">
                    <MapPinIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Destino más visitado
                    </div>
                    <div
                      className="text-lg font-bold text-gray-900 dark:text-white mt-1 truncate"
                      title={mostVisitedDestination}
                    >
                      {mostVisitedDestination}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="h-full">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-lg p-3 bg-gray-100 dark:bg-gray-900/30">
                    {monthlyTrend === "up" ? (
                      <ArrowTrendingUpIcon className="h-6 w-6 text-red-600" />
                    ) : monthlyTrend === "down" ? (
                      <ArrowTrendingDownIcon className="h-6 w-6 text-green-600" />
                    ) : (
                      <CalendarIcon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Tendencia de Gastos
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                      {monthlyTrend === "up"
                        ? "Aumentando"
                        : monthlyTrend === "down"
                          ? "Disminuyendo"
                          : "Estable"}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="h-full">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-lg p-3 bg-amber-100 dark:bg-amber-900/30">
                    <CalendarIcon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Viajes Activos
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                      {activeTrips}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card className="h-full">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0 rounded-lg p-3 bg-sky-100 dark:bg-sky-900/30">
                    <CalendarIcon className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      Próximos Viajes
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                      {upcomingTrips}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Graficas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white flex items-center">
                <span className="w-1 h-6 bg-blue-500 rounded-full mr-3"></span>
                Gastos por Categoría
              </h3>
              <ExpenseChart
                expenses={currencyExpenses}
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Viajes Recientes */}
          <motion.div
            variants={item}
            className="bg-white dark:bg-gray-800 shadow rounded-xl transition-all duration-200 border border-gray-100 dark:border-gray-700"
          >
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

          {/* Gastos Recientes */}
          <motion.div
            variants={item}
            className="bg-white dark:bg-gray-800 shadow rounded-xl transition-all duration-200 border border-gray-100 dark:border-gray-700"
          >
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
