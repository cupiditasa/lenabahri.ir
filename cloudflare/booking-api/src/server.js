import { createServer } from "node:http";
import { Buffer } from "node:buffer";
import process from "node:process";
import worker from "./worker.js";
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
    const apiResponse = await worker.fetch(request, env);
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

function shutdown() {
  clearInterval(cleanupTimer);
  server.close(() => {
    env.DB.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
