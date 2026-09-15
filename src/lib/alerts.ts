import type { Booking, Expense, Task } from "@/lib/insforge";

/**
 * Derivacion de alertas a partir de datos que ya existen (tareas, reservas,
 * presupuestos y gastos). No hay un segundo modelo de datos: esto solo lee filas
 * con RLS y produce alertas con un id determinista para poder persistirlas en la
 * tabla `alerts` sin duplicarlas.
 */

/** Tipo local minimo de `budgets`: insforge.ts no exporta presupuesto y aqui solo
 * hacen falta estos campos. */
export interface AlertBudget {
  id: string;
  name: string;
  total_amount: number;
  currency: string;
  trip_id?: string;
  category: string;
  start_date: string;
  end_date: string;
}

export interface DerivedAlert {
  id: string;
  type: "reminder" | "warning" | "info";
  title: string;
  message: string;
  /** Fecha relevante de la alerta, en ISO 8601. */
  alert_date: string;
}

export interface DeriveAlertsInput {
  tasks: Task[];
  bookings: Booking[];
  budgets: AlertBudget[];
  expenses: Expense[];
}

// Ventanas de aviso (en dias) alrededor de hoy.
const TASK_WINDOW_DAYS = 7;
const BOOKING_WINDOW_DAYS = 7;

// Orden de prioridad al desempatar alertas con la misma fecha.
const TYPE_PRIORITY: Record<DerivedAlert["type"], number> = {
  warning: 0,
  reminder: 1,
  info: 2,
};

/**
 * Convierte una fecha de la base de datos en `Date`. Las columnas `date` llegan
 * como "YYYY-MM-DD"; las interpretamos como fecha local para que la ventana de
 * dias no se desplace por la zona horaria. Si el valor no es una fecha valida,
 * devuelve null y esa fila se ignora.
 */
function toDate(value: string | undefined): Date | null {
  if (!value) return null;

  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) {
    return new Date(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3]),
    );
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** "YYYY-MM-DD" local, para que los mensajes sean estables sea cual sea la locale. */
function isoDay(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

/** Tarea no completada que vence en la ventana [-7, +7] dias. */
function deriveTaskAlerts(tasks: Task[], today: Date): DerivedAlert[] {
  const from = addDays(today, -TASK_WINDOW_DAYS);
  const to = addDays(today, TASK_WINDOW_DAYS);

  return tasks.flatMap((task) => {
    if (task.status === "completed") return [];

    const due = toDate(task.due_date);
    if (!due) return [];

    const dueDay = startOfDay(due);
    if (dueDay < from || dueDay > to) return [];

    return [
      {
        id: `task-due:${task.id}`,
        type: "reminder" as const,
        title: `Tarea por vencer: ${task.title}`,
        message: `Vence el ${isoDay(due)}.`,
        alert_date: due.toISOString(),
      },
    ];
  });
}

/** Reserva no cancelada que empieza entre hoy y los proximos 7 dias. */
function deriveBookingAlerts(bookings: Booking[], today: Date): DerivedAlert[] {
  const to = addDays(today, BOOKING_WINDOW_DAYS);

  return bookings.flatMap((booking) => {
    if (booking.status === "cancelled") return [];

    const start = toDate(booking.start_date);
    if (!start) return [];

    const startDay = startOfDay(start);
    if (startDay < today || startDay > to) return [];

    return [
      {
        id: `booking-soon:${booking.id}`,
        type: "info" as const,
        title: `Reserva proxima: ${booking.title}`,
        message: `Empieza el ${isoDay(start)}.`,
        alert_date: start.toISOString(),
      },
    ];
  });
}

/**
 * Misma correspondencia gasto<->presupuesto que la pagina de presupuestos:
 * la fecha del gasto cae en [start_date, end_date] (end_date al final del dia),
 * la categoria casa (un presupuesto "travel" vale para cualquier categoria) y el
 * gasto pertenece al mismo viaje (si el presupuesto no fija viaje, vale cualquiera)
 * y a la misma moneda.
 */
function expenseMatchesBudget(expense: Expense, budget: AlertBudget): boolean {
  const expenseDate = new Date(expense.date);
  if (Number.isNaN(expenseDate.getTime())) return false;

  const budgetStart = new Date(budget.start_date);
  budgetStart.setHours(0, 0, 0, 0);
  const budgetEnd = new Date(budget.end_date);
  budgetEnd.setHours(23, 59, 59, 999);

  const dateInRange = expenseDate >= budgetStart && expenseDate <= budgetEnd;
  const categoryMatch =
    budget.category === "travel" || expense.category === budget.category;
  const tripMatch = !budget.trip_id || expense.trip_id === budget.trip_id;

  return (
    dateInRange &&
    categoryMatch &&
    tripMatch &&
    expense.currency === budget.currency
  );
}

/** Presupuesto cuyo gasto real ya supera el total presupuestado. */
function deriveBudgetAlerts(
  budgets: AlertBudget[],
  expenses: Expense[],
  now: Date,
): DerivedAlert[] {
  return budgets.flatMap((budget) => {
    const spent = expenses
      .filter((expense) => expenseMatchesBudget(expense, budget))
      .reduce((sum, expense) => sum + expense.amount, 0);

    if (spent <= budget.total_amount) return [];

    return [
      {
        id: `budget-over:${budget.id}`,
        type: "warning" as const,
        title: `Presupuesto superado: ${budget.name}`,
        message: `Has gastado ${formatAmount(spent)} de ${formatAmount(
          budget.total_amount,
        )} ${budget.currency}.`,
        alert_date: now.toISOString(),
      },
    ];
  });
}

/**
 * Deriva las alertas de un usuario. Funcion pura (sin red ni React) y con ids
 * deterministas (`task-due:<id>`, `booking-soon:<id>`, `budget-over:<id>`) para
 * que la misma entrada produzca siempre las mismas alertas. Ordenada por fecha,
 * luego por prioridad del tipo y, por ultimo, por id.
 */
export function deriveAlerts(
  input: DeriveAlertsInput,
  now: Date = new Date(),
): DerivedAlert[] {
  const today = startOfDay(now);

  const alerts = [
    ...deriveTaskAlerts(input.tasks, today),
    ...deriveBookingAlerts(input.bookings, today),
    ...deriveBudgetAlerts(input.budgets, input.expenses, now),
  ];

  return alerts.sort((a, b) => {
    if (a.alert_date !== b.alert_date) {
      return a.alert_date < b.alert_date ? -1 : 1;
    }
    if (a.type !== b.type) {
      return TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type];
    }
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}
