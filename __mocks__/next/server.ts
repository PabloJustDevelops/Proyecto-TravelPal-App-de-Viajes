// The jsdom Response (whatwg-fetch) has no static json() nor body streams, which
// NextResponse.json relies on. Stub it so modules that build JSON responses run
// under test.
export class NextResponse extends Response {
  cookies = {
    getAll: () => [] as { name: string; value: string }[],
    set: () => undefined,
  };

  static json(body: unknown, init?: ResponseInit) {
    return new Response(JSON.stringify(body), {
      ...init,
      headers: {
        "content-type": "application/json",
        ...((init?.headers as Record<string, string>) ?? {}),
      },
    });
  }

  static next() {
    return new NextResponse(null, {
      status: 200,
      headers: { "x-middleware-next": "1" },
    });
  }

  static redirect(url: URL | string) {
    return new NextResponse(null, {
      status: 307,
      headers: { location: url.toString() },
    });
  }
}

// Lo mínimo que el middleware consulta de la petición: la URL y las cookies.
export class NextRequest {
  readonly url: string;
  readonly nextUrl: URL;
  readonly cookies = {
    get: () => undefined,
    getAll: () => [] as { name: string; value: string }[],
  };

  constructor(input: string | URL) {
    this.nextUrl = new URL(input.toString());
    this.url = this.nextUrl.toString();
  }
}
