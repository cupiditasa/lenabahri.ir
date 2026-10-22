import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto, pbkdf2 } from "node:crypto";
import { promisify } from "node:util";
import worker from "../src/worker.js";
import { serviceDefaults } from "../src/cms.js";
import { openBookingDatabase } from "../src/sqlite-d1.js";

globalThis.crypto ||= webcrypto;
const derive = promisify(pbkdf2);

async function passwordHash(password) {
  const salt = Buffer.from("cms-integration-test-salt").toString("base64url");
  const hash = await derive(password, Buffer.from(salt, "base64url"), 210000, 32, "sha256");
  return `pbkdf2-sha256$210000$${salt}$${Buffer.from(hash).toString("base64url")}`;
}

function request(path, { method = "GET", body, cookie } = {}) {
  const headers = { Origin: "https://lenabahri.ir" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (cookie) headers.Cookie = cookie;
  return new Request(`https://lenabahri.ir${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}

test("CMS admin APIs authenticate, persist content, moderate publishing, and report safely", async () => {
  const database = openBookingDatabase(":memory:");
  const env = {
    DB: database,
    ADMIN_PASSWORD_HASH: await passwordHash("test-only-password"),
    SESSION_SECRET: "cms-test-session-secret-with-enough-entropy",
    RATE_LIMIT_SALT: "cms-test-rate-salt"
  };
  try {
    const loginResponse = await worker.fetch(request("/api/admin/login", {
      method: "POST",
      body: { username: "lena", password: "test-only-password" }
    }), env);
    assert.equal(loginResponse.status, 200);
    const cookie = loginResponse.headers.get("set-cookie").split(";")[0];

    const servicesResponse = await worker.fetch(request("/api/admin/content/services", { cookie }), env);
    assert.equal(servicesResponse.status, 200);
    assert.equal((await servicesResponse.json()).content.length, serviceDefaults.length);

    const portfolio = {
      categories: [{ id: "all", label: "All" }, { id: "brow", label: "Brow" }],
      projects: [{ id: 1, category: "brow", title: "Natural brow", description: "A sample portfolio item.", image: "assets/gallery/portfolio/work-01.jpg", detailImage: "assets/gallery/portfolio/work-11.jpg" }],
      awards: [],
      people: []
    };
    const savePortfolio = await worker.fetch(request("/api/admin/content/portfolio", { method: "PUT", body: portfolio, cookie }), env);
    assert.equal(savePortfolio.status, 200);
    const publicPortfolio = await worker.fetch(request("/api/public/content/portfolio"), env);
    assert.equal((await publicPortfolio.json()).content.projects.length, 1);

    const settings = { whatsappPhone: "989170000000", announcement: "Test notice", bookingsOpen: true };
    const saveSettings = await worker.fetch(request("/api/admin/content/settings", { method: "PUT", body: settings, cookie }), env);
    assert.equal(saveSettings.status, 200);
    const publicSettings = await worker.fetch(request("/api/public/content/settings"), env);
    assert.deepEqual((await publicSettings.json()).content, settings);

    const article = {
      title: "Test article", metaTitle: "Test article", description: "A test article description.", excerpt: "A short test summary.",
      lead: "A readable test article lead.", category: "trends", keywords: ["test"], sourceLabel: "Source", sourceTitle: "Source report",
      sourceUrl: "https://example.com/report", image: "/assets/news/example.jpg", imageAlt: "Test image", sourceDate: "2026-10-16",
      readingTime: 3, sections: [{ heading: "Details", paragraphs: ["A test paragraph."] }], translations: {}
    };
    const saveDraft = await worker.fetch(request("/api/admin/news/test-article", {
      method: "PUT", body: { article, status: "draft" }, cookie
    }), env);
    assert.equal(saveDraft.status, 200);
    const publicNews = await worker.fetch(request("/api/public/news"), env);
    assert.deepEqual((await publicNews.json()).articles, []);

    const report = await worker.fetch(request("/api/admin/overview?from=1792108800&to=1792195200", { cookie }), env);
    assert.equal(report.status, 200);
    assert.equal((await report.json()).bookings.total, 0);

    const unauthenticatedWrite = await worker.fetch(request("/api/admin/content/settings", { method: "PUT", body: settings }), env);
    assert.equal(unauthenticatedWrite.status, 401);
  } finally {
    database.close();
  }
});
