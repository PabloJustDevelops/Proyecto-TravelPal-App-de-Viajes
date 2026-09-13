"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Expense } from "@/lib/insforge";
import DashboardLayout from "@/components/layout/DashboardLayout";
import BudgetCard from "@/components/budget/BudgetCard";
import ExpenseChart from "@/components/charts/ExpenseChart";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import PageSkeleton from "@/components/ui/PageSkeleton";
import { logger } from "@/lib/logger";
import {
  PlusIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import {
  formatCurrency,
  getErrorMessage,
  getLoadErrorMessage,
} from "@/lib/utils";
import { useApiResource } from "@/hooks/use-api-resource";

interface Budget {
  id: string;
  name: string;
  total_amount: number;
  spent_amount: number;
  currency: string;
  category: string;
  trip_id?: string;
  trip_title?: string;
  start_date: string;
  end_date: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface BudgetWithTrip extends Budget {
  trips?: {
    id: string;
    title: string;
  };
}

interface Trip {
  id: string;
  title: string;
}

interface BudgetFormData {
  name: string;
  total_amount: string;
  currency: string;
  category: string;
  trip_id: string;
  start_date: string;
  end_date: string;
  description: string;
}

export default function BudgetPage() {
  const { user, loading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTrip, setSelectedTrip] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState<BudgetFormData>({
    name: "",
    total_amount: "",
    currency: "USD",
    category: "",
    trip_id: "",
    start_date: "",
    end_date: "",
    description: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const categories = [
    { value: "travel", label: "Viaje General" },
    { value: "accommodation", label: "Alojamiento" },
    { value: "food", label: "Comida" },
    { value: "transport", label: "Transporte" },
    { value: "entertainment", label: "Entretenimiento" },
    { value: "shopping", label: "Compras" },
    { value: "other", label: "Otros" },
  ];

  const currencies = [
    { value: "USD", label: "USD - Dólar Estadounidense" },
    { value: "EUR", label: "EUR - Euro" },
    { value: "GBP", label: "GBP - Libra Esterlina" },
    { value: "JPY", label: "JPY - Yen Japonés" },
    { value: "CAD", label: "CAD - Dólar Canadiense" },
    { value: "AUD", label: "AUD - Dólar Australiano" },
    { value: "CHF", label: "CHF - Franco Suizo" },
    { value: "CNY", label: "CNY - Yuan Chino" },
  ];

  const url = !authLoading && user ? "/api/budget" : null;
  const {
    data,
    loading,
    error: loadError,
    refetch,
  } = useApiResource<{
    budgets: BudgetWithTrip[];
    trips: Trip[];
    expenses: Expense[];
  }>(url);

  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (!data) return;

    const budgetsData = data.budgets ?? [];
    const tripsData = data.trips ?? [];
    const expensesData = data.expenses ?? [];

    // Create a map of trip IDs to titles
    const tripsMap = tripsData.reduce<Record<string, string>>((acc, trip) => {
      acc[trip.id] = trip.title;
      return acc;
    }, {});

    // Calculate spent amounts for each budget
    const budgetsWithSpent: Budget[] = budgetsData.map((budget) => {
      const budgetExpenses = expensesData.filter((expense) => {
        const expenseDate = new Date(expense.date);
        const budgetStart = new Date(budget.start_date);
        budgetStart.setHours(0, 0, 0, 0);

        const budgetEnd = new Date(budget.end_date);
        budgetEnd.setHours(23, 59, 59, 999);

        const dateInRange = expenseDate >= budgetStart && expenseDate <= budgetEnd;
        const categoryMatch =
          budget.category === "travel" || expense.category === budget.category;
        const tripMatch =
          !budget.trip_id || expense.trip_id === budget.trip_id;

        return (
          dateInRange &&
          categoryMatch &&
          tripMatch &&
          expense.currency === budget.currency
        );
      });

      const spentAmount = budgetExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0,
      );

      return {
        ...budget,
        spent_amount: spentAmount,
        trip_title: budget.trip_id ? tripsMap[budget.trip_id] : undefined,
      };
    });

    setBudgets(budgetsWithSpent);
    setTrips(tripsData);
    setExpenses(expensesData);
  }, [data]);

  const error = getLoadErrorMessage(loadError, {
    timeout:
      "La carga de datos ha tardado demasiado. Por favor, inténtalo de nuevo.",
    request:
      "Error al cargar los presupuestos. Por favor, inténtalo de nuevo.",
  });

  const showSkeleton =
    authLoading || loading || (url !== null && data === null && !loadError);

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

  if (!user) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-900">
            Inicia sesión para gestionar tus presupuestos
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            La sección de presupuesto requiere autenticación.
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

  const filteredBudgets = budgets.filter((budget) => {
    const matchesSearch =
      budget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      budget.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || budget.category === selectedCategory;
    const matchesTrip = !selectedTrip || budget.trip_id === selectedTrip;

    return matchesSearch && matchesCategory && matchesTrip;
  });

  const handleCreateBudget = () => {
    setEditingBudget(null);
    setFormData({
      name: "",
      total_amount: "",
      currency: "USD",
      category: "",
      trip_id: "",
      start_date: "",
      end_date: "",
      description: "",
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      name: budget.name,
      total_amount: budget.total_amount.toString(),
      currency: budget.currency,
      category: budget.category,
      trip_id: budget.trip_id || "",
      start_date: budget.start_date,
      end_date: budget.end_date,
      description: budget.description || "",
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = "El nombre es requerido";
    }

    if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
      errors.total_amount = "El monto debe ser mayor a 0";
    }

    if (!formData.category) {
      errors.category = "La categoría es requerida";
    }

    if (!formData.start_date) {
      errors.start_date = "La fecha de inicio es requerida";
    }

    if (!formData.end_date) {
      errors.end_date = "La fecha de fin es requerida";
    }

    if (
      formData.start_date &&
      formData.end_date &&
      new Date(formData.start_date) >= new Date(formData.end_date)
    ) {
      errors.end_date =
        "La fecha de fin debe ser posterior a la fecha de inicio";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setSubmitError(null);

      const budgetData = {
        name: formData.name.trim(),
        total_amount: parseFloat(formData.total_amount),
        currency: formData.currency,
        category: formData.category,
        trip_id: formData.trip_id || null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        description: formData.description.trim() || null,
        user_id: user?.id,
      };

      // Use API for both create and update
      const isEditing = !!editingBudget;
      const url = isEditing ? `/api/budget/${editingBudget.id}` : '/api/budget';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(budgetData)
      });

      if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Error al guardar el presupuesto');
      }

      setShowCreateModal(false);
      refetch();
    } catch (error) {
      const msg = getErrorMessage(error, "Error al guardar el presupuesto");
      logger.error("Error saving budget:", { error: msg, raw: error });
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este presupuesto?"))
      return;

    const previousBudgets = [...budgets];
    try {
      // Optimistic update
      setBudgets((prev) => prev.filter((b) => b.id !== budgetId));

      // Use API for delete
      const res = await fetch(`/api/budget/${budgetId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Error al eliminar el presupuesto');
      }

      // No need to call loadData() if optimistic update is successful, 
      // but if we want to be 100% sure we can. 
      // Given the user issues, let's rely on optimistic for speed and maybe background refresh if needed.
      // But for now, optimistic is fine.
    } catch (error) {
      // Rollback on error
      setBudgets(previousBudgets);
      const msg = getErrorMessage(error, "Error al eliminar el presupuesto");
      logger.error("Error deleting budget:", { error: msg, raw: error });
      alert(msg);
    }
  };

  // Calculate statistics
  const totalBudgets = budgets.length;
  const totalBudgetAmount = budgets.reduce(
    (sum, budget) => sum + budget.total_amount,
    0,
  );
  const totalSpentAmount = budgets.reduce(
    (sum, budget) => sum + budget.spent_amount,
    0,
  );
  const overBudgetCount = budgets.filter(
    (budget) => budget.spent_amount > budget.total_amount,
  ).length;
  const nearLimitCount = budgets.filter((budget) => {
    const percentage =
      budget.total_amount > 0
        ? (budget.spent_amount / budget.total_amount) * 100
        : 0;
    return percentage >= 80 && budget.spent_amount <= budget.total_amount;
  }).length;

  // Determine the main currency to display
  // We use the currency of the most recent budget, or default to USD
  const displayCurrency = budgets.length > 0 ? budgets[0].currency : "USD";

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestión de Presupuestos
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Controla tus gastos y mantén tus finanzas organizadas
            </p>
          </div>
          <Button
            onClick={handleCreateBudget}
            className="flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Nuevo Presupuesto</span>
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Presupuestos
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalBudgets}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Presupuesto Total
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalBudgetAmount, displayCurrency)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Gastado
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalSpentAmount, displayCurrency)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Alertas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {overBudgetCount + nearLimitCount}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts */}
        {budgets.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpenseChart
              expenses={expenses}
              type="category"
              title="Gastos por Categoría"
              currency={displayCurrency}
            />
            <ExpenseChart
              expenses={expenses}
              type="timeline"
              title="Tendencia de Gastos"
              currency={displayCurrency}
            />
          </div>
        )}

        {/* Filters */}
        <Card className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar presupuestos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700"
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>

            <select
              value={selectedTrip}
              onChange={(e) => setSelectedTrip(e.target.value)}
              className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700"
            >
              <option value="">Todos los viajes</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.title}
                </option>
              ))}
            </select>

            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              {filteredBudgets.length} de {budgets.length} presupuestos
            </div>
          </div>
        </Card>

        {/* Budget List */}
        {filteredBudgets.length === 0 ? (
          <Card className="p-12 text-center">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {budgets.length === 0
                ? "No tienes presupuestos"
                : "No se encontraron presupuestos"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {budgets.length === 0
                ? "Crea tu primer presupuesto para comenzar a controlar tus gastos"
                : "Intenta ajustar los filtros para encontrar lo que buscas"}
            </p>
            {budgets.length === 0 && (
              <Button onClick={handleCreateBudget}>Crear Presupuesto</Button>
            )}
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredBudgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                onEdit={handleEditBudget}
                onDelete={handleDeleteBudget}
              />
            ))}
          </div>
        )}

        {/* Create/Edit Budget Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title={editingBudget ? "Editar Presupuesto" : "Nuevo Presupuesto"}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {submitError && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-md text-sm">
                {submitError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Presupuesto *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ej: Vacaciones en Europa"
                error={formErrors.name}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monto Total *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.total_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, total_amount: e.target.value })
                  }
                  placeholder="0.00"
                  error={formErrors.total_amount}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Moneda *
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                >
                  {currencies.map((currency) => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoría *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                >
                  <option value="">Seleccionar categoría</option>
                  {categories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                {formErrors.category && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {formErrors.category}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Viaje Asociado
                </label>
                <select
                  value={formData.trip_id}
                  onChange={(e) =>
                    setFormData({ ...formData, trip_id: e.target.value })
                  }
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                >
                  <option value="">Sin viaje específico</option>
                  {trips.map((trip) => (
                    <option key={trip.id} value={trip.id}>
                      {trip.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Inicio *
                </label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  error={formErrors.start_date}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fecha de Fin *
                </label>
                <Input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                  error={formErrors.end_date}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder:text-gray-400"
                placeholder="Descripción opcional del presupuesto..."
              />
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={submitting}>
                {editingBudget ? "Actualizar" : "Crear"} Presupuesto
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
