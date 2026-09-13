// The jsdom Response (whatwg-fetch) has no static json() nor body streams, which
// NextResponse.json relies on. Stub it so modules that build JSON responses run
// under test.
export class NextResponse extends Response {
  static json(body: unknown, init?: ResponseInit) {
    return new Response(JSON.stringify(body), {
      ...init,
      headers: {
        "content-type": "application/json",
        ...((init?.headers as Record<string, string>) ?? {}),
      },
    });
  }
}
