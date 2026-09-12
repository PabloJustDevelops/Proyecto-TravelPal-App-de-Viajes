import { act } from "react";

describe("entorno de test", () => {
  it("fija NODE_ENV=test y usa el build de desarrollo de React", () => {
    expect(process.env.NODE_ENV).toBe("test");
    expect(typeof act).toBe("function");
  });
});
