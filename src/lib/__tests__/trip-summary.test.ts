import { summarizeTrip } from "../trip-summary";
import type { Booking, Expense } from "../insforge";

function expense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "e1",
    user_id: "user-a",
    title: "Gasto",
    amount: 0,
    currency: "EUR",
    category: "other",
    date: "2026-09-01",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "b1",
    user_id: "user-a",
    type: "hotel",
    title: "Reserva",
    status: "confirmed",
    start_date: "2026-09-01",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("summarizeTrip", () => {
  it("sin datos deja los contadores a cero y sin totales", () => {
    expect(summarizeTrip([], [])).toEqual({
      expenseCount: 0,
      expensesByCurrency: [],
      bookingCount: 0,
      bookingsByCurrency: [],
    });
  });

  it("suma los gastos de una sola moneda", () => {
    const summary = summarizeTrip(
      [expense({ amount: 120.5 }), expense({ id: "e2", amount: 30 })],
      [],
    );

    expect(summary.expenseCount).toBe(2);
    expect(summary.expensesByCurrency).toEqual([
      { currency: "EUR", total: 150.5 },
    ]);
  });

  it("agrupa por moneda y ordena de mayor a menor, sin convertir", () => {
    const summary = summarizeTrip(
      [
        expense({ amount: 100, currency: "USD" }),
        expense({ id: "e2", amount: 40, currency: "EUR" }),
        expense({ id: "e3", amount: 10, currency: "USD" }),
      ],
      [],
    );

    expect(summary.expensesByCurrency).toEqual([
      { currency: "USD", total: 110 },
      { currency: "EUR", total: 40 },
    ]);
  });

  it("cuenta las reservas y agrupa su coste entre las que tienen importe", () => {
    const summary = summarizeTrip(
      [],
      [
        booking({ cost: 200, currency: "EUR" }),
        booking({ id: "b2", cost: 50, currency: "USD" }),
        booking({ id: "b3" }),
      ],
    );

    expect(summary.bookingCount).toBe(3);
    expect(summary.bookingsByCurrency).toEqual([
      { currency: "EUR", total: 200 },
      { currency: "USD", total: 50 },
    ]);
  });

  it("el resumen sale de los datos guardados, no de un calculo nuevo", () => {
    const expenses = [expense({ amount: 99.99 }), expense({ id: "e2", amount: 0.01 })];

    expect(summarizeTrip(expenses, []).expensesByCurrency).toEqual([
      { currency: "EUR", total: 100 },
    ]);
  });
});
