import test from "node:test";
import assert from "node:assert/strict";
import worker from "../src/worker.js";
import { openBookingDatabase } from "../src/sqlite-d1.js";

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
    assert.deepEqual(migrationRows.results.map((migration) => migration.id), ["0001_bookings.sql", "0002_booking_photo_blobs.sql"]);
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
