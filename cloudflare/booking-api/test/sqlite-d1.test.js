import test from "node:test";
import assert from "node:assert/strict";
import { File } from "node:buffer";
import worker from "../src/worker.js";
import { openBookingDatabase } from "../src/sqlite-d1.js";

globalThis.File ||= File;

test("SQLite adapter applies existing migrations and preserves private photo blobs", async () => {
  const database = openBookingDatabase(":memory:");
  try {
    const inserted = await database.prepare(
      "INSERT INTO bookings (id, name, phone, service, payment_method, message, photo_data, photo_content_type, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)"
    ).bind("booking-test", "Test", "+12025550100", "microblading", "cash", "", Buffer.from([1, 2, 3]), "image/png", 1).run();
    assert.equal(inserted.meta.changes, 1);
    const row = await database.prepare("SELECT photo_data, photo_content_type FROM bookings WHERE id = ?").bind("booking-test").first();
    assert.deepEqual([...row.photo_data], [1, 2, 3]);
    assert.equal(row.photo_content_type, "image/png");
    const migrationRows = await database.prepare("SELECT id FROM schema_migrations ORDER BY id").all();
    assert.deepEqual(migrationRows.results.map((migration) => migration.id), ["0001_bookings.sql", "0002_booking_photo_blobs.sql", "0003_customer_accounts.sql", "0004_news_community.sql"]);
    const profileTable = await database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'customer_profiles'").first();
    assert.equal(profileTable.name, "customer_profiles");
  } finally {
    database.close();
  }
});

test("cash booking stores the uploaded photo through the SQLite-backed API", async () => {
  const database = openBookingDatabase(":memory:");
  try {
    const form = new FormData();
    form.set("name", "کاربر آزمایشی");
    form.set("phone", "09123456789");
    form.set("service", "microblading");
    form.set("payment_method", "cash");
    form.set("consent", "on");
    form.set("photo", new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])], { type: "image/png" }), "test.png");

    const response = await worker.fetch(new Request("https://lenabahri.ir/api/bookings", {
      method: "POST",
      headers: { Origin: "https://lenabahri.ir", "CF-Connecting-IP": "192.0.2.123" },
      body: form
    }), {
      DB: database,
      ADMIN_PASSWORD_HASH: "test-only",
      SESSION_SECRET: "test-only",
      RATE_LIMIT_SALT: "test-only"
    });

    assert.equal(response.status, 201);
    const { reference } = await response.json();
    assert.match(reference, /^[A-F0-9]{8}$/);
    const row = await database.prepare("SELECT photo_data FROM bookings").first();
    assert.deepEqual([...row.photo_data], [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
  } finally {
    database.close();
  }
});

test("SQLite adapter reports no-op updates as zero changed rows", async () => {
  const database = openBookingDatabase(":memory:");
  try {
    const result = await database.prepare("UPDATE bookings SET status = ? WHERE id = ?").bind("confirmed", "missing").run();
    assert.equal(result.meta.changes, 0);
  } finally {
    database.close();
  }
});

test("customer account endpoints work against SQLite and isolate profile photos", async () => {
  const database = openBookingDatabase(":memory:");
  const env = {
    DB: database,
    SESSION_SECRET: "sqlite-customer-test-session-secret",
    RATE_LIMIT_SALT: "sqlite-customer-test-salt",
    SMSIR_API_KEY: "test-only-key-not-for-production-000000000000000000000000000000000000",
    SMSIR_OTP_TEMPLATE_ID: "123456",
    SMSIR_OTP_PARAMETER_NAME: "CODE"
  };
  const originalFetch = globalThis.fetch;
  let issuedCode = "";
  try {
    const createdAt = Math.floor(Date.now() / 1000);
    await database.prepare(
      "INSERT INTO bookings (id, name, phone, service, payment_method, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind("sqlite-customer-order", "Test Customer", "09123456789", "microblading", "cash", "private note", "confirmed", createdAt).run();

    globalThis.fetch = async (_url, options) => {
      issuedCode = JSON.parse(options.body).Parameters[0].Value;
      return Response.json({ Status: 1, Data: { MessageId: 1 } });
    };
    const requestOtp = await worker.fetch(new Request("https://lenabahri.ir/api/customer/otp/request", {
      method: "POST",
      headers: { Origin: "https://lenabahri.ir", "CF-Connecting-IP": "192.0.2.88", "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "09123456789" })
    }), env);
    assert.equal(requestOtp.status, 200);

    const verifyOtp = await worker.fetch(new Request("https://lenabahri.ir/api/customer/otp/verify", {
      method: "POST",
      headers: { Origin: "https://lenabahri.ir", "CF-Connecting-IP": "192.0.2.88", "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "09123456789", code: issuedCode })
    }), env);
    assert.equal(verifyOtp.status, 200);
    const cookie = verifyOtp.headers.get("set-cookie").split(";")[0];

    const account = await worker.fetch(new Request("https://lenabahri.ir/api/customer/me", { headers: { Cookie: cookie } }), env);
    assert.equal(account.status, 200);
    const data = await account.json();
    assert.equal(data.orders.length, 1);
    assert.equal(data.orders[0].status, "confirmed");
    assert.equal("message" in data.orders[0], false);

    const profileForm = new FormData();
    profileForm.set("full_name", "Test Customer");
    profileForm.set("consent", "on");
    profileForm.set("photo", new File([Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])], "profile.png", { type: "image/png" }));
    const saveProfile = await worker.fetch(new Request("https://lenabahri.ir/api/customer/profile", {
      method: "POST",
      headers: { Cookie: cookie, Origin: "https://lenabahri.ir" },
      body: profileForm
    }), env);
    assert.equal(saveProfile.status, 200);
    assert.equal((await saveProfile.json()).hasPhoto, true);

    const privatePhoto = await worker.fetch(new Request("https://lenabahri.ir/api/customer/photo", { headers: { Cookie: cookie } }), env);
    assert.equal(privatePhoto.status, 200);
    assert.deepEqual(Array.from(new Uint8Array(await privatePhoto.arrayBuffer())), [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

    const reaction = await worker.fetch(new Request("https://lenabahri.ir/api/customer/news/ss27-runway-beauty-2026/reaction", {
      method: "PUT",
      headers: { Cookie: cookie, Origin: "https://lenabahri.ir", "Content-Type": "application/json" },
      body: JSON.stringify({ reaction: "not-for-me" })
    }), env);
    assert.equal(reaction.status, 200);
    const comment = await worker.fetch(new Request("https://lenabahri.ir/api/customer/news/ss27-runway-beauty-2026/comments", {
      method: "POST",
      headers: { Cookie: cookie, Origin: "https://lenabahri.ir", "Content-Type": "application/json", "CF-Connecting-IP": "192.0.2.88" },
      body: JSON.stringify({ body: "A thoughtful comment", consent: true })
    }), env);
    assert.equal(comment.status, 201);
    const community = await worker.fetch(new Request("https://lenabahri.ir/api/news/ss27-runway-beauty-2026/community"), env);
    const communityData = await community.json();
    assert.deepEqual(communityData.counts, { resonated: 0, "not-for-me": 1 });
    assert.equal(communityData.comments[0].body, "A thoughtful comment");
    assert.equal(JSON.stringify(communityData).includes("09123456789"), false);
  } finally {
    globalThis.fetch = originalFetch;
    database.close();
  }
});
