"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Expense, Trip } from "@/lib/insforge";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ExpenseCard from "@/components/expenses/ExpenseCard";
import Button from "@/components/ui/Button";
import PageTitle from "@/components/ui/PageTitle";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import { selectClassName } from "@/components/ui/fieldStyles";
import ErrorState from "@/components/ui/ErrorState";
import { Card, CardContent } from "@/components/ui/Card";
import {
  PlusIcon,
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  CalendarIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";
import { formatCurrency, getLoadErrorMessage } from "@/lib/utils";
import Link from "next/link";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { useApiResource } from "@/hooks/use-api-resource";

export default function ExpensesPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tripFilter, setTripFilter] = useState<string>("all");

  const url = !authLoading && user ? "/api/expenses" : null;
  const {
    data,
    loading,
    error: loadError,
    refetch,
  } = useApiResource<{
    expenses: (Expense & { trip?: Trip })[];
    trips: Trip[];
  }>(url);

  const { expenses, trips, filteredExpenses } = useMemo(() => {
    const expensesData = data?.expenses ?? [];
    const tripsData = data?.trips ?? [];

    let filtered = expensesData;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (expense) =>
          expense.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          expense.trip?.title.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Filter by category
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (expense) => expense.category === categoryFilter,
      );
    }

    // Filter by trip
    if (tripFilter !== "all") {
      filtered = filtered.filter((expense) => expense.trip_id === tripFilter);
    }

    return {
      expenses: expensesData,
      trips: tripsData,
      filteredExpenses: filtered,
    };
  }, [data, searchTerm, categoryFilter, tripFilter]);

  const error = getLoadErrorMessage(loadError, {
    timeout:
      "La carga de datos ha tardado demasiado. Por favor, inténtalo de nuevo.",
    request: "Error al cargar los gastos. Por favor, inténtalo de nuevo.",
  });

  const showSkeleton =
    authLoading || loading || (url !== null && data === null && !loadError);

  const getExpenseStats = () => {
    const totalAmount = expenses.reduce((sum, expense) => {
      // Convert to EUR for calculation (simplified)
      const amount =
        expense.currency === "EUR" ? expense.amount : expense.amount * 0.85;
      return sum + amount;
    }, 0);

    const categoryTotals = expenses.reduce(
      (acc, expense) => {
        const amount =
          expense.currency === "EUR" ? expense.amount : expense.amount * 0.85;
        acc[expense.category] = (acc[expense.category] || 0) + amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    const topCategory = Object.entries(categoryTotals).sort(
      ([, a], [, b]) => b - a,
    )[0];

    return {
      total: totalAmount,
      count: expenses.length,
      topCategory: topCategory ? topCategory[0] : null,
      topCategoryAmount: topCategory ? topCategory[1] : 0,
      avgPerExpense: expenses.length > 0 ? totalAmount / expenses.length : 0,
    };
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      accommodation: "Alojamiento",
      transport: "Transporte",
      food: "Comida",
      entertainment: "Entretenimiento",
      shopping: "Compras",
      health: "Salud",
      insurance: "Seguro",
      other: "Otros",
    };
    return names[category] || category;
  };

  const stats = getExpenseStats();

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
        <ErrorState message={error} onRetry={() => refetch()} />
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-900">
            Inicia sesión para ver tus gastos
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            La sección de gastos requiere autenticación.
          </p>
          <Link href="/signin">
            <Button className="mt-4">Ir a Login</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageTitle
          title="Mis Gastos"
          subtitle="Controla y analiza todos tus gastos de viaje"
          action={
            <Link href="/expenses/new">
              <Button>
                <PlusIcon className="h-4 w-4 mr-2" />
                Nuevo Gasto
              </Button>
            </Link>
          }
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Gastado
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats.total, "EUR")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Total Gastos
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.count}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Promedio por Gasto
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats.avgPerExpense, "EUR")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrophyIcon className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Categoría Principal
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {stats.topCategory
                      ? getCategoryName(stats.topCategory)
                      : "N/A"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar gastos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="lg:w-48">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={selectClassName}
              >
                <option value="all">Todas las categorías</option>
                <option value="accommodation">Alojamiento</option>
                <option value="transport">Transporte</option>
                <option value="food">Comida</option>
                <option value="entertainment">Entretenimiento</option>
                <option value="shopping">Compras</option>
                <option value="health">Salud</option>
                <option value="insurance">Seguro</option>
                <option value="other">Otros</option>
              </select>
            </div>

            {/* Trip Filter */}
            <div className="lg:w-48">
              <select
                value={tripFilter}
                onChange={(e) => setTripFilter(e.target.value)}
                className={selectClassName}
              >
                <option value="all">Todos los viajes</option>
                {trips.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Expenses Grid */}
        {filteredExpenses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExpenses.map((expense) => (
              <ExpenseCard key={expense.id} expense={expense} showTripTitle />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<CurrencyDollarIcon className="h-12 w-12" />}
            title={
              searchTerm || categoryFilter !== "all" || tripFilter !== "all"
                ? "No se encontraron gastos"
                : "No tienes gastos registrados"
            }
            description={
              searchTerm || categoryFilter !== "all" || tripFilter !== "all"
                ? "Intenta ajustar los filtros de búsqueda"
                : "Comienza registrando tu primer gasto"
            }
            action={
              !searchTerm &&
              categoryFilter === "all" &&
              tripFilter === "all" ? (
                <Link href="/expenses/new">
                  <Button>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Registrar Primer Gasto
                  </Button>
                </Link>
              ) : undefined
            }
          />
        )}
      </div>
    </DashboardLayout>
  );
}
