import { deriveAlerts, type AlertBudget } from "../alerts";
import type { Booking, Expense, Task } from "../insforge";

// "Ahora" fijo, construido en hora local para que la ventana de dias no dependa
// de la zona horaria de la maquina que ejecuta los tests.
const NOW = new Date(2026, 4, 15, 10, 0, 0); // 2026-05-15 10:00 local

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    user_id: "user-a",
    title: "Preparar maleta",
    status: "pending",
    priority: "medium",
    due_date: "2026-05-18",
    created_at: "2026-05-01T00:00:00.000Z",
    updated_at: "2026-05-01T00:00:00.000Z",
    ...overrides,
  };
}

function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "b1",
    user_id: "user-a",
    type: "hotel",
    title: "Hotel en Paris",
    status: "confirmed",
    start_date: "2026-05-17",
    created_at: "2026-05-01T00:00:00.000Z",
    updated_at: "2026-05-01T00:00:00.000Z",
    ...overrides,
  };
}

function expense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "e1",
    user_id: "user-a",
    title: "Cena",
    amount: 120,
    currency: "EUR",
    category: "food",
    date: "2026-05-15",
    created_at: "2026-05-01T00:00:00.000Z",
    updated_at: "2026-05-01T00:00:00.000Z",
    ...overrides,
  };
}

function budget(overrides: Partial<AlertBudget> = {}): AlertBudget {
  return {
    id: "budget-1",
    name: "Comidas de mayo",
    total_amount: 100,
    currency: "EUR",
    category: "food",
    start_date: "2026-05-01",
    end_date: "2026-05-31",
    ...overrides,
  };
}

const empty = { tasks: [], bookings: [], budgets: [], expenses: [] };

describe("deriveAlerts", () => {
  it("sin datos no genera ninguna alerta", () => {
    expect(deriveAlerts(empty, NOW)).toEqual([]);
  });

  it("avisa de una tarea que vence dentro de la ventana", () => {
    const alerts = deriveAlerts({ ...empty, tasks: [task()] }, NOW);

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      id: "task-due:t1",
      type: "reminder",
    });
    expect(alerts[0].title).toContain("Preparar maleta");
  });

  it("incluye una tarea vencida hace pocos dias pero no una lejana", () => {
    const alerts = deriveAlerts(
      {
        ...empty,
        tasks: [
          task({ id: "reciente", due_date: "2026-05-10" }),
          task({ id: "antigua", due_date: "2026-04-01" }),
          task({ id: "lejana", due_date: "2026-06-30" }),
        ],
      },
      NOW,
    );

    expect(alerts.map((a) => a.id)).toEqual(["task-due:reciente"]);
  });

  it("no avisa de una tarea completada", () => {
    const alerts = deriveAlerts(
      { ...empty, tasks: [task({ status: "completed" })] },
      NOW,
    );

    expect(alerts).toEqual([]);
  });

  it("avisa de una reserva que empieza pronto", () => {
    const alerts = deriveAlerts({ ...empty, bookings: [booking()] }, NOW);

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      id: "booking-soon:b1",
      type: "info",
    });
    expect(alerts[0].title).toContain("Hotel en Paris");
  });

  it("no avisa de una reserva cancelada", () => {
    const alerts = deriveAlerts(
      { ...empty, bookings: [booking({ status: "cancelled" })] },
      NOW,
    );

    expect(alerts).toEqual([]);
  });

  it("no avisa de una reserva que empieza mas alla de la ventana", () => {
    const alerts = deriveAlerts(
      { ...empty, bookings: [booking({ start_date: "2026-07-01" })] },
      NOW,
    );

    expect(alerts).toEqual([]);
  });

  it("avisa cuando el gasto cruzado supera el presupuesto", () => {
    const alerts = deriveAlerts(
      { ...empty, budgets: [budget()], expenses: [expense({ amount: 120 })] },
      NOW,
    );

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      id: "budget-over:budget-1",
      type: "warning",
    });
    expect(alerts[0].title).toContain("Comidas de mayo");
  });

  it("no avisa si el gasto sigue dentro del limite", () => {
    const alerts = deriveAlerts(
      {
        ...empty,
        budgets: [budget({ total_amount: 200 })],
        expenses: [expense({ amount: 120 })],
      },
      NOW,
    );

    expect(alerts).toEqual([]);
  });

  it("no cuenta un gasto de otra moneda o categoria", () => {
    const alerts = deriveAlerts(
      {
        ...empty,
        budgets: [budget()],
        expenses: [
          expense({ id: "otra-moneda", currency: "USD" }),
          expense({ id: "otra-categoria", category: "transport" }),
        ],
      },
      NOW,
    );

    expect(alerts).toEqual([]);
  });

  it("produce siempre los mismos ids para la misma entrada", () => {
    const input = {
      tasks: [task()],
      bookings: [booking()],
      budgets: [budget()],
      expenses: [expense({ amount: 120 })],
    };

    const first = deriveAlerts(input, NOW);
    const second = deriveAlerts(input, NOW);

    expect(first).toEqual(second);
    expect(first.map((a) => a.id)).toEqual([
      "budget-over:budget-1",
      "booking-soon:b1",
      "task-due:t1",
    ]);
  });
});
