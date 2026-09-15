import type { Booking, Expense } from "@/lib/insforge";

/**
 * Resumen de un viaje a partir de lo que ya existe: los gastos y las reservas del
 * viaje. No hay un segundo modelo de dinero: los importes se agrupan por su moneda
 * tal cual estan guardados, sin conversion ni formula paralela, para que el resumen
 * ensene las mismas cifras que ya ensena la app.
 */
export interface CurrencyTotal {
  currency: string;
  total: number;
}

export interface TripSummary {
  expenseCount: number;
  expensesByCurrency: CurrencyTotal[];
  bookingCount: number;
  bookingsByCurrency: CurrencyTotal[];
}

function groupByCurrency<T>(
  items: T[],
  currencyOf: (item: T) => string | undefined,
  amountOf: (item: T) => number | undefined,
): CurrencyTotal[] {
  const totals = new Map<string, number>();

  for (const item of items) {
    const currency = currencyOf(item);
    const amount = amountOf(item);

    if (!currency || typeof amount !== "number") continue;

    totals.set(currency, (totals.get(currency) ?? 0) + amount);
  }

  return [...totals.entries()]
    .map(([currency, total]) => ({ currency, total }))
    .sort((a, b) => b.total - a.total);
}

export function summarizeTrip(
  expenses: Expense[],
  bookings: Booking[],
): TripSummary {
  return {
    expenseCount: expenses.length,
    expensesByCurrency: groupByCurrency(
      expenses,
      (expense) => expense.currency,
      (expense) => expense.amount,
    ),
    bookingCount: bookings.length,
    bookingsByCurrency: groupByCurrency(
      bookings,
      (booking) => booking.currency,
      (booking) => booking.cost,
    ),
  };
}
