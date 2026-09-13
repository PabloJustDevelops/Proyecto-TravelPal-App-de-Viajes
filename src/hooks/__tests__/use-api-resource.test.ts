import { act, renderHook, waitFor } from "@testing-library/react";
import { logger } from "@/lib/logger";
import { useApiResource } from "../use-api-resource";

jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

const loggerError = logger.error as jest.Mock;
const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe("useApiResource", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("carga y expone los datos", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ value: 1 }));

    const { result } = renderHook(() =>
      useApiResource<{ value: number }>("/api/x"),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fetchMock).toHaveBeenCalledWith("/api/x", expect.anything());
    expect(result.current.data).toEqual({ value: 1 });
    expect(result.current.error).toBeNull();
  });

  it("no dispara la carga cuando la url es null", () => {
    const { result } = renderHook(() => useApiResource(null));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("expone un error de petición con el status cuando la respuesta no es ok", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "boom" }, 500));

    const { result } = renderHook(() => useApiResource("/api/x"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toEqual({ kind: "request", status: 500 });
    expect(result.current.data).toBeNull();
  });

  it("expone un error de timeout cuando la petición no responde", () => {
    jest.useFakeTimers();
    fetchMock.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() =>
      useApiResource("/api/x", { timeoutMs: 10 }),
    );

    act(() => {
      jest.advanceTimersByTime(10);
    });

    expect(result.current.error).toEqual({ kind: "timeout" });
    expect(result.current.loading).toBe(false);
  });

  it("recarga cuando se llama a refetch", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ value: 1 }))
      .mockResolvedValueOnce(jsonResponse({ value: 2 }));

    const { result } = renderHook(() =>
      useApiResource<{ value: number }>("/api/x"),
    );

    await waitFor(() => expect(result.current.data).toEqual({ value: 1 }));

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.data).toEqual({ value: 2 }));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("mantiene los datos previos mientras carga la nueva url", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ value: 1 }));

    const { result, rerender } = renderHook(
      ({ url }) => useApiResource<{ value: number }>(url),
      { initialProps: { url: "/api/a" } },
    );

    await waitFor(() => expect(result.current.data).toEqual({ value: 1 }));

    fetchMock.mockReturnValueOnce(new Promise(() => {}));
    rerender({ url: "/api/b" });

    await waitFor(() => expect(result.current.loading).toBe(true));
    expect(result.current.data).toEqual({ value: 1 });
  });

  it("aborta la petición en curso y descarta su respuesta al cambiar de url", async () => {
    const signals: AbortSignal[] = [];
    let resolveFirst: (response: Response) => void = () => {};

    fetchMock
      .mockImplementationOnce((_url: string, init: RequestInit) => {
        signals.push(init.signal as AbortSignal);
        return new Promise<Response>((resolve) => {
          resolveFirst = resolve;
        });
      })
      .mockImplementationOnce((_url: string, init: RequestInit) => {
        signals.push(init.signal as AbortSignal);
        return Promise.resolve(jsonResponse({ value: 2 }));
      });

    const { result, rerender } = renderHook(
      ({ url }) => useApiResource<{ value: number }>(url),
      { initialProps: { url: "/api/a" } },
    );

    rerender({ url: "/api/b" });

    await waitFor(() => expect(result.current.data).toEqual({ value: 2 }));
    expect(signals[0].aborted).toBe(true);

    await act(async () => {
      resolveFirst(jsonResponse({ value: 1 }));
    });

    expect(result.current.data).toEqual({ value: 2 });
  });

  it("registra el fallo una sola vez", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "boom" }, 500));

    const { result } = renderHook(() => useApiResource("/api/x"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(loggerError).toHaveBeenCalledTimes(1);
  });
});
