import { parseServerEnv } from "../env";
import { parsePublicEnv } from "../public-env";

const validServerEnv = {
  NEXT_PUBLIC_INSFORGE_URL: "https://test-appkey.eu-central.insforge.app",
  NEXT_PUBLIC_INSFORGE_ANON_KEY: "test-insforge-anon-key",
  INSFORGE_API_KEY: "test-insforge-api-key",
};

describe("parseServerEnv", () => {
  it("parsea un entorno válido con sólo las variables obligatorias", () => {
    const env = parseServerEnv(validServerEnv);

    expect(env.NEXT_PUBLIC_INSFORGE_URL).toBe(
      "https://test-appkey.eu-central.insforge.app",
    );
    expect(env.INSFORGE_API_KEY).toBe("test-insforge-api-key");
    expect(env.NEXT_PUBLIC_LOG_LEVEL).toBeUndefined();
    expect(env.OPENROUTER_API_KEY).toBeUndefined();
  });

  it("falla indicando la variable que falta y cómo arreglarlo", () => {
    expect(() =>
      parseServerEnv({
        NEXT_PUBLIC_INSFORGE_ANON_KEY: "test-insforge-anon-key",
        INSFORGE_API_KEY: "test-insforge-api-key",
      }),
    ).toThrow(/NEXT_PUBLIC_INSFORGE_URL[\s\S]*\.env\.example/);
  });

  it("exige INSFORGE_API_KEY (secreto de servidor)", () => {
    expect(() =>
      parseServerEnv({
        NEXT_PUBLIC_INSFORGE_URL: "https://test-appkey.eu-central.insforge.app",
        NEXT_PUBLIC_INSFORGE_ANON_KEY: "test-insforge-anon-key",
      }),
    ).toThrow(/INSFORGE_API_KEY/);
  });

  it("rechaza una URL de InsForge inválida", () => {
    expect(() =>
      parseServerEnv({
        ...validServerEnv,
        NEXT_PUBLIC_INSFORGE_URL: "no-es-una-url",
      }),
    ).toThrow(/NEXT_PUBLIC_INSFORGE_URL/);
  });

  it("trata las variables opcionales vacías como ausentes", () => {
    const env = parseServerEnv({
      ...validServerEnv,
      OPENROUTER_API_KEY: "",
      AMADEUS_API_HOST: "   ",
    });

    expect(env.OPENROUTER_API_KEY).toBeUndefined();
    expect(env.AMADEUS_API_HOST).toBeUndefined();
  });

  it("acepta un AMADEUS_API_HOST válido", () => {
    const env = parseServerEnv({
      ...validServerEnv,
      AMADEUS_API_HOST: "https://test.api.amadeus.com",
    });

    expect(env.AMADEUS_API_HOST).toBe("https://test.api.amadeus.com");
  });
});

describe("parsePublicEnv", () => {
  it("parsea las variables públicas requeridas", () => {
    const env = parsePublicEnv({
      NEXT_PUBLIC_INSFORGE_URL: "https://test-appkey.eu-central.insforge.app",
      NEXT_PUBLIC_INSFORGE_ANON_KEY: "test-insforge-anon-key",
      NEXT_PUBLIC_LOG_LEVEL: "debug",
    });

    expect(env.NEXT_PUBLIC_INSFORGE_ANON_KEY).toBe("test-insforge-anon-key");
    expect(env.NEXT_PUBLIC_LOG_LEVEL).toBe("debug");
  });

  it("falla si falta la anon key", () => {
    expect(() =>
      parsePublicEnv({
        NEXT_PUBLIC_INSFORGE_URL: "https://test-appkey.eu-central.insforge.app",
      }),
    ).toThrow(/NEXT_PUBLIC_INSFORGE_ANON_KEY/);
  });

  it("ignora un nivel de log desconocido sin romper el arranque", () => {
    const env = parsePublicEnv({
      NEXT_PUBLIC_INSFORGE_URL: "https://test-appkey.eu-central.insforge.app",
      NEXT_PUBLIC_INSFORGE_ANON_KEY: "test-insforge-anon-key",
      NEXT_PUBLIC_LOG_LEVEL: "verbose",
    });

    expect(env.NEXT_PUBLIC_LOG_LEVEL).toBeUndefined();
  });
});
