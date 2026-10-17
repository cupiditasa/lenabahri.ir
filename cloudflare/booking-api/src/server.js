import { createServer } from "node:http";
import { Buffer } from "node:buffer";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import process from "node:process";
import worker, { processAdminSmsOutbox } from "./worker.js";
import { openBookingDatabase } from "./sqlite-d1.js";

const maxRequestBytes = 2_000_000;
const publicOrigin = new URL(process.env.PUBLIC_ORIGIN || "");
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";
const requiredSecrets = ["ADMIN_PASSWORD_HASH", "SESSION_SECRET", "RATE_LIMIT_SALT"];

for (const secretName of requiredSecrets) {
  if (!process.env[secretName]) throw new Error(`${secretName} must be configured.`);
}

if (!/^https?:$/.test(publicOrigin.protocol) || publicOrigin.pathname !== "/" || publicOrigin.search || publicOrigin.hash) {
  throw new Error("PUBLIC_ORIGIN must be an origin such as https://lenabahri.ir.");
}

if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be a valid TCP port.");

const env = {
  ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
  SESSION_SECRET: process.env.SESSION_SECRET,
  RATE_LIMIT_SALT: process.env.RATE_LIMIT_SALT,
  SMSIR_API_KEY: process.env.SMSIR_API_KEY,
  SMSIR_LINE_NUMBER: process.env.SMSIR_LINE_NUMBER,
  ADMIN_NOTIFICATION_PHONE: process.env.ADMIN_NOTIFICATION_PHONE,
  SMSIR_OTP_TEMPLATE_ID: process.env.SMSIR_OTP_TEMPLATE_ID,
  SMSIR_OTP_PARAMETER_NAME: process.env.SMSIR_OTP_PARAMETER_NAME || "CODE",
  DB: openBookingDatabase(process.env.BOOKING_DB_PATH)
};

function sendJson(response, statusCode, payload) {
  const body = Buffer.from(JSON.stringify(payload));
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": body.length,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(body);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character]);
}

function localizedArticle(article, locale) {
  if (locale === "fa") return article;
  return article.translations?.[locale] || null;
}

async function renderCmsNews(requestUrl, outgoingResponse) {
  const slug = requestUrl.searchParams.get("slug") || "";
  const locale = ["en", "ar", "zh"].includes(requestUrl.searchParams.get("locale")) ? requestUrl.searchParams.get("locale") : "fa";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) {
    outgoingResponse.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" });
    outgoingResponse.end("Not found");
    return;
  }
  const row = await env.DB.prepare("SELECT slug, payload_json, published_at FROM cms_news WHERE slug = ? AND status = 'published'").bind(slug).first();
  const source = row ? JSON.parse(row.payload_json) : null;
  const article = source && localizedArticle(source, locale);
  if (!row || !article?.title || !article?.sections?.length) {
    outgoingResponse.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" });
    outgoingResponse.end("Not found");
    return;
  }
  const localePrefix = locale === "fa" ? "" : `/${locale}`;
  const path = `${localePrefix}/khabar/beauty/${slug}/`;
  const canonical = `${publicOrigin.origin}${path}`;
  const title = escapeHtml(article.metaTitle || article.title);
  const description = escapeHtml(article.description);
  const image = new URL(article.image, publicOrigin.origin).toString();
  const imageAlt = escapeHtml(article.imageAlt);
  const sections = (article.sections || []).map((section) => `<section><h2>${escapeHtml(section.heading)}</h2>${(section.paragraphs || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}</section>`).join("");
  const sourceHref = escapeHtml(source.sourceUrl);
  const sourceLabel = escapeHtml(source.sourceLabel);
  const sourceTitle = escapeHtml(source.sourceTitle);
  const date = new Date(Number(row.published_at) * 1000).toISOString().slice(0, 10);
  const publisher = locale === "fa" ? "لنا بحری" : locale === "ar" ? "لينا بحري" : locale === "zh" ? "Lena Bahri" : "Lena Bahri";
  const articleName = escapeHtml(article.title);
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.description,
    image: [image],
    datePublished: date,
    dateModified: date,
    inLanguage: locale === "zh" ? "zh-CN" : locale === "ar" ? "ar" : "fa-IR",
    mainEntityOfPage: canonical,
    author: { "@type": "Organization", name: publisher, url: `${publicOrigin.origin}${localePrefix}/` },
    publisher: { "@type": "Organization", name: publisher, url: `${publicOrigin.origin}${localePrefix}/` }
  }).replace(/</g, "\\u003c");
  const alternates = ["fa", "en", "ar", "zh"].map((code) => {
    const prefix = code === "fa" ? "" : `/${code}`;
    const language = code === "zh" ? "zh-CN" : code;
    return `<link rel="alternate" hreflang="${language}" href="${publicOrigin.origin}${prefix}/khabar/beauty/${slug}/">`;
  }).join("\n  ");
  const direction = locale === "fa" || locale === "ar" ? "rtl" : "ltr";
  const html = `<!doctype html><html lang="${locale === "zh" ? "zh-Hans" : locale}" dir="${direction}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | ${escapeHtml(publisher)}</title><meta name="description" content="${description}"><meta name="robots" content="index,follow"><link rel="canonical" href="${canonical}">${alternates}<meta property="og:type" content="article"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${escapeHtml(image)}"><meta property="og:image:alt" content="${imageAlt}"><meta name="twitter:card" content="summary_large_image"><link rel="stylesheet" href="/assets/beauty-news.css"><script type="application/ld+json">${schema}</script></head><body class="beauty-news"><header class="news-site-header"><a href="${localePrefix || "/"}" class="news-brand">LENA BAHRI</a><nav><a href="${localePrefix}/">${locale === "fa" ? "خانه" : locale === "ar" ? "الرئيسية" : locale === "zh" ? "首页" : "Home"}</a><a href="${localePrefix}/khabar/beauty/">${locale === "fa" ? "خبرهای زیبایی" : locale === "ar" ? "أخبار الجمال" : locale === "zh" ? "美容新闻" : "Beauty news"}</a></nav></header><main class="news-shell news-article-shell"><nav class="news-crumbs"><a href="${localePrefix}/">${locale === "fa" ? "خانه" : "Home"}</a><span> / </span><a href="${localePrefix}/khabar/beauty/">${locale === "fa" ? "خبرهای دنیای زیبایی" : locale === "ar" ? "أخبار عالم الجمال" : locale === "zh" ? "美容世界新闻" : "Beauty news"}</a><span> / </span><span>${articleName}</span></nav><article class="news-article"><header class="article-heading"><span class="news-category">${escapeHtml(article.categoryLabel || source.category || "Beauty")}</span><h1>${articleName}</h1><p class="article-dek">${escapeHtml(article.excerpt)}</p><div class="article-byline"><span>${locale === "fa" ? "تحریریه" : "Editorial team"}</span><time datetime="${date}">${date}</time><span>${Number(article.readingTime) || 4} ${locale === "fa" ? "دقیقه مطالعه" : "min read"}</span></div></header><figure class="article-hero"><img src="${escapeHtml(image)}" alt="${imageAlt}" fetchpriority="high"><figcaption>${locale === "fa" ? "تصویر مرتبط با موضوع خبر" : "Image illustrating the article topic"}</figcaption></figure><p class="article-lead">${escapeHtml(article.lead)}</p>${sections}<aside class="source-note"><h2>${locale === "fa" ? "منبع و تاریخ گزارش" : "Source"}</h2><p>${locale === "fa" ? "این گزارش با اتکا به منبع اصلی و با جمع‌بندی تحریریه تهیه شده است." : "This article is an editorial summary based on the cited source."}</p><ol><li><a href="${sourceHref}" target="_blank" rel="noopener noreferrer">${sourceTitle} — ${sourceLabel}</a></li></ol></aside><section class="news-community" data-news-community data-article-slug="${escapeHtml(slug)}" aria-live="polite"></section></article><p class="back-to-news"><a href="${localePrefix}/khabar/beauty/">${locale === "fa" ? "بازگشت به خبرهای زیبایی" : "Back to beauty news"}</a></p></main><footer class="news-footer"><span>© ${new Date().getFullYear()} ${escapeHtml(publisher)}</span><a href="${localePrefix}/">${locale === "fa" ? "صفحهٔ اصلی" : "Home"}</a></footer><script src="/assets/news-community.js" defer></script></body></html>`;
  const body = Buffer.from(html);
  outgoingResponse.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Content-Length": body.length, "Cache-Control": "public, max-age=60", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "strict-origin-when-cross-origin" });
  outgoingResponse.end(body);
}

async function renderCmsSitemap(outgoingResponse) {
  const candidates = [fileURLToPath(new URL("../../public/sitemap.xml", import.meta.url)), fileURLToPath(new URL("../../../sitemap.xml", import.meta.url))];
  const sitemapPath = candidates.find((candidate) => existsSync(candidate));
  if (!sitemapPath) {
    sendJson(outgoingResponse, 503, { error: "Sitemap source is unavailable." });
    return;
  }
  let xml = readFileSync(sitemapPath, "utf8");
  const existing = new Set([...xml.matchAll(/<loc>(.*?)<\/loc>/gs)].map((match) => {
    try { return new URL(match[1].replaceAll("&amp;", "&"), publicOrigin.origin).pathname; } catch { return ""; }
  }));
  const result = await env.DB.prepare("SELECT slug, published_at FROM cms_news WHERE status = 'published'").all();
  const entries = [];
  for (const article of result.results || []) {
    const lastmod = new Date(Number(article.published_at) * 1000).toISOString().slice(0, 10);
    for (const prefix of ["", "/en", "/ar", "/zh"]) {
      const path = `${prefix}/khabar/beauty/${article.slug}/`;
      if (existing.has(path)) continue;
      entries.push(`<url><loc>${publicOrigin.origin}${path}</loc><lastmod>${lastmod}</lastmod></url>`);
    }
  }
  xml = xml.replace(/<\/urlset>\s*$/i, `${entries.join("")}\n</urlset>`);
  const body = Buffer.from(xml);
  outgoingResponse.writeHead(200, { "Content-Type": "application/xml; charset=utf-8", "Content-Length": body.length, "Cache-Control": "public, max-age=300", "X-Content-Type-Options": "nosniff" });
  outgoingResponse.end(body);
}

async function readBody(request) {
  const chunks = [];
  let totalBytes = 0;
  for await (const chunk of request) {
    totalBytes += chunk.length;
    if (totalBytes > maxRequestBytes) throw new RangeError("Request body too large.");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks, totalBytes);
}

async function handleRequest(incomingRequest, outgoingResponse) {
  let requestUrl;
  try {
    requestUrl = new URL(incomingRequest.url || "/", publicOrigin);
  } catch {
    sendJson(outgoingResponse, 400, { error: "Invalid request." });
    return;
  }
  if (requestUrl.origin !== publicOrigin.origin) {
    sendJson(outgoingResponse, 400, { error: "Invalid request origin." });
    return;
  }
  if (incomingRequest.method === "GET" && requestUrl.pathname === "/api/public/render-news") {
    await renderCmsNews(requestUrl, outgoingResponse);
    return;
  }
  if (incomingRequest.method === "GET" && requestUrl.pathname === "/api/public/sitemap.xml") {
    await renderCmsSitemap(outgoingResponse);
    return;
  }
  if (!requestUrl.pathname.startsWith("/api/")) {
    sendJson(outgoingResponse, 404, { error: "Not found." });
    return;
  }

  let body;
  try {
    body = await readBody(incomingRequest);
  } catch (error) {
    incomingRequest.resume();
    sendJson(outgoingResponse, error instanceof RangeError ? 413 : 400, { error: "Request body could not be read." });
    return;
  }

  const headers = new Headers();
  const excludedHeaders = new Set(["connection", "host", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade"]);
  for (const [name, value] of Object.entries(incomingRequest.headers)) {
    if (excludedHeaders.has(name) || value === undefined) continue;
    headers.set(name, Array.isArray(value) ? value.join(", ") : value);
  }

  const method = incomingRequest.method || "GET";
  let request;
  try {
    request = new Request(requestUrl, {
      method,
      headers,
      ...(body.length && method !== "GET" && method !== "HEAD" ? { body, duplex: "half" } : {})
    });
  } catch {
    sendJson(outgoingResponse, 400, { error: "Invalid request." });
    return;
  }

  try {
    const apiResponse = await worker.fetch(request, env, {
      waitUntil(task) { void task.catch(() => {}); }
    });
    const responseHeaders = {};
    apiResponse.headers.forEach((value, name) => {
      if (name !== "set-cookie" && name !== "content-length") responseHeaders[name] = value;
    });
    const cookies = apiResponse.headers.getSetCookie?.();
    if (cookies?.length) responseHeaders["Set-Cookie"] = cookies;
    const responseBody = Buffer.from(await apiResponse.arrayBuffer());
    responseHeaders["Content-Length"] = String(responseBody.length);
    outgoingResponse.writeHead(apiResponse.status, responseHeaders);
    outgoingResponse.end(responseBody);
  } catch {
    sendJson(outgoingResponse, 500, { error: "Internal server error." });
  }
}

const server = createServer((request, response) => {
  void handleRequest(request, response);
});

server.headersTimeout = 10_000;
server.requestTimeout = 30_000;
server.keepAliveTimeout = 5_000;

server.listen(port, host, () => {
  process.stdout.write(`Booking API listening on ${host}:${port}\n`);
});

async function runCleanup() {
  const tasks = [];
  await worker.scheduled({}, env, { waitUntil: (task) => tasks.push(task) });
  await Promise.all(tasks);
}

void runCleanup().catch(() => process.stderr.write("Initial retention cleanup failed.\n"));
const cleanupTimer = setInterval(() => {
  void runCleanup().catch(() => process.stderr.write("Scheduled retention cleanup failed.\n"));
}, 60 * 60 * 1000);
cleanupTimer.unref();

const adminSmsTimer = setInterval(() => {
  void processAdminSmsOutbox(env).catch(() => process.stderr.write("Scheduled admin SMS delivery failed.\n"));
}, 60 * 1000);
adminSmsTimer.unref();

function shutdown() {
  clearInterval(cleanupTimer);
  clearInterval(adminSmsTimer);
  server.close(() => {
    env.DB.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
