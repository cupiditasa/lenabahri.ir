import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto, pbkdf2 } from "node:crypto";
import { promisify } from "node:util";
import { File } from "node:buffer";
import worker from "../src/worker.js";

globalThis.crypto ||= webcrypto;
globalThis.File ||= File;

const derive = promisify(pbkdf2);
const day = 24 * 60 * 60;

class MockStatement {
  constructor(database, sql) { this.database = database; this.sql = sql; this.values = []; }
  bind(...values) { this.values = values; return this; }
  async run() {
    const db = this.database;
    if (this.sql.includes("INSERT INTO rate_limits")) {
      const [scope, ipHash, windowStart, limit] = this.values;
      const key = `${scope}:${ipHash}:${windowStart}`;
      const current = db.limits.get(key) || 0;
      if (current >= limit) return { meta: { changes: 0 } };
      db.limits.set(key, current + 1);
      return { meta: { changes: 1 } };
    }
    if (this.sql.includes("INSERT INTO bookings")) {
      const [id, name, phone, service, payment_method, message, photo_data, photo_content_type, created_at] = this.values;
      db.bookings.set(id, { id, name, phone, service, payment_method, message, photo_data, photo_content_type, status: "pending", created_at });
      return { meta: { changes: 1 } };
    }
    if (this.sql.startsWith("UPDATE bookings")) {
      const [status, id] = this.values;
      const booking = db.bookings.get(id);
      if (!booking) return { meta: { changes: 0 } };
      booking.status = status;
      return { meta: { changes: 1 } };
    }
    if (this.sql.startsWith("DELETE FROM bookings WHERE id")) {
      return { meta: { changes: Number(db.bookings.delete(this.values[0])) } };
    }
    if (this.sql.startsWith("DELETE FROM bookings WHERE created_at <")) {
      let changes = 0;
      for (const [id, booking] of db.bookings) {
        if (booking.created_at < this.values[0]) changes += Number(db.bookings.delete(id));
      }
      return { meta: { changes } };
    }
    if (this.sql.startsWith("DELETE FROM rate_limits")) {
      db.limits.clear();
      return { meta: { changes: 1 } };
    }
    return { meta: { changes: 0 } };
  }
  async all() {
    if (this.sql.startsWith("SELECT status, COUNT(*)")) {
      const counts = new Map();
      for (const booking of this.database.bookings.values()) counts.set(booking.status, (counts.get(booking.status) || 0) + 1);
      return { results: [...counts].map(([status, count]) => ({ status, count })) };
    }
    const filterStatus = this.sql.includes("status = ?") ? this.values[0] : "";
    const results = [...this.database.bookings.values()]
      .filter((booking) => !filterStatus || booking.status === filterStatus)
      .sort((left, right) => right.created_at - left.created_at)
      .slice(0, 200)
      .map(({ photo_data, ...booking }) => ({ ...booking, has_photo: Boolean(photo_data) }));
    return { results };
  }
  async first() {
    if (this.sql.startsWith("SELECT photo_data, photo_content_type FROM bookings")) {
      const booking = this.database.bookings.get(this.values[0]);
      return booking ? {
        photo_data: Array.from(new Uint8Array(booking.photo_data)),
        photo_content_type: booking.photo_content_type
      } : null;
    }
    return null;
  }
}

class MockDatabase {
  constructor() { this.bookings = new Map(); this.limits = new Map(); }
  prepare(sql) { return new MockStatement(this, sql); }
}

function makeRequest(path, { method = "GET", body, headers = {} } = {}) {
  return new Request(`https://lenabahri.ir${path}`, { method, body, headers });
}

async function makePasswordHash(password) {
  const salt = Buffer.from("a fixed test salt").toString("base64url");
  const hash = await derive(password, Buffer.from(salt, "base64url"), 210000, 32, "sha256");
  return `pbkdf2-sha256$210000$${salt}$${Buffer.from(hash).toString("base64url")}`;
}

function bookingForm({ consent = "on", photo = true } = {}) {
  const form = new FormData();
  form.set("name", "سارا احمدی");
  form.set("phone", "۰۹۱۷۸۲۸۰۸۱۲");
  form.set("service", "microblading");
  form.set("payment_method", "cash");
  form.set("message", "درخواست تست");
  if (consent) form.set("consent", consent);
  if (photo) form.set("photo", new File([Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])], "test.png", { type: "image/png" }));
  return form;
}

test("health endpoint responds without exposing configuration", async () => {
  const response = await worker.fetch(makeRequest("/api/health"), {});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("booking rejects cross-origin and missing consent requests", async () => {
  const env = { DB: new MockDatabase(), RATE_LIMIT_SALT: "test", ADMIN_PASSWORD_HASH: "test-hash", SESSION_SECRET: "test-session" };
  const foreign = await worker.fetch(makeRequest("/api/bookings", { method: "POST", body: bookingForm(), headers: { Origin: "https://attacker.invalid" } }), env);
  assert.equal(foreign.status, 403);
  const noConsent = await worker.fetch(makeRequest("/api/bookings", { method: "POST", body: bookingForm({ consent: "" }), headers: { Origin: "https://lenabahri.ir" } }), env);
  assert.equal(noConsent.status, 400);
  assert.equal(env.DB.bookings.size, 0);
});

test("booking intake stays closed until production secrets are configured", async () => {
  const env = { DB: new MockDatabase() };
  const response = await worker.fetch(makeRequest("/api/bookings", { method: "POST", body: bookingForm(), headers: { Origin: "https://lenabahri.ir" } }), env);
  assert.equal(response.status, 503);
  assert.equal(env.DB.bookings.size, 0);
});

test("booking persists a photo privately and protects admin operations", async () => {
  const env = {
    DB: new MockDatabase(),
    RATE_LIMIT_SALT: "test",
    ADMIN_PASSWORD_HASH: await makePasswordHash("test-only-passphrase"),
    SESSION_SECRET: "test-session-signing-key-not-for-production"
  };
  const submitted = await worker.fetch(makeRequest("/api/bookings", { method: "POST", body: bookingForm(), headers: { Origin: "https://lenabahri.ir", "CF-Connecting-IP": "192.0.2.10" } }), env);
  assert.equal(submitted.status, 201);
  const submission = await submitted.json();
  assert.equal(submission.ok, true);
  assert.equal(env.DB.bookings.size, 1);
  assert.equal([...env.DB.bookings.values()][0].phone, "09178280812");
  const storedBooking = [...env.DB.bookings.values()][0];
  assert.equal(storedBooking.photo_content_type, "image/png");
  assert.deepEqual(Array.from(new Uint8Array(storedBooking.photo_data)), [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

  const unauthorized = await worker.fetch(makeRequest("/api/admin/bookings"), env);
  assert.equal(unauthorized.status, 401);

  const login = await worker.fetch(makeRequest("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ username: "lena", password: "test-only-passphrase" }),
    headers: { Origin: "https://lenabahri.ir", "Content-Type": "application/json", "CF-Connecting-IP": "192.0.2.11" }
  }), env);
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie").split(";")[0];

  const list = await worker.fetch(makeRequest("/api/admin/bookings", { headers: { Cookie: cookie } }), env);
  assert.equal(list.status, 200);
  const listed = await list.json();
  assert.equal(listed.bookings[0].has_photo, true);
  assert.equal("photo_data" in listed.bookings[0], false);

  const [bookingId] = env.DB.bookings.keys();
  const photo = await worker.fetch(makeRequest(`/api/admin/bookings/${bookingId}/photo`, { headers: { Cookie: cookie } }), env);
  assert.equal(photo.status, 200);
  assert.equal(photo.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(Array.from(new Uint8Array(await photo.arrayBuffer())), [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

  const update = await worker.fetch(makeRequest(`/api/admin/bookings/${bookingId}`, { method: "PATCH", body: JSON.stringify({ status: "confirmed" }), headers: { Cookie: cookie, Origin: "https://lenabahri.ir", "Content-Type": "application/json" } }), env);
  assert.equal(update.status, 200);
  assert.equal(env.DB.bookings.get(bookingId).status, "confirmed");

  const logout = await worker.fetch(makeRequest("/api/admin/logout", { method: "POST", headers: { Cookie: cookie, Origin: "https://lenabahri.ir" } }), env);
  assert.match(logout.headers.get("set-cookie"), /Max-Age=0/);
});

test("retention cleanup removes expired database rows and their stored photos", async () => {
  const env = { DB: new MockDatabase() };
  const id = "expired-booking";
  env.DB.bookings.set(id, { id, photo_data: new ArrayBuffer(12), created_at: Math.floor(Date.now() / 1000) - 91 * day });
  const tasks = [];
  await worker.scheduled({}, env, { waitUntil: (task) => tasks.push(task) });
  await Promise.all(tasks);
  assert.equal(env.DB.bookings.has(id), false);
});

test("booking rejects photos larger than the D1-safe upload cap", async () => {
  const env = { DB: new MockDatabase(), RATE_LIMIT_SALT: "test", ADMIN_PASSWORD_HASH: "test-hash", SESSION_SECRET: "test-session" };
  const form = bookingForm();
  form.set("photo", new File([new Uint8Array(1_500_001)], "large.png", { type: "image/png" }));
  const response = await worker.fetch(makeRequest("/api/bookings", {
    method: "POST",
    body: form,
    headers: { Origin: "https://lenabahri.ir" }
  }), env);
  assert.equal(response.status, 413);
  assert.equal(env.DB.bookings.size, 0);
});
