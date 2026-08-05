import { describe, expect, it } from "vitest";
import { settle } from "./fieldQueue";
import { retryable } from "./offlineQueue";

// The delivery policy of both offline queues, pinned as a truth table.
//
// The stakes: `settle() === true` DELETES a queued field capture;
// `retryable() === false` on a non-ok response DROPS a queued portal
// mutation. Every wrong row in these tables is silent data loss on a phone
// in a stairwell. Each row documents the incident class that put it here:
//  - redirected 200: the passcode middleware used to bounce APIs to /gate,
//    fetch followed it, and the queues read the gate's HTML as "delivered";
//  - 401/403: expired cookie or the other cleaner signed in on a shared
//    phone — the item lands verbatim after the right login;
//  - 408/429: Vercel's rate limiting answers 429 platform-wide during an
//    attack-challenge window; poison semantics would drain the whole queue.

function res(status: number, redirected = false): Response {
  return { status, ok: status >= 200 && status < 300, redirected } as Response;
}

describe("field queue settle() — true removes the item", () => {
  it("removes only on a clean 2xx from our own API", () => {
    expect(settle(res(200))).toBe(true);
    expect(settle(res(201))).toBe(true);
  });

  it("holds a followed redirect even when the final response is 200", () => {
    expect(settle(res(200, true))).toBe(false);
  });

  it("holds auth failures until the next sign-in", () => {
    expect(settle(res(401))).toBe(false);
    expect(settle(res(403))).toBe(false);
  });

  it("holds timeouts and throttling — transient by definition", () => {
    expect(settle(res(408))).toBe(false);
    expect(settle(res(429))).toBe(false);
  });

  it("holds server errors", () => {
    expect(settle(res(500))).toBe(false);
    expect(settle(res(503))).toBe(false);
  });

  it("drops genuinely-poison 4xx so one bad item cannot block the queue", () => {
    expect(settle(res(400))).toBe(true);
    expect(settle(res(404))).toBe(true);
    expect(settle(res(422))).toBe(true);
  });
});

describe("portal queue retryable() — true holds the item", () => {
  it("agrees with the field queue on every class", () => {
    for (const status of [401, 403, 408, 429, 500, 503]) {
      expect(retryable(res(status)), String(status)).toBe(true);
    }
    expect(retryable(res(200, true)), "redirected 200").toBe(true);
    for (const status of [400, 404, 422]) {
      expect(retryable(res(status)), String(status)).toBe(false);
    }
  });
});
