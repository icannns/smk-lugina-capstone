import assert from "node:assert/strict";
import test from "node:test";
import { getJakartaGreeting } from "../src/lib/dashboard-time";

test("dashboard greeting switches exactly at the four Jakarta time boundaries", () => {
  const cases = [
    ["00:00:00", "Selamat malam"],
    ["04:59:59", "Selamat malam"],
    ["05:00:00", "Selamat pagi"],
    ["10:59:59", "Selamat pagi"],
    ["11:00:00", "Selamat siang"],
    ["14:59:59", "Selamat siang"],
    ["15:00:00", "Selamat sore"],
    ["17:59:59", "Selamat sore"],
    ["18:00:00", "Selamat malam"],
    ["23:59:59", "Selamat malam"],
  ] as const;

  for (const [time, greeting] of cases) {
    assert.equal(getJakartaGreeting(Date.parse("2026-11-21T" + time + "+07:00")), greeting, time);
  }
});

test("dashboard greeting handles UTC instants and a deterministic hydration fallback", () => {
  assert.equal(getJakartaGreeting(Date.parse("2026-11-20T22:00:00Z")), "Selamat pagi");
  assert.equal(getJakartaGreeting(null), "Halo");
});
