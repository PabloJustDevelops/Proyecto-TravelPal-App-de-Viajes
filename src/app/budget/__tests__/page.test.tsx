import { redirect } from "next/navigation";
import BudgetPage from "../page";

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

describe("BudgetPage", () => {
  it("redirige /budget a /expenses: el presupuesto ya no es una ruta propia", () => {
    BudgetPage();

    expect(redirect).toHaveBeenCalledWith("/expenses");
  });
});
