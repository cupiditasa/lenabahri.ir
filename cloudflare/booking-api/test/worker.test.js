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
    if (this.sql.startsWith("INSERT INTO customer_otp_codes")) {
      const [phone, code_hash, expires_at, created_at] = this.values;
      db.otpCodes.set(phone, { phone, code_hash, expires_at, attempts: 0, created_at });
      return { meta: { changes: 1 } };
    }
    if (this.sql.startsWith("UPDATE customer_otp_codes SET attempts")) {
      const record = db.otpCodes.get(this.values[0]);
      if (!record) return { meta: { changes: 0 } };
      record.attempts += 1;
      return { meta: { changes: 1 } };
    }
    if (this.sql.startsWith("DELETE FROM customer_otp_codes WHERE phone")) {
      return { meta: { changes: Number(db.otpCodes.delete(this.values[0])) } };
    }
    if (this.sql.startsWith("INSERT INTO customer_profiles")) {
      const [phone, full_name, photo_data, photo_content_type, created_at, updated_at, consent_at] = this.values;
      const previous = db.profiles.get(phone);
      db.profiles.set(phone, {
        phone,
        full_name,
        photo_data: photo_data || previous?.photo_data || null,
        photo_content_type: photo_content_type || previous?.photo_content_type || null,
        created_at: previous?.created_at || created_at,
        updated_at,
        consent_at
      });
      return { meta: { changes: 1 } };
    }
    if (this.sql.startsWith("INSERT INTO news_reactions")) {
      const [article_slug, phone, reaction, created_at, updated_at] = this.values;
      const key = `${article_slug}:${phone}`;
      const previous = db.newsReactions.get(key);
      db.newsReactions.set(key, { article_slug, phone, reaction, created_at: previous?.created_at || created_at, updated_at });
      return { meta: { changes: 1 } };
    }
    if (this.sql.startsWith("DELETE FROM news_reactions WHERE article_slug")) {
      return { meta: { changes: Number(db.newsReactions.delete(`${this.values[0]}:${this.values[1]}`)) } };
    }
    if (this.sql.startsWith("INSERT INTO news_comments")) {
      const [id, article_slug, phone, body, consent_at, created_at] = this.values;
      db.newsComments.set(id, { id, article_slug, phone, body, consent_at, created_at });
      return { meta: { changes: 1 } };
    }
    if (this.sql.startsWith("DELETE FROM news_reactions WHERE updated_at")) {
      let changes = 0;
      for (const [key, reaction] of db.newsReactions) {
        if (reaction.updated_at < this.values[0]) changes += Number(db.newsReactions.delete(key));
      }
      return { meta: { changes } };
    }
    if (this.sql.startsWith("DELETE FROM news_comments WHERE created_at")) {
      let changes = 0;
      for (const [id, comment] of db.newsComments) {
        if (comment.created_at < this.values[0]) changes += Number(db.newsComments.delete(id));
      }
      return { meta: { changes } };
    }
    if (this.sql.startsWith("DELETE FROM customer_profiles WHERE created_at")) {
      let changes = 0;
      for (const [phone, profile] of db.profiles) {
        if (profile.created_at < this.values[0]) changes += Number(db.profiles.delete(phone));
      }
      return { meta: { changes } };
    }
    if (this.sql.startsWith("DELETE FROM customer_otp_codes WHERE expires_at")) {
      let changes = 0;
      for (const [phone, record] of db.otpCodes) {
        if (record.expires_at < this.values[0]) changes += Number(db.otpCodes.delete(phone));
      }
      return { meta: { changes } };
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
    if (this.sql.startsWith("SELECT reaction, COUNT(*) AS count FROM news_reactions")) {
      const counts = new Map();
      for (const reaction of this.database.newsReactions.values()) {
        if (reaction.article_slug === this.values[0]) counts.set(reaction.reaction, (counts.get(reaction.reaction) || 0) + 1);
      }
      return { results: [...counts].map(([reaction, count]) => ({ reaction, count })) };
    }
    if (this.sql.startsWith("SELECT id, body, created_at FROM news_comments")) {
      return { results: [...this.database.newsComments.values()]
        .filter((comment) => comment.article_slug === this.values[0])
        .sort((left, right) => right.created_at - left.created_at)
        .slice(0, 50)
        .map(({ id, body, created_at }) => ({ id, body, created_at })) };
    }
    if (this.sql.startsWith("SELECT status, COUNT(*)")) {
      const counts = new Map();
      for (const booking of this.database.bookings.values()) counts.set(booking.status, (counts.get(booking.status) || 0) + 1);
      return { results: [...counts].map(([status, count]) => ({ status, count })) };
    }
    if (this.sql.startsWith("SELECT id, service, payment_method, status, created_at FROM bookings WHERE SUBSTR")) {
      const phoneKey = this.values[0];
      return { results: [...this.database.bookings.values()]
        .filter((booking) => booking.phone.replace(/\D/g, "").slice(-10) === phoneKey)
        .sort((left, right) => right.created_at - left.created_at)
        .slice(0, 100)
        .map(({ id, service, payment_method, status, created_at }) => ({ id, service, payment_method, status, created_at })) };
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
    if (this.sql.startsWith("SELECT reaction FROM news_reactions")) {
      const reaction = this.database.newsReactions.get(`${this.values[0]}:${this.values[1]}`);
      return reaction ? { reaction: reaction.reaction } : null;
    }
    if (this.sql.startsWith("SELECT code_hash, expires_at, attempts FROM customer_otp_codes")) {
      return this.database.otpCodes.get(this.values[0]) || null;
    }
    if (this.sql.startsWith("SELECT full_name, photo_data IS NOT NULL AS has_photo FROM customer_profiles")) {
      const profile = this.database.profiles.get(this.values[0]);
      return profile ? { full_name: profile.full_name, has_photo: Boolean(profile.photo_data) } : null;
    }
    if (this.sql.startsWith("SELECT photo_data IS NOT NULL AS has_photo FROM customer_profiles")) {
      const profile = this.database.profiles.get(this.values[0]);
      return profile ? { has_photo: Boolean(profile.photo_data) } : null;
    }
    if (this.sql.startsWith("SELECT photo_data, photo_content_type FROM customer_profiles")) {
      const profile = this.database.profiles.get(this.values[0]);
      return profile ? { photo_data: profile.photo_data, photo_content_type: profile.photo_content_type } : null;
    }
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
  constructor() { this.bookings = new Map(); this.limits = new Map(); this.otpCodes = new Map(); this.profiles = new Map(); this.newsReactions = new Map(); this.newsComments = new Map(); }
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

async function customerCookie(phone, secret) {
  const expires = Math.floor(Date.now() / 1000) + 3600;
  const nonce = crypto.randomUUID();
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${expires}.${phone}.${nonce}`)));
  const binary = Array.from(signature, (byte) => String.fromCharCode(byte)).join("");
  const encodedSignature = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const phoneToken = btoa(phone).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `lena_customer_session=${expires}.${phoneToken}.${nonce}.${encodedSignature}`;
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
  const expiredAt = Math.floor(Date.now() / 1000) - 91 * day;
  env.DB.bookings.set(id, { id, photo_data: new ArrayBuffer(12), created_at: expiredAt });
  env.DB.profiles.set("09120000000", { phone: "09120000000", created_at: expiredAt });
  env.DB.newsReactions.set("old-story:09120000000", { article_slug: "old-story", phone: "09120000000", reaction: "resonated", updated_at: expiredAt });
  env.DB.newsComments.set("old-comment", { id: "old-comment", created_at: expiredAt });
  env.DB.otpCodes.set("09121111111", { phone: "09121111111", expires_at: Math.floor(Date.now() / 1000) - 1 });
  const tasks = [];
  await worker.scheduled({}, env, { waitUntil: (task) => tasks.push(task) });
  await Promise.all(tasks);
  assert.equal(env.DB.bookings.has(id), false);
  assert.equal(env.DB.profiles.has("09120000000"), false);
  assert.equal(env.DB.newsReactions.has("old-story:09120000000"), false);
  assert.equal(env.DB.newsComments.has("old-comment"), false);
  assert.equal(env.DB.otpCodes.has("09121111111"), false);
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

test("customer OTP login only returns that phone's orders and keeps profiles private", async () => {
  const env = {
    DB: new MockDatabase(),
    RATE_LIMIT_SALT: "test",
    ADMIN_PASSWORD_HASH: "test-hash",
    SESSION_SECRET: "test-session-signing-key-not-for-production",
    SMSIR_API_KEY: "test-only-key-not-for-production-000000000000000000000000000000000000",
    SMSIR_OTP_TEMPLATE_ID: "123456",
    SMSIR_OTP_PARAMETER_NAME: "CODE"
  };
  const bookingPayload = bookingForm({ photo: false });
  bookingPayload.set("payment_method", "consult");
  const bookingResponse = await worker.fetch(makeRequest("/api/bookings", {
    method: "POST",
    body: bookingPayload,
    headers: { Origin: "https://lenabahri.ir", "CF-Connecting-IP": "192.0.2.20" }
  }), env);
  assert.equal(bookingResponse.status, 201);
  const storedBooking = [...env.DB.bookings.values()][0];
  storedBooking.status = "confirmed";

  const originalFetch = globalThis.fetch;
  let issuedCode = "";
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "https://api.sms.ir/v1/send/verify");
      assert.equal(options.headers["X-API-KEY"], env.SMSIR_API_KEY);
      const payload = JSON.parse(options.body);
      assert.match(payload.Mobile, /^09\d{9}$/);
      assert.equal(payload.TemplateId, 123456);
      assert.equal(payload.Parameters[0].Name, "CODE");
      issuedCode = payload.Parameters[0].Value;
      return Response.json({ Status: 1, Data: { MessageId: 1 } });
    };

    const requested = await worker.fetch(makeRequest("/api/customer/otp/request", {
      method: "POST",
      body: JSON.stringify({ phone: "۰۹۱۷۸۲۸۰۸۱۲" }),
      headers: { Origin: "https://lenabahri.ir", "Content-Type": "application/json", "CF-Connecting-IP": "192.0.2.20" }
    }), env);
    assert.equal(requested.status, 200);
    assert.equal((await requested.json()).ok, true);
    assert.match(issuedCode, /^\d{6}$/);

    const verified = await worker.fetch(makeRequest("/api/customer/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phone: "09178280812", code: issuedCode }),
      headers: { Origin: "https://lenabahri.ir", "Content-Type": "application/json", "CF-Connecting-IP": "192.0.2.20" }
    }), env);
    assert.equal(verified.status, 200);
    const setCookie = verified.headers.get("set-cookie");
    assert.match(setCookie, /HttpOnly/);
    const cookie = setCookie.split(";")[0];

    const account = await worker.fetch(makeRequest("/api/customer/me", { headers: { Cookie: cookie } }), env);
    assert.equal(account.status, 200);
    const accountData = await account.json();
    assert.equal(accountData.orders.length, 1);
    assert.equal(accountData.orders[0].status, "confirmed");
    assert.equal("message" in accountData.orders[0], false);
    assert.equal(JSON.stringify(accountData).includes("09178280812"), false);

    const profileForm = new FormData();
    profileForm.set("full_name", "سارا احمدی");
    profileForm.set("consent", "on");
    profileForm.set("photo", new File([Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])], "profile.png", { type: "image/png" }));
    const savedProfile = await worker.fetch(makeRequest("/api/customer/profile", {
      method: "POST",
      body: profileForm,
      headers: { Cookie: cookie, Origin: "https://lenabahri.ir" }
    }), env);
    assert.equal(savedProfile.status, 200);
    assert.equal((await savedProfile.json()).hasPhoto, true);
    assert.equal(env.DB.profiles.get("09178280812").full_name, "سارا احمدی");

    const photo = await worker.fetch(makeRequest("/api/customer/photo", { headers: { Cookie: cookie } }), env);
    assert.equal(photo.status, 200);
    assert.equal(photo.headers.get("cache-control"), "private, no-store");
    assert.deepEqual(Array.from(new Uint8Array(await photo.arrayBuffer())), [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);

    const otherRequest = await worker.fetch(makeRequest("/api/customer/otp/request", {
      method: "POST",
      body: JSON.stringify({ phone: "09170000000" }),
      headers: { Origin: "https://lenabahri.ir", "Content-Type": "application/json", "CF-Connecting-IP": "192.0.2.21" }
    }), env);
    assert.equal(otherRequest.status, 200);
    const otherCode = issuedCode;
    const otherVerified = await worker.fetch(makeRequest("/api/customer/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phone: "09170000000", code: otherCode }),
      headers: { Origin: "https://lenabahri.ir", "Content-Type": "application/json", "CF-Connecting-IP": "192.0.2.21" }
    }), env);
    const otherCookie = otherVerified.headers.get("set-cookie").split(";")[0];
    const otherAccount = await worker.fetch(makeRequest("/api/customer/me", { headers: { Cookie: otherCookie } }), env);
    assert.deepEqual((await otherAccount.json()).orders, []);
    const otherPhoto = await worker.fetch(makeRequest("/api/customer/photo", { headers: { Cookie: otherCookie } }), env);
    assert.equal(otherPhoto.status, 404);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("customer OTP rejects cross-origin requests and unconfigured SMS delivery", async () => {
  const env = { DB: new MockDatabase(), SESSION_SECRET: "test-session", RATE_LIMIT_SALT: "test" };
  const foreign = await worker.fetch(makeRequest("/api/customer/otp/request", {
    method: "POST",
    body: JSON.stringify({ phone: "09178280812" }),
    headers: { Origin: "https://attacker.invalid", "Content-Type": "application/json" }
  }), env);
  assert.equal(foreign.status, 403);
  const unavailable = await worker.fetch(makeRequest("/api/customer/otp/request", {
    method: "POST",
    body: JSON.stringify({ phone: "09178280812" }),
    headers: { Origin: "https://lenabahri.ir", "Content-Type": "application/json" }
  }), env);
  assert.equal(unavailable.status, 503);
  assert.equal(env.DB.otpCodes.size, 0);
});

test("news reactions and public comments require a customer session and never expose account details", async () => {
  const env = { DB: new MockDatabase(), SESSION_SECRET: "test-session-signing-key-not-for-production", RATE_LIMIT_SALT: "test-rate-limit-salt" };
  const slug = "ss27-runway-beauty-2026";
  const reactionPath = `/api/customer/news/${slug}/reaction`;
  const commentPath = `/api/customer/news/${slug}/comments`;
  const communityPath = `/api/news/${slug}/community`;
  const noLogin = await worker.fetch(makeRequest(commentPath, {
    method: "POST", body: JSON.stringify({ body: "متن دیدگاه", consent: true }),
    headers: { Origin: "https://lenabahri.ir", "Content-Type": "application/json" }
  }), env);
  assert.equal(noLogin.status, 401);

  const cookie = await customerCookie("09123456789", env.SESSION_SECRET);
  const foreignWrite = await worker.fetch(makeRequest(reactionPath, {
    method: "PUT", body: JSON.stringify({ reaction: "resonated" }),
    headers: { Cookie: cookie, Origin: "https://attacker.invalid", "Content-Type": "application/json" }
  }), env);
  assert.equal(foreignWrite.status, 403);

  const saveReaction = await worker.fetch(makeRequest(reactionPath, {
    method: "PUT", body: JSON.stringify({ reaction: "resonated" }),
    headers: { Cookie: cookie, Origin: "https://lenabahri.ir", "Content-Type": "application/json", "CF-Connecting-IP": "192.0.2.31" }
  }), env);
  assert.equal(saveReaction.status, 200);
  const savedReaction = await worker.fetch(makeRequest(reactionPath, { headers: { Cookie: cookie } }), env);
  assert.equal((await savedReaction.json()).reaction, "resonated");
  const publicCounts = await worker.fetch(makeRequest(communityPath), env);
  assert.deepEqual((await publicCounts.json()).counts, { resonated: 1, "not-for-me": 0 });

  const missingConsent = await worker.fetch(makeRequest(commentPath, {
    method: "POST", body: JSON.stringify({ body: "دیدگاه معتبر", consent: false }),
    headers: { Cookie: cookie, Origin: "https://lenabahri.ir", "Content-Type": "application/json", "CF-Connecting-IP": "192.0.2.31" }
  }), env);
  assert.equal(missingConsent.status, 400);
  const savedComment = await worker.fetch(makeRequest(commentPath, {
    method: "POST", body: JSON.stringify({ body: "دیدگاه با <script> متن ساده است", consent: true }),
    headers: { Cookie: cookie, Origin: "https://lenabahri.ir", "Content-Type": "application/json", "CF-Connecting-IP": "192.0.2.31" }
  }), env);
  assert.equal(savedComment.status, 201);
  const community = await worker.fetch(makeRequest(communityPath), env);
  const communityData = await community.json();
  assert.equal(communityData.comments.length, 1);
  assert.match(communityData.comments[0].body, /<script>/);
  assert.equal(JSON.stringify(communityData).includes("09123456789"), false);
});
