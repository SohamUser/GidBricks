import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import { loadDashboard } from "../src/services/windApi.ts";

afterEach(() => mock.restoreAll());

const range = { from: "2026-01-01", to: "2026-01-31" };
const load = (signal = new AbortController().signal) =>
  loadDashboard("2026-01-15", range, signal);

test("requests decision, accuracy and coverage through the same origin", async () => {
  const urls = [];
  mock.method(globalThis, "fetch", async (url) => {
    urls.push(url);
    return Response.json({ source: url });
  });
  const result = await load();
  assert.deepEqual(urls, [
    "/api/decision?date=2026-01-15",
    "/api/accuracy?from=2026-01-01&to=2026-01-31",
    "/api/coverage",
  ]);
  assert.equal(result[0].source, urls[0]);
});

test("preserves the API error message", async () => {
  mock.method(globalThis, "fetch", async () =>
    Response.json({ detail: "Snapshot unavailable" }, { status: 503 }),
  );
  await assert.rejects(load(), /Snapshot unavailable/);
});

test("handles non-JSON proxy errors", async () => {
  mock.method(globalThis, "fetch", async () =>
    new Response("Bad gateway", { status: 502 }),
  );
  await assert.rejects(load(), /Request failed \(502\)/);
});

test("times out requests with a useful retry message", async () => {
  mock.method(AbortSignal, "timeout", (milliseconds) => {
    assert.equal(milliseconds, 15_000);
    return AbortSignal.abort(new DOMException("Timeout", "TimeoutError"));
  });
  mock.method(globalThis, "fetch", async (_url, options) => {
    options.signal.throwIfAborted();
  });
  await assert.rejects(load(), /data request timed out/);
});

test("preserves cancellation when the user changes filters", async () => {
  mock.method(globalThis, "fetch", async (_url, options) => {
    options.signal.throwIfAborted();
  });
  await assert.rejects(load(AbortSignal.abort()), { name: "AbortError" });
});
