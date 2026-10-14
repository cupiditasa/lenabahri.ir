const SERVICES = new Set([
  "microblading",
  "hairstroke",
  "nano-brows",
  "scalp-micropigmentation",
  "lip-shading",
  "lip-tint",
  "eyeliner",
  "eye-shading",
  "lash-line",
  "brow-removal",
  "training",
  "consultation"
]);

const STATUSES = new Set(["pending", "contacted", "confirmed", "completed", "cancelled"]);
const MAX_PHOTO_BYTES = 1_500_000;
const BOOKING_RETENTION_SECONDS = 90 * 24 * 60 * 60;
const SESSION_SECONDS = 12 * 60 * 60;
const CUSTOMER_SESSION_SECONDS = 7 * 24 * 60 * 60;
const CUSTOMER_OTP_SECONDS = 5 * 60;
const CUSTOMER_OTP_ATTEMPTS = 5;

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      ...extraHeaders
    }
  });
}

function clean(value, maxLength) {
  return String(value ?? "").trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").slice(0, maxLength);
}

function base64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function digest(value) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}

async function verifyPassword(password, encodedHash) {
  const [algorithm, iterationText, saltText, hashText] = String(encodedHash || "").split("$");
  const iterations = Number(iterationText);
  if (algorithm !== "pbkdf2-sha256" || !Number.isInteger(iterations) || iterations < 100000 || iterations > 600000 || !saltText || !hashText) return false;
  try {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const derived = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: decodeBase64Url(saltText), iterations }, key, 256));
    return constantTimeEqual(derived, decodeBase64Url(hashText));
  } catch {
    return false;
  }
}

function cookieValue(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const item = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return item ? item.slice(name.length + 1) : "";
}

function assertSameOrigin(request) {
  const origin = request.headers.get("Origin");
  try { return Boolean(origin) && new URL(origin).origin === new URL(request.url).origin; }
  catch { return false; }
}

async function authenticated(request, env) {
  if (!env.SESSION_SECRET) return false;
  const parts = cookieValue(request, "lena_admin_session").split(".");
  if (parts.length !== 3) return false;
  const [expiresText, nonce, signatureText] = parts;
  const expires = Number(expiresText);
  if (!Number.isSafeInteger(expires) || expires <= Math.floor(Date.now() / 1000) || expires > Math.floor(Date.now() / 1000) + SESSION_SECONDS + 60) return false;
  try {
    const expected = await hmac(env.SESSION_SECRET, `${expiresText}.${nonce}`);
    return constantTimeEqual(expected, decodeBase64Url(signatureText));
  } catch {
    return false;
  }
}

async function rateLimit(request, env, scope, windowSeconds, limit) {
  const address = request.headers.get("CF-Connecting-IP") || "unknown";
  return rateLimitIdentity(env, scope, address, windowSeconds, limit);
}

async function rateLimitIdentity(env, scope, identity, windowSeconds, limit) {
  const ipHash = base64Url(await digest(`${env.RATE_LIMIT_SALT || env.SESSION_SECRET || "lena-rate-limit"}:${scope}:${identity}`));
  const windowStart = Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds;
  const result = await env.DB.prepare(
    "INSERT INTO rate_limits (scope, ip_hash, window_start, count) VALUES (?, ?, ?, 1) ON CONFLICT(scope, ip_hash, window_start) DO UPDATE SET count = count + 1 WHERE count < ?"
  ).bind(scope, ipHash, windowStart, limit).run();
  return result.meta?.changes !== 0;
}

function asciiDigits(value) {
  return String(value ?? "").replace(/[۰-۹٠-٩]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩".indexOf(digit) % 10));
}

function normalizeIranianMobile(value) {
  let digits = asciiDigits(value).replace(/\D/g, "");
  if (digits.startsWith("0098")) digits = digits.slice(4);
  else if (digits.startsWith("98")) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("9")) digits = `0${digits}`;
  return /^09\d{9}$/.test(digits) ? digits : "";
}

async function sendCustomerOtp(env, mobile, code) {
  const templateId = String(env.SMSIR_OTP_TEMPLATE_ID || "").trim();
  if (!env.SMSIR_API_KEY || !/^\d+$/.test(templateId)) return false;
  try {
    const response = await fetch("https://api.sms.ir/v1/send/verify", {
      method: "POST",
      headers: {
        "X-API-KEY": env.SMSIR_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        Mobile: mobile,
        TemplateId: Number(templateId),
        Parameters: [{ Name: env.SMSIR_OTP_PARAMETER_NAME || "CODE", Value: code }]
      }),
      signal: AbortSignal.timeout(12_000)
    });
    const result = await response.json().catch(() => ({}));
    return response.ok && Number(result.Status ?? result.status) === 1;
  } catch {
    return false;
  }
}

async function requestCustomerOtp(request, env) {
  if (!assertSameOrigin(request)) return json({ error: "مبدأ درخواست معتبر نیست." }, 403);
  if (!env.DB || !env.SESSION_SECRET || !env.RATE_LIMIT_SALT || !env.SMSIR_API_KEY || !/^\d+$/.test(String(env.SMSIR_OTP_TEMPLATE_ID || ""))) {
    return json({ error: "ورود پیامکی موقتاً آماده نیست." }, 503);
  }
  let data;
  try { data = await request.json(); } catch { return json({ error: "درخواست نامعتبر است." }, 400); }
  const mobile = normalizeIranianMobile(data.phone);
  if (!mobile) return json({ error: "شمارهٔ همراه معتبر وارد کنید." }, 400);
  if (!await rateLimit(request, env, "customer-otp-ip", 900, 5)
    || !await rateLimitIdentity(env, "customer-otp-phone-minute", mobile, 60, 1)
    || !await rateLimitIdentity(env, "customer-otp-phone-hour", mobile, 3600, 5)) {
    return json({ error: "درخواست کد زیاد است؛ کمی بعد دوباره تلاش کنید." }, 429);
  }

  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, "0");
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + CUSTOMER_OTP_SECONDS;
  const codeHash = base64Url(await hmac(env.SESSION_SECRET, `customer-otp.${mobile}.${code}.${expiresAt}`));
  await env.DB.prepare(
    "INSERT INTO customer_otp_codes (phone, code_hash, expires_at, attempts, created_at) VALUES (?, ?, ?, 0, ?) ON CONFLICT(phone) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at, attempts = 0, created_at = excluded.created_at"
  ).bind(mobile, codeHash, expiresAt, now).run();

  if (!await sendCustomerOtp(env, mobile, code)) return json({ error: "ارسال کد انجام نشد؛ کمی بعد دوباره تلاش کنید." }, 502);
  return json({ ok: true, expiresIn: CUSTOMER_OTP_SECONDS });
}

async function customerSessionPhone(request, env) {
  if (!env.SESSION_SECRET) return "";
  const parts = cookieValue(request, "lena_customer_session").split(".");
  if (parts.length !== 4) return "";
  const [expiresText, phoneText, nonce, signatureText] = parts;
  const expires = Number(expiresText);
  if (!Number.isSafeInteger(expires) || expires <= Math.floor(Date.now() / 1000) || expires > Math.floor(Date.now() / 1000) + CUSTOMER_SESSION_SECONDS + 60) return "";
  try {
    const phone = new TextDecoder().decode(decodeBase64Url(phoneText));
    if (!normalizeIranianMobile(phone)) return "";
    const expected = await hmac(env.SESSION_SECRET, `${expiresText}.${phone}.${nonce}`);
    return constantTimeEqual(expected, decodeBase64Url(signatureText)) ? phone : "";
  } catch {
    return "";
  }
}

async function verifyCustomerOtp(request, env) {
  if (!assertSameOrigin(request)) return json({ error: "مبدأ درخواست معتبر نیست." }, 403);
  if (!env.DB || !env.SESSION_SECRET) return json({ error: "ورود پیامکی موقتاً آماده نیست." }, 503);
  let data;
  try { data = await request.json(); } catch { return json({ error: "درخواست نامعتبر است." }, 400); }
  const mobile = normalizeIranianMobile(data.phone);
  const code = asciiDigits(data.code).replace(/\D/g, "");
  if (!mobile || !/^\d{6}$/.test(code)) return json({ error: "شمارهٔ همراه یا کد واردشده معتبر نیست." }, 400);
  if (!await rateLimit(request, env, "customer-otp-verify-ip", 900, 12)
    || !await rateLimitIdentity(env, "customer-otp-verify-phone", mobile, 900, 8)) {
    return json({ error: "تلاش‌های زیادی انجام شده؛ کمی بعد دوباره تلاش کنید." }, 429);
  }

  const stored = await env.DB.prepare("SELECT code_hash, expires_at, attempts FROM customer_otp_codes WHERE phone = ?").bind(mobile).first();
  const now = Math.floor(Date.now() / 1000);
  if (!stored || stored.expires_at <= now || stored.attempts >= CUSTOMER_OTP_ATTEMPTS) {
    return json({ error: "کد معتبر نیست یا منقضی شده؛ کد تازه بگیرید." }, 401);
  }
  const expectedHash = await hmac(env.SESSION_SECRET, `customer-otp.${mobile}.${code}.${stored.expires_at}`);
  let matches = false;
  try { matches = constantTimeEqual(expectedHash, decodeBase64Url(stored.code_hash)); } catch {}
  if (!matches) {
    await env.DB.prepare("UPDATE customer_otp_codes SET attempts = attempts + 1 WHERE phone = ?").bind(mobile).run();
    return json({ error: "کد واردشده درست نیست." }, 401);
  }

  await env.DB.prepare("DELETE FROM customer_otp_codes WHERE phone = ?").bind(mobile).run();
  const expires = now + CUSTOMER_SESSION_SECONDS;
  const nonce = crypto.randomUUID();
  const phoneToken = base64Url(new TextEncoder().encode(mobile));
  const signature = base64Url(await hmac(env.SESSION_SECRET, `${expires}.${mobile}.${nonce}`));
  const cookie = `lena_customer_session=${expires}.${phoneToken}.${nonce}.${signature}; Path=/api/customer; Max-Age=${CUSTOMER_SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
  return json({ ok: true }, 200, { "Set-Cookie": cookie });
}

async function customerProfile(request, env) {
  const mobile = await customerSessionPhone(request, env);
  if (!mobile) return json({ error: "برای مشاهدهٔ حساب وارد شوید." }, 401);
  const profile = await env.DB.prepare("SELECT full_name, photo_data IS NOT NULL AS has_photo FROM customer_profiles WHERE phone = ?").bind(mobile).first();
  const phoneKey = mobile.slice(-10);
  const normalizedPhoneSql = "REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(phone, '+', ''), ' ', ''), '-', ''), '(', ''), ')', ''), '.', ''), '/', ''), CHAR(9), ''), CHAR(10), ''), CHAR(13), '')";
  const orders = await env.DB.prepare(
    `SELECT id, service, payment_method, status, created_at FROM bookings WHERE SUBSTR(${normalizedPhoneSql}, -10) = ? ORDER BY created_at DESC LIMIT 100`
  ).bind(phoneKey).all();
  return json({
    profile: { fullName: profile?.full_name || "", hasPhoto: Boolean(profile?.has_photo) },
    phoneHint: `${mobile.slice(0, 4)}•••${mobile.slice(-4)}`,
    orders: orders.results || []
  });
}

async function updateCustomerProfile(request, env) {
  if (!assertSameOrigin(request)) return json({ error: "مبدأ درخواست معتبر نیست." }, 403);
  const mobile = await customerSessionPhone(request, env);
  if (!mobile) return json({ error: "برای ذخیرهٔ اطلاعات وارد شوید." }, 401);
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("multipart/form-data;")) return json({ error: "قالب فرم معتبر نیست." }, 415);
  if (Number(request.headers.get("Content-Length")) > MAX_PHOTO_BYTES + 100_000) return json({ error: "حجم عکس بیشتر از حد مجاز است." }, 413);
  let form;
  try { form = await request.formData(); } catch { return json({ error: "فرم قابل خواندن نیست." }, 400); }
  const fullName = clean(form.get("full_name"), 120);
  const consent = form.get("consent") === "on";
  const photo = form.get("photo");
  if (fullName.length < 2 || !consent) return json({ error: "نام و رضایت‌نامهٔ ذخیره‌سازی را بررسی کنید." }, 400);
  if (photo instanceof File && photo.size > MAX_PHOTO_BYTES) return json({ error: "حجم عکس باید حداکثر ۱٫۵ مگابایت باشد." }, 413);
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (photo instanceof File && photo.size > 0 && !allowedTypes.has(photo.type)) return json({ error: "فقط عکس JPG، PNG یا WebP پذیرفته می‌شود." }, 415);
  if (photo instanceof File && photo.size > 0) {
    const signature = new Uint8Array(await photo.slice(0, 12).arrayBuffer());
    const validSignature = photo.type === "image/jpeg"
      ? signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff
      : photo.type === "image/png"
        ? [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => signature[index] === byte)
        : signature[0] === 0x52 && signature[1] === 0x49 && signature[2] === 0x46 && signature[3] === 0x46 && signature[8] === 0x57 && signature[9] === 0x45 && signature[10] === 0x42 && signature[11] === 0x50;
    if (!validSignature) return json({ error: "محتوای فایل با نوع عکس انتخاب‌شده سازگار نیست." }, 415);
  }
  const now = Math.floor(Date.now() / 1000);
  const photoData = photo instanceof File && photo.size > 0 ? await photo.arrayBuffer() : null;
  const photoContentType = photoData ? photo.type : null;
  await env.DB.prepare(
    "INSERT INTO customer_profiles (phone, full_name, photo_data, photo_content_type, created_at, updated_at, consent_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(phone) DO UPDATE SET full_name = excluded.full_name, photo_data = COALESCE(excluded.photo_data, customer_profiles.photo_data), photo_content_type = COALESCE(excluded.photo_content_type, customer_profiles.photo_content_type), updated_at = excluded.updated_at, consent_at = excluded.consent_at"
  ).bind(mobile, fullName, photoData, photoContentType, now, now, now).run();
  return json({ ok: true, fullName, hasPhoto: Boolean(photoData) || Boolean((await env.DB.prepare("SELECT photo_data IS NOT NULL AS has_photo FROM customer_profiles WHERE phone = ?").bind(mobile).first())?.has_photo) });
}

async function customerPhoto(request, env) {
  const mobile = await customerSessionPhone(request, env);
  if (!mobile) return json({ error: "برای مشاهدهٔ عکس وارد شوید." }, 401);
  const row = await env.DB.prepare("SELECT photo_data, photo_content_type FROM customer_profiles WHERE phone = ?").bind(mobile).first();
  const imageBytes = row?.photo_data instanceof ArrayBuffer
    ? new Uint8Array(row.photo_data)
    : row?.photo_data ? Uint8Array.from(row.photo_data) : null;
  if (!imageBytes?.byteLength) return json({ error: "عکسی برای حساب ثبت نشده است." }, 404);
  return new Response(imageBytes, {
    headers: {
      "Content-Type": row.photo_content_type || "application/octet-stream",
      "Content-Length": String(imageBytes.byteLength),
      "Cache-Control": "private, no-store",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Cross-Origin-Resource-Policy": "same-origin"
    }
  });
}

async function logoutCustomer(request) {
  if (!assertSameOrigin(request)) return json({ error: "مبدأ درخواست معتبر نیست." }, 403);
  return json({ ok: true }, 200, { "Set-Cookie": "lena_customer_session=; Path=/api/customer; Max-Age=0; HttpOnly; Secure; SameSite=Strict" });
}

async function login(request, env) {
  if (!assertSameOrigin(request)) return json({ error: "مبدأ درخواست معتبر نیست." }, 403);
  if (!env.ADMIN_PASSWORD_HASH || !env.SESSION_SECRET) return json({ error: "Admin credentials are not configured." }, 503);
  if (!await rateLimit(request, env, "login", 900, 8)) return json({ error: "تعداد تلاش‌ها زیاد است؛ ۱۵ دقیقه دیگر دوباره تلاش کنید." }, 429);
  let data;
  try { data = await request.json(); } catch { return json({ error: "درخواست نامعتبر است." }, 400); }
  const username = clean(data.username, 64);
  const password = String(data.password || "").slice(0, 256);
  const validUser = constantTimeEqual(await digest(username), await digest("lena"));
  const validPassword = await verifyPassword(password, env.ADMIN_PASSWORD_HASH);
  if (!validUser || !validPassword) return json({ error: "نام کاربری یا رمز عبور درست نیست." }, 401);
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const nonce = crypto.randomUUID();
  const signature = base64Url(await hmac(env.SESSION_SECRET, `${expires}.${nonce}`));
  const cookie = `lena_admin_session=${expires}.${nonce}.${signature}; Path=/api/admin; Max-Age=${SESSION_SECONDS}; HttpOnly; Secure; SameSite=Strict`;
  return json({ ok: true }, 200, { "Set-Cookie": cookie });
}

async function createBooking(request, env) {
  if (!assertSameOrigin(request)) return json({ error: "مبدأ درخواست معتبر نیست." }, 403);
  if (!env.ADMIN_PASSWORD_HASH || !env.SESSION_SECRET || !env.RATE_LIMIT_SALT) return json({ error: "سامانه رزرو موقتاً آماده نیست." }, 503);
  if (!await rateLimit(request, env, "booking", 3600, 5)) return json({ error: "تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید." }, 429);
  if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("multipart/form-data;")) return json({ error: "فرمت فرم معتبر نیست." }, 415);
  if (Number(request.headers.get("Content-Length")) > MAX_PHOTO_BYTES + 100_000) return json({ error: "حجم درخواست بیشتر از حد مجاز است." }, 413);
  let form;
  try { form = await request.formData(); } catch { return json({ error: "فرم قابل خواندن نیست." }, 400); }
  if (clean(form.get("website"), 120)) return json({ ok: true, reference: "" });

  const name = clean(form.get("name"), 120);
  const phone = clean(form.get("phone"), 40).replace(/[۰-۹٠-٩]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩".indexOf(digit) % 10));
  const service = clean(form.get("service"), 64);
  const paymentMethod = clean(form.get("payment_method"), 16);
  const message = clean(form.get("message"), 2000);
  const consent = form.get("consent") === "on";
  const photo = form.get("photo");
  if (name.length < 2 || !/^[+\d\s()\-]{7,40}$/.test(phone) || !SERVICES.has(service) || !["cash", "consult"].includes(paymentMethod) || !consent) {
    return json({ error: "لطفاً نام، شماره، خدمت و رضایت‌نامه را بررسی کنید." }, 400);
  }
  if (paymentMethod === "cash" && !(photo instanceof File && photo.size > 0)) return json({ error: "برای رزرو نقدی، انتخاب عکس الزامی است." }, 400);
  if (photo instanceof File && photo.size > MAX_PHOTO_BYTES) return json({ error: "حجم عکس باید حداکثر ۱٫۵ مگابایت باشد." }, 413);
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (photo instanceof File && photo.size > 0 && !allowedTypes.has(photo.type)) return json({ error: "فقط عکس‌های JPG، PNG یا WebP پذیرفته می‌شوند." }, 415);
  if (photo instanceof File && photo.size > 0) {
    const signature = new Uint8Array(await photo.slice(0, 12).arrayBuffer());
    const validSignature = photo.type === "image/jpeg"
      ? signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff
      : photo.type === "image/png"
        ? [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => signature[index] === byte)
        : signature[0] === 0x52 && signature[1] === 0x49 && signature[2] === 0x46 && signature[3] === 0x46 && signature[8] === 0x57 && signature[9] === 0x45 && signature[10] === 0x42 && signature[11] === 0x50;
    if (!validSignature) return json({ error: "محتوای فایل با نوع عکس انتخاب‌شده سازگار نیست." }, 415);
  }
  if (!env.DB) return json({ error: "سامانه رزرو موقتاً آماده نیست." }, 503);

  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const photoData = photo instanceof File && photo.size > 0 ? await photo.arrayBuffer() : null;
  const photoContentType = photoData ? photo.type : null;
  try {
    await env.DB.prepare(
      "INSERT INTO bookings (id, name, phone, service, payment_method, message, photo_data, photo_content_type, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)"
    ).bind(id, name, phone, service, paymentMethod, message, photoData, photoContentType, now).run();
  } catch {
    return json({ error: "ثبت درخواست انجام نشد؛ لطفاً دوباره تلاش کنید." }, 503);
  }
  await env.DB.prepare("DELETE FROM rate_limits WHERE window_start < ?").bind(now - 7200).run().catch(() => {});
  return json({ ok: true, reference: id.slice(0, 8).toUpperCase() }, 201);
}

async function adminBookings(request, env, url) {
  if (!await authenticated(request, env)) return json({ error: "برای مشاهدهٔ درخواست‌ها وارد شوید." }, 401);
  const status = clean(url.searchParams.get("status"), 20);
  const query = clean(url.searchParams.get("q"), 100);
  const conditions = [];
  const values = [];
  if (STATUSES.has(status)) { conditions.push("status = ?"); values.push(status); }
  if (query) {
    conditions.push("(name LIKE ? OR phone LIKE ? OR service LIKE ? OR id LIKE ?)");
    const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
    values.push(pattern, pattern, pattern, pattern);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = await env.DB.prepare(
    `SELECT id, name, phone, service, payment_method, message, photo_data IS NOT NULL AS has_photo, status, created_at FROM bookings ${where} ORDER BY created_at DESC LIMIT 200`
  ).bind(...values).all();
  const counts = await env.DB.prepare("SELECT status, COUNT(*) AS count FROM bookings GROUP BY status").all();
  return json({ bookings: result.results || [], counts: counts.results || [] });
}

async function updateBooking(request, env, id) {
  if (!assertSameOrigin(request)) return json({ error: "مبدأ درخواست معتبر نیست." }, 403);
  if (!await authenticated(request, env)) return json({ error: "نشست ادمین منقضی شده است." }, 401);
  let data;
  try { data = await request.json(); } catch { return json({ error: "درخواست نامعتبر است." }, 400); }
  const status = clean(data.status, 20);
  if (!STATUSES.has(status)) return json({ error: "وضعیت انتخاب‌شده معتبر نیست." }, 400);
  const result = await env.DB.prepare("UPDATE bookings SET status = ? WHERE id = ?").bind(status, id).run();
  if (!result.meta?.changes) return json({ error: "درخواست پیدا نشد." }, 404);
  return json({ ok: true });
}

async function bookingPhoto(request, env, id) {
  if (!await authenticated(request, env)) return json({ error: "برای مشاهدهٔ عکس وارد شوید." }, 401);
  const row = await env.DB.prepare("SELECT photo_data, photo_content_type FROM bookings WHERE id = ?").bind(id).first();
  const imageBytes = row?.photo_data instanceof ArrayBuffer
    ? new Uint8Array(row.photo_data)
    : row?.photo_data ? Uint8Array.from(row.photo_data) : null;
  if (!imageBytes?.byteLength) return json({ error: "عکسی برای این درخواست ثبت نشده است." }, 404);
  return new Response(imageBytes, {
    headers: {
      "Content-Type": row.photo_content_type || "application/octet-stream",
      "Content-Length": String(imageBytes.byteLength),
      "Cache-Control": "private, no-store",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Cross-Origin-Resource-Policy": "same-origin"
    }
  });
}

async function cleanup(env) {
  const now = Math.floor(Date.now() / 1000);
  const cutoff = now - BOOKING_RETENTION_SECONDS;
  await env.DB.prepare("DELETE FROM bookings WHERE created_at < ?").bind(cutoff).run();
  await env.DB.prepare("DELETE FROM customer_profiles WHERE created_at < ?").bind(cutoff).run();
  await env.DB.prepare("DELETE FROM customer_otp_codes WHERE expires_at < ?").bind(now).run();
  await env.DB.prepare("DELETE FROM rate_limits WHERE window_start < ?").bind(now - 7200).run();
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === "/api/health" && request.method === "GET") return json({ ok: true });
    if (path === "/api/bookings" && request.method === "POST") return createBooking(request, env);
    if (path === "/api/customer/otp/request" && request.method === "POST") return requestCustomerOtp(request, env);
    if (path === "/api/customer/otp/verify" && request.method === "POST") return verifyCustomerOtp(request, env);
    if (path === "/api/customer/me" && request.method === "GET") return customerProfile(request, env);
    if (path === "/api/customer/profile" && request.method === "POST") return updateCustomerProfile(request, env);
    if (path === "/api/customer/photo" && request.method === "GET") return customerPhoto(request, env);
    if (path === "/api/customer/logout" && request.method === "POST") return logoutCustomer(request);
    if (path === "/api/admin/login" && request.method === "POST") return login(request, env);
    if (path === "/api/admin/logout" && request.method === "POST") {
      if (!assertSameOrigin(request)) return json({ error: "مبدأ درخواست معتبر نیست." }, 403);
      return json({ ok: true }, 200, { "Set-Cookie": "lena_admin_session=; Path=/api/admin; Max-Age=0; HttpOnly; Secure; SameSite=Strict" });
    }
    if (path === "/api/admin/bookings" && request.method === "GET") return adminBookings(request, env, url);
    const photoMatch = path.match(/^\/api\/admin\/bookings\/([\w-]+)\/photo$/);
    if (photoMatch && request.method === "GET") return bookingPhoto(request, env, photoMatch[1]);
    const bookingMatch = path.match(/^\/api\/admin\/bookings\/([\w-]+)$/);
    if (bookingMatch && request.method === "PATCH") return updateBooking(request, env, bookingMatch[1]);
    return json({ error: "مسیر پیدا نشد." }, 404);
  },
  async scheduled(_event, env, context) {
    context.waitUntil(cleanup(env));
  }
};
