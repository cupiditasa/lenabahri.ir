const contentKinds = new Set(["services", "portfolio", "settings"]);
const locales = ["fa", "en", "ar", "zh"];
const serviceIds = new Set([
  "microblading", "hairstroke", "nano-brows", "scalp-micropigmentation", "lip-shading", "lip-tint",
  "eyeliner", "eye-shading", "lash-line", "brow-removal", "training", "consultation"
]);
const serviceCategories = new Set(["brow", "lip", "eye", "scalp", "training", "other"]);
const portfolioCategories = new Set(["brow", "lip", "eye", "scalp", "academy"]);
const serviceDefaults = [
  ["microblading", ["میکروبلدینگ ابرو (فیبروز)", "Eyebrow microblading (PhiBrows)", "مايكروبليدنج الحواجب (PhiBrows)", "眉部微雕（PhiBrows）"], ["طراحی ظریف و متناسب با فرم صورت و الگوی رویش ابرو.", "Fine design tailored to facial features and natural brow growth.", "تصميم دقيق يتناسب مع ملامح الوجه ونمط نمو الحواجب.", "根据面部特征和眉毛生长方向进行精细设计。"], 6000000, 6000000, "brow"],
  ["hairstroke", ["هیراستروک ابرو", "Eyebrow hairstrokes", "رسم شعيرات الحواجب", "眉部仿真线条"], ["تکنیک تاربه‌تار برای جلوه‌ای طبیعی و هماهنگ با ابرو.", "Hair-by-hair technique for a natural brow look.", "تقنية شعرة بشعرة لمظهر طبيعي ومتناسق.", "逐根仿真，呈现自然协调的眉形。"], 7000000, 7000000, "brow"],
  ["nano-brows", ["نانو بروز ابرو", "Nano brows", "حواجب النانو", "纳米眉"], ["تکنیکی ظریف با انتخاب رنگ و طراحی متناسب با چهره.", "A delicate technique with color and design tailored to the face.", "تقنية دقيقة مع اختيار لون وتصميم يناسب ملامح الوجه.", "根据面部特征选择颜色与设计的精细技法。"], 6000000, 6000000, "brow"],
  ["scalp-micropigmentation", ["میکرواسکالپ سر", "Scalp micropigmentation", "التصبغ التجميلي لفروة الرأس", "头皮微色素"], ["طرح و برآورد هزینه پس از مشاهده و معاینهٔ ناحیه انجام می‌شود.", "Design and pricing are assessed after examining the area.", "يتم تحديد التصميم والتكلفة بعد فحص المنطقة.", "检查区域后再评估设计方案和费用。"], 3000000, 20000000, "scalp"],
  ["lip-shading", ["شیدینگ لب", "Lip shading", "تظليل الشفاه", "唇部雾化"], ["پخش رنگ ملایم برای جلوه‌ای یکدست و متناسب با چهره.", "Soft color shading for an even look tailored to the face.", "توزيع لون ناعم لمظهر متجانس يناسب ملامح الوجه.", "柔和上色，呈现协调自然的唇色。"], 6000000, 6000000, "lip"],
  ["lip-tint", ["تینت لب", "Lip tint", "تلوين الشفاه", "唇部染色"], ["انتخاب رنگ ملایم برای جلوه‌ای طبیعی‌تر و هماهنگ با لب.", "A soft tint selected for a natural look.", "اختيار لون ناعم لمظهر طبيعي ومتناسق.", "选择柔和色调，呈现自然唇色。"], 6000000, 6000000, "lip"],
  ["eyeliner", ["خط چشم", "Eyeliner", "الآيلاينر", "眼线"], ["طراحی خط متناسب با فرم چشم و سلیقهٔ شما.", "Eyeliner design tailored to your eye shape and preference.", "تصميم خط يناسب شكل العين وتفضيلاتك.", "根据眼型和个人偏好设计眼线。"], 6000000, 6000000, "eye"],
  ["eye-shading", ["شید چشم", "Eye shading", "تظليل العين", "眼部柔雾"], ["انتخاب شدت و فرم سایه پس از بررسی ویژگی‌های چشم.", "Shade and intensity are chosen after assessing the eye area.", "يُختار شكل الظل ودرجته بعد تقييم منطقة العين.", "评估眼部特征后确定眼影范围和浓淡。"], 6000000, 6000000, "eye"],
  ["lash-line", ["بن‌مژه", "Lash-line enhancement", "تعزيز خط الرموش", "美瞳线"], ["تکنیکی ظریف برای پرتر دیده‌شدن خط مژه.", "A subtle technique to enhance the lash line.", "تقنية دقيقة لإبراز خط الرموش.", "细致勾勒，让睫毛根部更显浓密。"], 5000000, 5000000, "eye"],
  ["brow-removal", ["ریموو ابرو", "Brow pigment removal", "إزالة صبغة الحواجب", "眉部色料去除"], ["هزینه با توجه به وضعیت رنگ و ناحیه پس از معاینه مشخص می‌شود.", "Pricing depends on the pigment and area after assessment.", "تُحدد التكلفة بعد تقييم الصبغة والمنطقة.", "根据色料情况和面积评估费用。"], 12000000, 15000000, "brow"],
  ["training", ["آموزش تخصصی", "Professional training", "تدريب متخصص", "专业培训"], ["جزئیات و هزینهٔ دوره پس از مشاوره اعلام می‌شود.", "Course details and pricing are provided after consultation.", "تُحدد تفاصيل الدورة وتكلفتها بعد الاستشارة.", "课程详情与费用将在咨询后提供。"], 0, 0, "training"],
  ["consultation", ["مشاوره", "Consultation", "استشارة", "咨询"], ["مشاورهٔ اولیه برای انتخاب خدمت مناسب.", "An initial consultation to identify a suitable service.", "استشارة أولية لاختيار الخدمة المناسبة.", "初步咨询，协助选择合适的服务。"], 0, 0, "other"]
].map(([id, names, descriptions, min, max, category]) => ({
  id,
  name: Object.fromEntries(locales.map((locale, index) => [locale, names[index]])),
  description: Object.fromEntries(locales.map((locale, index) => [locale, descriptions[index]])),
  price: { min, max, currency: "TOMAN" },
  category,
  active: true,
  singleSession: !["scalp-micropigmentation", "training", "consultation"].includes(id)
}));
const settingsDefaults = { whatsappPhone: "989178280812", announcement: "", bookingsOpen: true };
const allowedImage = (value) => typeof value === "string" && (/^\/(?:assets\/(?:gallery|videos|news)\/[a-zA-Z0-9._/-]+\.(?:jpe?g|png|webp|mp4|webm))$/.test(value) || /^\/api\/public\/media\/[0-9a-f-]{36}$/.test(value)) && !value.includes("..");
const allowedPortfolioImage = (value) => allowedImage(value) || (typeof value === "string" && /^assets\/(?:gallery|videos)\/[a-zA-Z0-9._/-]+\.(?:jpe?g|png|webp|mp4|webm)$/.test(value) && !value.includes(".."));

function text(value, limit = 2000) {
  return typeof value === "string" ? value.trim().replace(/[\u0000-\u001f\u007f]/g, "").slice(0, limit) : "";
}

function validateLocalizedText(value, maxLength) {
  return value && typeof value === "object" && locales.every((locale) => typeof value[locale] === "string" && value[locale].trim().length <= maxLength && value[locale].trim().length > 0);
}

function validServiceCatalog(value) {
  if (!Array.isArray(value) || value.length !== serviceIds.size) return false;
  const ids = new Set();
  for (const item of value) {
    if (!item || typeof item !== "object" || !serviceIds.has(item.id) || ids.has(item.id)) return false;
    if (!validateLocalizedText(item.name, 120) || !validateLocalizedText(item.description, 1000)) return false;
    if (!serviceCategories.has(item.category) || typeof item.active !== "boolean") return false;
    if (!item.price || !Number.isSafeInteger(item.price.min) || !Number.isSafeInteger(item.price.max) || item.price.min < 0 || item.price.max < item.price.min || item.price.max > 1000000000 || item.price.currency !== "TOMAN") return false;
    ids.add(item.id);
  }
  return ids.size === serviceIds.size;
}

function validPortfolio(value) {
  if (!value || typeof value !== "object" || !Array.isArray(value.projects) || !Array.isArray(value.awards) || !Array.isArray(value.people)) return false;
  if (!Array.isArray(value.categories) || value.categories.length > 20 || value.categories.some((item) => !item || !/^[a-z0-9-]{1,40}$/.test(item.id) || !text(item.label, 80))) return false;
  if (value.projects.length > 100 || value.awards.length > 100 || value.people.length > 100) return false;
  const projectIds = new Set();
  for (const item of value.projects) {
    if (!item || !Number.isSafeInteger(item.id) || item.id < 1 || projectIds.has(item.id) || !portfolioCategories.has(item.category)) return false;
    if (!text(item.title, 160) || !text(item.description, 1200) || !allowedPortfolioImage(item.image) || !allowedPortfolioImage(item.detailImage)) return false;
    projectIds.add(item.id);
  }
  for (const item of value.awards) {
    if (!item || !text(item.title, 160) || !text(item.subtitle, 300) || !allowedPortfolioImage(item.image)) return false;
  }
  for (const item of value.people) {
    if (!item || !text(item.name, 160) || !text(item.category, 120) || !text(item.alt, 300) || !allowedPortfolioImage(item.image) || !/^\/people\/[a-z0-9-]+\/$/.test(item.href)) return false;
  }
  return true;
}

function validSettings(value) {
  return Boolean(value && typeof value === "object"
    && /^\d{10,15}$/.test(String(value.whatsappPhone || ""))
    && typeof value.announcement === "string" && value.announcement.length <= 300
    && typeof value.bookingsOpen === "boolean");
}

function validNewsArticle(slug, value) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120 || !value || typeof value !== "object") return false;
  if (!text(value.title, 160) || !text(value.description, 320) || !text(value.excerpt, 500) || !text(value.lead, 1600)) return false;
  if (!text(value.sourceLabel, 100) || !text(value.sourceTitle, 250) || !/^https:\/\//.test(String(value.sourceUrl || ""))) return false;
  if (!allowedImage(value.image) || !text(value.imageAlt, 300) || !Array.isArray(value.keywords) || value.keywords.length > 12) return false;
  if (!Array.isArray(value.sections) || value.sections.length > 20 || value.sections.some((section) => !text(section.heading, 160) || !Array.isArray(section.paragraphs) || section.paragraphs.length > 10 || section.paragraphs.some((paragraph) => !text(paragraph, 2400)))) return false;
  if (value.translations !== undefined && (!value.translations || typeof value.translations !== "object" || locales.some((locale) => value.translations[locale] && typeof value.translations[locale] !== "object"))) return false;
  return true;
}

async function audit(env, action, targetType, targetId, summary = "") {
  await env.DB.prepare("INSERT INTO cms_audit_log (id, action, target_type, target_id, summary, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), action, targetType, targetId, text(summary, 240), Math.floor(Date.now() / 1000)).run();
}

function articlePayload(row) {
  try { return JSON.parse(row.payload_json); } catch { return {}; }
}

async function adminOverview(request, env, url, json) {
  const now = Math.floor(Date.now() / 1000);
  const maxAge = 90 * 24 * 60 * 60;
  const requestedFrom = Number(url.searchParams.get("from"));
  const requestedTo = Number(url.searchParams.get("to"));
  const from = Number.isSafeInteger(requestedFrom) ? Math.max(now - maxAge, requestedFrom) : now - 30 * 24 * 60 * 60;
  const to = Number.isSafeInteger(requestedTo) ? Math.min(now, requestedTo) : now;
  if (to <= from) return json({ error: "بازهٔ گزارش معتبر نیست." }, 400);
  const [statusRows, serviceRows, dailyRows, smsRows, commentRows] = await Promise.all([
    env.DB.prepare("SELECT status, COUNT(*) AS count FROM bookings WHERE created_at >= ? AND created_at < ? GROUP BY status").bind(from, to + 1).all(),
    env.DB.prepare("SELECT service, COUNT(*) AS count FROM bookings WHERE created_at >= ? AND created_at < ? GROUP BY service ORDER BY count DESC LIMIT 10").bind(from, to + 1).all(),
    env.DB.prepare("SELECT date(created_at, 'unixepoch') AS day, COUNT(*) AS count FROM bookings WHERE created_at >= ? AND created_at < ? GROUP BY day ORDER BY day").bind(from, to + 1).all(),
    env.DB.prepare("SELECT status, COUNT(*) AS count FROM admin_sms_outbox WHERE created_at >= ? AND created_at < ? GROUP BY status").bind(from, to + 1).all(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM news_comments WHERE moderation_status = 'pending'").all()
  ]);
  const byStatus = Object.fromEntries((statusRows.results || []).map((row) => [row.status, Number(row.count) || 0]));
  const total = Object.values(byStatus).reduce((sum, count) => sum + count, 0);
  return json({
    period: { from, to },
    bookings: { total, byStatus, byService: serviceRows.results || [], byDay: dailyRows.results || [], confirmationRate: total ? Math.round(((byStatus.confirmed || 0) + (byStatus.completed || 0)) / total * 100) : 0 },
    notifications: Object.fromEntries((smsRows.results || []).map((row) => [row.status, Number(row.count) || 0])),
    moderation: { pendingComments: Number(commentRows.results?.[0]?.count) || 0 }
  });
}

export async function handleCmsRequest(request, env, helpers) {
  const { json, authenticated, assertSameOrigin, clean } = helpers;
  const url = new URL(request.url);
  const path = url.pathname;
  const requireAdmin = async () => await authenticated(request, env);

  if (path === "/api/admin/overview" && request.method === "GET") {
    if (!await requireAdmin()) return json({ error: "برای مشاهدهٔ گزارش‌ها وارد شوید." }, 401);
    return adminOverview(request, env, url, json);
  }

  const adminContentMatch = path.match(/^\/api\/admin\/content\/(services|portfolio|settings)$/);
  if (adminContentMatch && ["GET", "PUT"].includes(request.method)) {
    if (!await requireAdmin()) return json({ error: "برای مدیریت محتوا وارد شوید." }, 401);
    const kind = adminContentMatch[1];
    if (request.method === "GET") {
      const row = await env.DB.prepare("SELECT payload_json, version, updated_at FROM cms_content WHERE kind = ?").bind(kind).first();
      const fallback = kind === "services" ? serviceDefaults : kind === "settings" ? settingsDefaults : null;
      return json({ content: row ? JSON.parse(row.payload_json) : fallback, version: Number(row?.version) || 0, updatedAt: Number(row?.updated_at) || null });
    }
    if (!assertSameOrigin(request)) return json({ error: "مبدأ درخواست معتبر نیست." }, 403);
    let payload;
    try { payload = await request.json(); } catch { return json({ error: "محتوای ارسالی معتبر نیست." }, 400); }
    const valid = kind === "services" ? validServiceCatalog(payload) : kind === "portfolio" ? validPortfolio(payload) : validSettings(payload);
    if (!valid) return json({ error: "ساختار یا مقادیر محتوا معتبر نیست؛ تغییرات ذخیره نشد." }, 400);
    const now = Math.floor(Date.now() / 1000);
    await env.DB.prepare("INSERT INTO cms_content (kind, payload_json, version, updated_at) VALUES (?, ?, 1, ?) ON CONFLICT(kind) DO UPDATE SET payload_json = excluded.payload_json, version = cms_content.version + 1, updated_at = excluded.updated_at")
      .bind(kind, JSON.stringify(payload), now).run();
    await audit(env, "content.updated", kind, kind, `نسخهٔ جدید محتوای ${kind} ذخیره شد`);
    const row = await env.DB.prepare("SELECT version, updated_at FROM cms_content WHERE kind = ?").bind(kind).first();
    return json({ ok: true, version: Number(row?.version) || 1, updatedAt: Number(row?.updated_at) || now });
  }

  const publicContentMatch = path.match(/^\/api\/public\/content\/(services|portfolio|settings)$/);
  if (publicContentMatch && request.method === "GET") {
    const kind = publicContentMatch[1];
    const row = await env.DB.prepare("SELECT payload_json, updated_at FROM cms_content WHERE kind = ?").bind(kind).first();
    const fallback = kind === "services" ? serviceDefaults : kind === "settings" ? settingsDefaults : null;
    return json({ content: row ? JSON.parse(row.payload_json) : fallback, updatedAt: Number(row?.updated_at) || null });
  }

  if (path === "/api/admin/news" && request.method === "GET") {
    if (!await requireAdmin()) return json({ error: "برای مدیریت خبرها وارد شوید." }, 401);
    const result = await env.DB.prepare("SELECT slug, payload_json, status, created_at, updated_at, published_at FROM cms_news ORDER BY updated_at DESC LIMIT 200").all();
    return json({ articles: (result.results || []).map((row) => ({ slug: row.slug, article: articlePayload(row), status: row.status, createdAt: Number(row.created_at), updatedAt: Number(row.updated_at), publishedAt: Number(row.published_at) || null })) });
  }

  const adminNewsMatch = path.match(/^\/api\/admin\/news\/([a-z0-9-]+)$/);
  if (adminNewsMatch && ["PUT", "PATCH", "DELETE"].includes(request.method)) {
    if (!await requireAdmin()) return json({ error: "برای مدیریت خبرها وارد شوید." }, 401);
    if (!assertSameOrigin(request)) return json({ error: "مبدأ درخواست معتبر نیست." }, 403);
    const slug = adminNewsMatch[1];
    const existing = await env.DB.prepare("SELECT status, created_at FROM cms_news WHERE slug = ?").bind(slug).first();
    const now = Math.floor(Date.now() / 1000);
    if (request.method === "DELETE") {
      if (!existing) return json({ error: "خبر پیدا نشد." }, 404);
      await env.DB.prepare("UPDATE cms_news SET status = 'archived', updated_at = ? WHERE slug = ?").bind(now, slug).run();
      await audit(env, "news.archived", "news", slug, "خبر بایگانی شد");
      return json({ ok: true, status: "archived" });
    }
    let data;
    try { data = await request.json(); } catch { return json({ error: "محتوای ارسالی معتبر نیست." }, 400); }
    if (request.method === "PATCH") {
      if (!existing || !["draft", "published", "archived"].includes(data.status)) return json({ error: "وضعیت خبر معتبر نیست." }, 400);
      await env.DB.prepare("UPDATE cms_news SET status = ?, updated_at = ?, published_at = CASE WHEN ? = 'published' THEN COALESCE(published_at, ?) ELSE published_at END WHERE slug = ?")
        .bind(data.status, now, data.status, now, slug).run();
      await audit(env, `news.${data.status}`, "news", slug, `وضعیت خبر به ${data.status} تغییر کرد`);
      return json({ ok: true, status: data.status });
    }
    const status = data.status === "published" ? "published" : "draft";
    const article = data.article;
    if (!validNewsArticle(slug, article)) return json({ error: "فیلدهای خبر کامل یا معتبر نیستند." }, 400);
    if (status === "published" && locales.some((language) => {
      const localized = language === "fa" ? article : article.translations?.[language];
      return !localized?.title || !localized?.description || !localized?.excerpt || !localized?.lead || !Array.isArray(localized.sections) || !localized.sections.length;
    })) return json({ error: "برای انتشار، متن فارسی و ترجمهٔ کامل انگلیسی، عربی و چینی لازم است." }, 400);
    const serialized = JSON.stringify(article);
    if (serialized.length > 150000) return json({ error: "حجم محتوای خبر بیش از حد مجاز است." }, 413);
    await env.DB.prepare("INSERT INTO cms_news (slug, payload_json, status, created_at, updated_at, published_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(slug) DO UPDATE SET payload_json = excluded.payload_json, status = excluded.status, updated_at = excluded.updated_at, published_at = CASE WHEN excluded.status = 'published' THEN COALESCE(cms_news.published_at, excluded.published_at) ELSE cms_news.published_at END")
      .bind(slug, serialized, status, now, now, status === "published" ? now : null).run();
    await audit(env, existing ? "news.updated" : "news.created", "news", slug, status === "published" ? "خبر ذخیره و منتشر شد" : "پیش‌نویس خبر ذخیره شد");
    return json({ ok: true, slug, status });
  }

  if (path === "/api/public/news" && request.method === "GET") {
    const result = await env.DB.prepare("SELECT slug, payload_json, published_at FROM cms_news WHERE status = 'published' ORDER BY published_at DESC LIMIT 100").all();
    return json({ articles: (result.results || []).map((row) => ({ slug: row.slug, article: articlePayload(row), publishedAt: Number(row.published_at) || null })) });
  }

  const publicNewsMatch = path.match(/^\/api\/public\/news\/([a-z0-9-]+)$/);
  if (publicNewsMatch && request.method === "GET") {
    const row = await env.DB.prepare("SELECT slug, payload_json, published_at FROM cms_news WHERE slug = ? AND status = 'published'").bind(publicNewsMatch[1]).first();
    return row ? json({ slug: row.slug, article: articlePayload(row), publishedAt: Number(row.published_at) || null }) : json({ error: "خبر پیدا نشد." }, 404);
  }

  if (path === "/api/admin/comments" && request.method === "GET") {
    if (!await requireAdmin()) return json({ error: "برای مدیریت دیدگاه‌ها وارد شوید." }, 401);
    const status = url.searchParams.get("status") || "pending";
    if (!["pending", "approved", "rejected", "all"].includes(status)) return json({ error: "فیلتر دیدگاه معتبر نیست." }, 400);
    const result = status === "all"
      ? await env.DB.prepare("SELECT id, article_slug, body, moderation_status, created_at FROM news_comments ORDER BY created_at DESC LIMIT 200").all()
      : await env.DB.prepare("SELECT id, article_slug, body, moderation_status, created_at FROM news_comments WHERE moderation_status = ? ORDER BY created_at DESC LIMIT 200").bind(status).all();
    return json({ comments: result.results || [] });
  }

  const adminCommentMatch = path.match(/^\/api\/admin\/comments\/([\w-]+)$/);
  if (adminCommentMatch && request.method === "PATCH") {
    if (!await requireAdmin()) return json({ error: "برای مدیریت دیدگاه‌ها وارد شوید." }, 401);
    if (!assertSameOrigin(request)) return json({ error: "مبدأ درخواست معتبر نیست." }, 403);
    let data;
    try { data = await request.json(); } catch { return json({ error: "درخواست نامعتبر است." }, 400); }
    if (!["approved", "rejected", "pending"].includes(data.status)) return json({ error: "وضعیت دیدگاه معتبر نیست." }, 400);
    const result = await env.DB.prepare("UPDATE news_comments SET moderation_status = ? WHERE id = ?").bind(data.status, adminCommentMatch[1]).run();
    if (!result.meta?.changes) return json({ error: "دیدگاه پیدا نشد." }, 404);
    await audit(env, `comment.${data.status}`, "comment", adminCommentMatch[1], `وضعیت دیدگاه به ${data.status} تغییر کرد`);
    return json({ ok: true, status: data.status });
  }

  if (path === "/api/admin/activity" && request.method === "GET") {
    if (!await requireAdmin()) return json({ error: "برای مشاهدهٔ سوابق وارد شوید." }, 401);
    const result = await env.DB.prepare("SELECT id, action, target_type, target_id, summary, created_at FROM cms_audit_log ORDER BY created_at DESC LIMIT 100").all();
    return json({ events: result.results || [] });
  }

  if (path === "/api/admin/media" && request.method === "POST") {
    if (!await requireAdmin()) return json({ error: "برای بارگذاری تصویر وارد شوید." }, 401);
    if (!assertSameOrigin(request)) return json({ error: "مبدأ درخواست معتبر نیست." }, 403);
    if (!request.headers.get("Content-Type")?.toLowerCase().startsWith("multipart/form-data;")) return json({ error: "فرمت فایل معتبر نیست." }, 415);
    let form;
    try { form = await request.formData(); } catch { return json({ error: "فرم بارگذاری قابل خواندن نیست." }, 400); }
    const file = form.get("file");
    const alt = text(form.get("alt"), 300);
    if (!file || typeof file.arrayBuffer !== "function" || file.size < 1 || file.size > 1_500_000) return json({ error: "تصویر باید حداکثر ۱٫۵ مگابایت باشد." }, 413);
    if (!alt || form.get("display_consent") !== "yes") return json({ error: "متن جایگزین و تأیید اجازهٔ نمایش عمومی لازم است." }, 400);
    const type = file.type;
    if (!["image/jpeg", "image/png", "image/webp"].includes(type)) return json({ error: "فقط تصویر JPG، PNG یا WebP پذیرفته می‌شود." }, 415);
    const signature = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    const validSignature = type === "image/jpeg"
      ? signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff
      : type === "image/png"
        ? [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => signature[index] === byte)
        : signature[0] === 0x52 && signature[1] === 0x49 && signature[2] === 0x46 && signature[3] === 0x46 && signature[8] === 0x57 && signature[9] === 0x45 && signature[10] === 0x42 && signature[11] === 0x50;
    if (!validSignature) return json({ error: "محتوای فایل با نوع تصویر انتخاب‌شده سازگار نیست." }, 415);
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    await env.DB.prepare("INSERT INTO cms_media (id, content_type, alt_text, image_data, display_consent_at, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(id, type, alt, await file.arrayBuffer(), now, now).run();
    await audit(env, "media.uploaded", "media", id, "تصویر جدید با رضایت نمایش ذخیره شد");
    return json({ ok: true, id, url: `/api/public/media/${id}`, alt }, 201);
  }

  const mediaMatch = path.match(/^\/api\/public\/media\/([0-9a-f-]{36})$/);
  if (mediaMatch && request.method === "GET") {
    const row = await env.DB.prepare("SELECT content_type, image_data FROM cms_media WHERE id = ?").bind(mediaMatch[1]).first();
    const bytes = row?.image_data instanceof ArrayBuffer ? new Uint8Array(row.image_data) : row?.image_data ? Uint8Array.from(row.image_data) : null;
    if (!bytes?.byteLength) return json({ error: "تصویر پیدا نشد." }, 404);
    return new Response(bytes, { headers: { "Content-Type": row.content_type, "Content-Length": String(bytes.byteLength), "Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff", "Cross-Origin-Resource-Policy": "same-origin" } });
  }

  return null;
}

export { serviceDefaults, settingsDefaults, validNewsArticle, validPortfolio, validServiceCatalog };
