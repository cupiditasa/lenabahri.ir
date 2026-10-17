(() => {
  const locale = (document.documentElement.lang || "fa").split("-")[0].toLowerCase();
  const labels = {
    fa: { save: "ذخیره", loading: "در حال بارگذاری…", empty: "موردی پیدا نشد.", name: "نام", description: "توضیح", priceMin: "حداقل قیمت (تومان)", priceMax: "حداکثر قیمت (تومان)", active: "نمایش فعال", image: "مسیر تصویر", detailImage: "مسیر تصویر جزئیات", category: "دسته", title: "عنوان", subtitle: "زیرعنوان", technique: "تکنیک", duration: "مدت", year: "سال", location: "مکان", alt: "متن جایگزین", approved: "تأیید", rejected: "رد", all: "همه", total: "کل درخواست‌ها", confirmed: "تأییدشده/انجام‌شده", rate: "نرخ تأیید", pending: "در انتظار", sent: "ارسال‌شده", failed: "در صف/خطا", missingTranslations: "برای انتشار، متن فارسی و ترجمهٔ کامل انگلیسی، عربی و چینی لازم است." },
    en: { save: "Save", loading: "Loading…", empty: "No items found.", name: "Name", description: "Description", priceMin: "Minimum price (Toman)", priceMax: "Maximum price (Toman)", active: "Visible", image: "Image path", detailImage: "Detail image path", category: "Category", title: "Title", subtitle: "Subtitle", technique: "Technique", duration: "Duration", year: "Year", location: "Location", alt: "Alternative text", approved: "Approve", rejected: "Reject", all: "All requests", total: "Total requests", confirmed: "Confirmed/completed", rate: "Confirmation rate", pending: "Pending", sent: "Sent", failed: "Queued/failed", missingTranslations: "Publishing requires complete Persian, English, Arabic, and Chinese content." },
    ar: { save: "حفظ", loading: "جارٍ التحميل…", empty: "لا توجد عناصر.", name: "الاسم", description: "الوصف", priceMin: "الحد الأدنى للسعر (تومان)", priceMax: "الحد الأقصى للسعر (تومان)", active: "ظاهر", image: "مسار الصورة", detailImage: "مسار الصورة التفصيلية", category: "الفئة", title: "العنوان", subtitle: "العنوان الفرعي", technique: "التقنية", duration: "المدة", year: "السنة", location: "المكان", alt: "النص البديل", approved: "موافقة", rejected: "رفض", all: "جميع الطلبات", total: "إجمالي الطلبات", confirmed: "مؤكد/مكتمل", rate: "نسبة التأكيد", pending: "قيد الانتظار", sent: "أُرسل", failed: "قيد الانتظار/فشل", missingTranslations: "يتطلب النشر محتوى كاملاً بالفارسية والإنجليزية والعربية والصينية." },
    zh: { save: "保存", loading: "正在加载…", empty: "未找到内容。", name: "名称", description: "说明", priceMin: "最低价格（Toman）", priceMax: "最高价格（Toman）", active: "显示", image: "图片路径", detailImage: "详情图片路径", category: "类别", title: "标题", subtitle: "副标题", technique: "技术", duration: "时长", year: "年份", location: "地点", alt: "替代文本", approved: "批准", rejected: "拒绝", all: "全部申请", total: "申请总数", confirmed: "已确认/已完成", rate: "确认率", pending: "待处理", sent: "已发送", failed: "排队/失败", missingTranslations: "发布前需完成波斯语、英语、阿拉伯语和中文内容。" }
  }[locale] || {};
  const byId = (id) => document.getElementById(id);
  const make = (tag, className, value) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value !== undefined) element.textContent = value;
    return element;
  };
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const currencyLocale = { fa: "fa-IR-u-nu-arabext", en: "en-US", ar: "ar", zh: "zh-CN" }[locale] || "fa-IR";
  const statusText = { pending: labels.pending || "در انتظار", contacted: "تماس گرفته شد", confirmed: "تأیید شد", completed: "انجام شد", cancelled: "لغو شد" };
  let services = [];
  let portfolio = null;
  let newsEntries = [];
  let currentArticle = null;
  let activeNewsLocale = "fa";
  const tabs = [...document.querySelectorAll("[data-admin-tab]")];
  const views = [...document.querySelectorAll("[data-admin-panel]")];
  const loadedViews = new Set();
  const reportFrom = byId("reportFrom");
  const reportTo = byId("reportTo");
  const reportDate = new Date();
  const toDateInput = (date) => date.toISOString().slice(0, 10);
  if (reportTo && !reportTo.value) reportTo.value = toDateInput(reportDate);
  if (reportFrom && !reportFrom.value) reportFrom.value = toDateInput(new Date(reportDate.getTime() - 29 * 86400000));
  const reportColumns = byId("serviceReport")?.parentElement?.parentElement;
  const dailySection = make("section");
  dailySection.append(make("h3", "", "درخواست‌های روزانه"));
  const dailyReport = make("div", "report-list");
  dailyReport.id = "dailyReport";
  dailySection.append(dailyReport);
  reportColumns?.append(dailySection);

  async function api(path, options = {}) {
    const headers = { ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}), ...options.headers };
    const response = await fetch(path, { ...options, headers, credentials: "same-origin", cache: "no-store" });
    const body = response.headers.get("content-type")?.includes("application/json") ? await response.json().catch(() => ({})) : {};
    if (!response.ok) {
      if (response.status === 401) window.location.reload();
      throw new Error(body.error || `HTTP ${response.status}`);
    }
    return body;
  }

  function showFeedback(id, message = "") {
    const target = byId(id);
    if (target) target.textContent = message;
  }

  function addField(container, labelText, value, attributes = {}) {
    const label = make("label", "cms-locale-field");
    label.append(make("span", "", labelText));
    const field = make(attributes.multiline ? "textarea" : "input");
    if (!attributes.multiline) field.type = attributes.type || "text";
    field.value = value ?? "";
    if (attributes.maxlength) field.maxLength = attributes.maxlength;
    if (attributes.min !== undefined) field.min = String(attributes.min);
    if (attributes.step) field.step = String(attributes.step);
    if (attributes.checked !== undefined) field.checked = attributes.checked;
    for (const [key, item] of Object.entries(attributes.dataset || {})) field.dataset[key] = item;
    label.append(field);
    container.append(label);
    return field;
  }

  async function loadOverview() {
    const feedback = "reportFeedback";
    showFeedback(feedback, labels.loading || "در حال بارگذاری…");
    try {
      const fromValue = byId("reportFrom").value;
      const toValue = byId("reportTo").value;
      const from = Math.floor(new Date(`${fromValue}T00:00:00Z`).getTime() / 1000);
      const to = Math.floor(new Date(`${toValue}T23:59:59Z`).getTime() / 1000);
      const result = await api(`/api/admin/overview?from=${from}&to=${to}`);
      const summary = byId("reportSummary");
      summary.replaceChildren();
      const total = result.bookings.total || 0;
      const metrics = [
        [labels.total || "کل درخواست‌ها", total],
        [statusText.pending, result.bookings.byStatus.pending || 0],
        [labels.confirmed || "تأییدشده/انجام‌شده", (result.bookings.byStatus.confirmed || 0) + (result.bookings.byStatus.completed || 0)],
        [labels.rate || "نرخ تأیید", `${result.bookings.confirmationRate}%`],
        [labels.pending || "دیدگاه‌های منتظر بررسی", result.moderation.pendingComments || 0]
      ];
      for (const [title, value] of metrics) {
        const item = make("div", "summary-item");
        item.append(make("span", "", title), make("b", "", new Intl.NumberFormat(currencyLocale).format(value)));
        summary.append(item);
      }
      const serviceReport = byId("serviceReport");
      serviceReport.replaceChildren();
      const maxCount = Math.max(1, ...(result.bookings.byService || []).map((item) => Number(item.count)));
      for (const item of result.bookings.byService || []) {
        const row = make("div", "report-row");
        const service = services.find((entry) => entry.id === item.service);
        row.append(make("span", "", service?.name?.[locale] || service?.name?.fa || item.service));
        const meter = document.createElement("meter");
        meter.min = 0;
        meter.max = maxCount;
        meter.value = Number(item.count) || 0;
        row.append(meter, make("b", "", String(item.count)));
        serviceReport.append(row);
      }
      dailyReport.replaceChildren();
      const recentDays = (result.bookings.byDay || []).slice(-14);
      const maxDailyCount = Math.max(1, ...recentDays.map((item) => Number(item.count) || 0));
      if (!recentDays.length) dailyReport.append(make("p", "cms-muted", labels.empty || "موردی پیدا نشد."));
      for (const item of recentDays) {
        const row = make("div", "report-row");
        const date = new Date(`${item.day}T00:00:00Z`);
        const dateLocale = { fa: "fa-IR-u-ca-persian", en: "en-US", ar: "ar", zh: "zh-CN" }[locale] || "fa-IR-u-ca-persian";
        row.append(make("span", "", date.toLocaleDateString(dateLocale, { month: "short", day: "numeric" })));
        const meter = document.createElement("meter");
        meter.min = 0;
        meter.max = maxDailyCount;
        meter.value = Number(item.count) || 0;
        row.append(meter, make("b", "", String(item.count)));
        dailyReport.append(row);
      }
      const smsReport = byId("smsReport");
      smsReport.replaceChildren();
      const notifications = result.notifications || {};
      for (const [key, label] of [["sent", labels.sent || "ارسال‌شده"], ["pending", labels.failed || "در صف/خطا"]]) {
        const row = make("div", "report-row");
        row.append(make("span", "", label), make("span", ""), make("b", "", String(notifications[key] || 0)));
        smsReport.append(row);
      }
      byId("moderationSummary").textContent = `دیدگاه‌های نیازمند بررسی: ${result.moderation.pendingComments || 0}`;
      showFeedback(feedback);
    } catch (error) { showFeedback(feedback, error.message); }
  }

  function servicePriceInput(row, service, field, label) {
    return addField(row, label, service.price[field], { type: "number", min: 0, step: 500000, dataset: { serviceIndex: String(services.indexOf(service)), price: field } });
  }

  function renderServices() {
    const root = byId("serviceEditor");
    root.replaceChildren();
    for (const [index, service] of services.entries()) {
      const details = make("details", "cms-row");
      const summary = make("summary");
      summary.append(make("span", "", service.name?.[locale] || service.name?.fa || service.id), make("small", "", service.id));
      details.append(summary);
      const prices = make("div", "cms-grid");
      addField(prices, labels.priceMin || "حداقل قیمت (تومان)", service.price.min, { type: "number", min: 0, step: 500000, dataset: { serviceIndex: String(index), price: "min" } });
      addField(prices, labels.priceMax || "حداکثر قیمت (تومان)", service.price.max, { type: "number", min: 0, step: 500000, dataset: { serviceIndex: String(index), price: "max" } });
      const activeLabel = make("label", "cms-check");
      const active = document.createElement("input");
      active.type = "checkbox";
      active.checked = service.active !== false;
      active.dataset.serviceIndex = String(index);
      active.dataset.active = "true";
      activeLabel.append(active, make("span", "", labels.active || "نمایش فعال"));
      prices.append(activeLabel);
      details.append(prices);
      for (const language of ["fa", "en", "ar", "zh"]) {
        const group = make("div", "cms-locale");
        group.append(make("span", "cms-muted", language));
        addField(group, labels.name || "نام", service.name[language], { maxlength: 120, dataset: { serviceIndex: String(index), localizedField: "name", language } });
        addField(group, labels.description || "توضیح", service.description[language], { multiline: true, maxlength: 1000, dataset: { serviceIndex: String(index), localizedField: "description", language } });
        details.append(group);
      }
      root.append(details);
    }
  }

  async function loadServices() {
    showFeedback("servicesFeedback", labels.loading || "در حال بارگذاری…");
    try {
      const result = await api("/api/admin/content/services");
      services = result.content || [];
      renderServices();
      showFeedback("servicesFeedback");
    } catch (error) { showFeedback("servicesFeedback", error.message); }
  }

  async function saveServices() {
    const updated = clone(services);
    for (const field of byId("serviceEditor").querySelectorAll("[data-service-index]")) {
      const item = updated[Number(field.dataset.serviceIndex)];
      if (!item) continue;
      if (field.dataset.price) item.price[field.dataset.price] = Number(field.value) || 0;
      else if (field.dataset.active) item.active = field.checked;
      else if (field.dataset.localizedField) item[field.dataset.localizedField][field.dataset.language] = field.value.trim();
    }
    showFeedback("servicesFeedback", labels.loading || "در حال ذخیره…");
    try {
      const result = await api("/api/admin/content/services", { method: "PUT", body: JSON.stringify(updated) });
      services = updated;
      showFeedback("servicesFeedback", `ذخیره شد · نسخهٔ ${result.version}`);
    } catch (error) { showFeedback("servicesFeedback", error.message); }
  }

  function translatedValue(item, field, language) {
    return language === "fa" ? item[field] || "" : item.translations?.[language]?.[field] || "";
  }

  function renderPortfolio() {
    const root = byId("portfolioEditor");
    root.replaceChildren();
    const groups = [
      ["projects", "نمونه‌کارها", ["title", "subtitle", "category", "description", "technique", "duration", "image", "detailImage"], true],
      ["awards", "افتخارات و مدارک", ["title", "subtitle", "year", "location", "image"], false],
      ["people", "دیدارها و برندها", ["name", "category", "alt", "image", "href"], false]
    ];
    for (const [key, heading, fields, translatable] of groups) {
      root.append(make("h3", "", heading));
      for (const [index, item] of (portfolio[key] || []).entries()) {
        const details = make("details", "cms-row");
        const summary = make("summary");
        const primaryName = item.title || item.name || "";
        summary.append(make("span", "", primaryName), make("small", "", `${key} · ${item.id ?? index + 1}`));
        details.append(summary);
        const fieldsGrid = make("div", "cms-grid");
        for (const field of fields) {
          const value = item[field] ?? "";
          const input = addField(fieldsGrid, labels[field] || field, value, { multiline: field === "description", maxlength: field === "description" ? 1200 : 500, dataset: { group: key, itemIndex: String(index), portfolioField: field } });
          if (field === "category" && key === "projects") {
            const select = document.createElement("select");
            select.value = value;
            select.dataset.group = key;
            select.dataset.itemIndex = String(index);
            select.dataset.portfolioField = field;
            for (const category of ["brow", "lip", "eye", "scalp", "academy"]) {
              const option = document.createElement("option");
              option.value = category;
              option.textContent = category;
              option.selected = category === value;
              select.append(option);
            }
            input.replaceWith(select);
          }
        }
        const visibleLabel = make("label", "cms-check");
        const visible = document.createElement("input");
        visible.type = "checkbox";
        visible.checked = item.active !== false;
        visible.dataset.group = key;
        visible.dataset.itemIndex = String(index);
        visible.dataset.portfolioActive = "true";
        visibleLabel.append(visible, make("span", "", labels.active || "نمایش فعال"));
        fieldsGrid.append(visibleLabel);
        details.append(fieldsGrid);
        if (translatable) {
          for (const language of ["fa", "en", "ar", "zh"]) {
            const group = make("div", "cms-locale");
            group.append(make("span", "cms-muted", language));
            for (const field of ["title", "subtitle", "description"]) {
              addField(group, labels[field] || field, translatedValue(item, field, language), { multiline: field === "description", maxlength: field === "description" ? 1200 : 500, dataset: { group: key, itemIndex: String(index), localizedField: field, language } });
            }
            details.append(group);
          }
        }
        root.append(details);
      }
    }
  }

  async function loadPortfolio() {
    showFeedback("portfolioFeedback", labels.loading || "در حال بارگذاری…");
    try {
      const result = await api("/api/admin/content/portfolio");
      portfolio = clone(result.content || window.LENA_GALLERY);
      renderPortfolio();
      showFeedback("portfolioFeedback");
    } catch (error) { showFeedback("portfolioFeedback", error.message); }
  }

  async function savePortfolio() {
    const updated = clone(portfolio);
    for (const field of byId("portfolioEditor").querySelectorAll("[data-item-index]")) {
      const item = updated[field.dataset.group]?.[Number(field.dataset.itemIndex)];
      if (!item) continue;
      if (field.dataset.portfolioActive) item.active = field.checked;
      else if (field.dataset.localizedField) {
        const language = field.dataset.language;
        if (language === "fa") item[field.dataset.localizedField] = field.value.trim();
        else {
          item.translations ||= {};
          item.translations[language] ||= {};
          item.translations[language][field.dataset.localizedField] = field.value.trim();
        }
      } else if (field.dataset.portfolioField) item[field.dataset.portfolioField] = field.value.trim();
    }
    showFeedback("portfolioFeedback", labels.loading || "در حال ذخیره…");
    try {
      const result = await api("/api/admin/content/portfolio", { method: "PUT", body: JSON.stringify(updated) });
      portfolio = updated;
      showFeedback("portfolioFeedback", `گالری ذخیره شد · نسخهٔ ${result.version}`);
    } catch (error) { showFeedback("portfolioFeedback", error.message); }
  }

  async function uploadMedia(event) {
    event.preventDefault();
    const form = byId("mediaUpload");
    const formData = new FormData(form);
    if (!formData.has("display_consent")) formData.set("display_consent", "no");
    showFeedback("mediaResult", labels.loading || "در حال بارگذاری…");
    try {
      const result = await api("/api/admin/media", { method: "POST", body: formData });
      showFeedback("mediaResult", `${result.url} · ${result.alt}`);
      form.reset();
    } catch (error) { showFeedback("mediaResult", error.message); }
  }

  async function readLegacyNews() {
    const [baseResponse, extraResponse] = await Promise.all([fetch("/data/beauty-news.json"), fetch("/data/beauty-news-extra.json")]);
    const base = baseResponse.ok ? await baseResponse.json() : { articles: [] };
    const extra = extraResponse.ok ? await extraResponse.json() : {};
    const overrides = extra.articleOverrides || {};
    const sources = extra.sourceOverrides || {};
    const articles = (base.articles || []).map((article) => ({ slug: article.slug, article, status: "published", source: "static" }));
    for (const raw of extra.articles || []) {
      const article = { ...raw, ...(overrides[raw.slug] || {}), ...(overrides[`${raw.slug}-content`] || {}), ...(sources[raw.sourceUrl] || {}) };
      const sections = article.sections || [
        { heading: article.sourceHeading || "منبع", paragraphs: [article.sourceSummary || ""] },
        { heading: article.editorHeading || "یادداشت تحریریه", paragraphs: [article.editorialTake || ""] }
      ];
      article.sections = sections;
      articles.push({ slug: article.slug, article, status: (extra.publicationOverrides?.[raw.slug] ?? raw.published) ? "published" : "draft", source: "static" });
    }
    return articles;
  }

  async function loadNews() {
    const root = byId("newsList");
    root.replaceChildren(make("p", "cms-muted", labels.loading || "در حال بارگذاری…"));
    try {
      const [legacy, current] = await Promise.all([readLegacyNews(), api("/api/admin/news")]);
      const combined = new Map(legacy.map((entry) => [entry.slug, entry]));
      for (const item of current.articles || []) combined.set(item.slug, { ...item, source: "cms" });
      newsEntries = [...combined.values()].sort((left, right) => (left.status === "published" ? 0 : 1) - (right.status === "published" ? 0 : 1) || (left.article.title || "").localeCompare(right.article.title || "", locale));
      renderNewsList();
      showFeedback("newsFeedback");
    } catch (error) { showFeedback("newsFeedback", error.message); root.replaceChildren(make("p", "cms-muted", error.message)); }
  }

  function renderNewsList() {
    const root = byId("newsList");
    const query = byId("newsSearch").value.trim().toLowerCase();
    root.replaceChildren();
    const found = newsEntries.filter((entry) => `${entry.slug} ${entry.article.title || ""}`.toLowerCase().includes(query));
    if (!found.length) root.append(make("p", "cms-muted", labels.empty || "موردی پیدا نشد."));
    for (const entry of found) {
      const button = make("button", "news-pick");
      button.type = "button";
      button.dataset.slug = entry.slug;
      button.setAttribute("aria-current", String(currentArticle?.slug === entry.slug));
      button.append(make("strong", "", entry.article.title || entry.slug), make("small", "", `${entry.slug} · ${entry.status === "published" ? "منتشرشده" : "پیش‌نویس"}${entry.source === "cms" ? " · CMS" : " · صفحهٔ ایستا"}`));
      button.addEventListener("click", () => selectArticle(entry));
      root.append(button);
    }
  }

  function renderSections(sections = []) {
    const root = byId("newsSections");
    root.replaceChildren();
    for (const [index, section] of sections.entries()) addNewsSection(section, index);
  }

  function addNewsSection(section = { heading: "", paragraphs: [""] }, index = byId("newsSections").children.length) {
    const box = make("div", "news-section-fields");
    box.dataset.sectionIndex = String(index);
    addField(box, "عنوان بخش", section.heading || "", { maxlength: 160, dataset: { sectionField: "heading" } });
    addField(box, "متن بخش", (section.paragraphs || []).join("\n\n"), { multiline: true, maxlength: 8000, dataset: { sectionField: "paragraphs" } });
    const remove = make("button", "quiet-button", "حذف بخش");
    remove.type = "button";
    remove.addEventListener("click", () => box.remove());
    box.append(remove);
    byId("newsSections").append(box);
  }

  function setNewsFields(article, language = "fa") {
    const translated = language === "fa" ? article : article.translations?.[language] || {};
    const fields = byId("newsForm").elements;
    fields.slug.value = currentArticle?.slug || "";
    for (const key of ["title", "metaTitle", "description", "excerpt", "lead"]) fields[key].value = translated[key] || (language === "fa" ? article[key] || "" : "");
    for (const key of ["category", "keywords", "sourceLabel", "sourceTitle", "sourceUrl", "image", "imageAlt"]) {
      fields[key].value = language !== "fa" && ["sourceLabel", "sourceTitle", "sourceUrl", "image", "imageAlt"].includes(key) ? article[key] || "" : article[key] || "";
      fields[key].disabled = language !== "fa";
    }
    renderSections(translated.sections || (language === "fa" ? article.sections : []));
  }

  function selectArticle(entry) {
    currentArticle = { slug: entry.slug, status: entry.status, source: entry.source, article: clone(entry.article) };
    const form = byId("newsForm");
    form.hidden = false;
    form.elements.slug.readOnly = entry.source === "static";
    form.elements.category.value ||= "trends";
    byId("newsLocale").value = "fa";
    activeNewsLocale = "fa";
    setNewsFields(currentArticle.article, "fa");
    renderNewsList();
  }

  function syncCurrentArticle(language) {
    if (!currentArticle) return;
    const form = byId("newsForm");
    const fields = form.elements;
    const localized = language === "fa" ? currentArticle.article : (currentArticle.article.translations ||= {})[language] ||= {};
    for (const key of ["title", "metaTitle", "description", "excerpt", "lead"]) localized[key] = fields[key].value.trim();
    if (language === "fa") {
      for (const key of ["category", "sourceLabel", "sourceTitle", "sourceUrl", "image", "imageAlt"]) currentArticle.article[key] = fields[key].value.trim();
      currentArticle.article.keywords = fields.keywords.value.split(",").map((keyword) => keyword.trim()).filter(Boolean).slice(0, 12);
    }
    localized.sections = [...byId("newsSections").querySelectorAll(".news-section-fields")].map((box) => ({
      heading: box.querySelector('[data-section-field="heading"]').value.trim(),
      paragraphs: box.querySelector('[data-section-field="paragraphs"]').value.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean)
    }));
  }

  function newArticle() {
    const slug = `beauty-story-${Date.now().toString(36)}`;
    const article = { slug, title: "", metaTitle: "", description: "", excerpt: "", lead: "", category: "trends", keywords: [], sourceLabel: "", sourceTitle: "", sourceUrl: "", image: "", imageAlt: "", sourceDate: new Date().toISOString().slice(0, 10), readingTime: 4, sections: [{ heading: "", paragraphs: [""] }], translations: {} };
    selectArticle({ slug, article, status: "draft", source: "cms" });
    byId("newsForm").elements.slug.readOnly = false;
  }

  async function saveArticle(event) {
    event.preventDefault();
    if (!currentArticle) return;
    const language = byId("newsLocale").value;
    syncCurrentArticle(language);
    const form = byId("newsForm");
    const slug = form.elements.slug.value.trim();
    const status = event.submitter?.value === "published" ? "published" : "draft";
    if (status === "published") {
      const languages = ["fa", "en", "ar", "zh"];
      const complete = languages.every((code) => {
        const value = code === "fa" ? currentArticle.article : currentArticle.article.translations?.[code];
        return value?.title && value?.description && value?.excerpt && value?.lead && value?.sections?.length;
      });
      if (!complete) { showFeedback("newsFeedback", labels.missingTranslations); return; }
    }
    showFeedback("newsFeedback", labels.loading || "در حال ذخیره…");
    try {
      await api(`/api/admin/news/${encodeURIComponent(slug)}`, { method: "PUT", body: JSON.stringify({ article: currentArticle.article, status }) });
      currentArticle.slug = slug;
      currentArticle.status = status;
      currentArticle.source = "cms";
      showFeedback("newsFeedback", status === "published" ? "خبر منتشر شد؛ نشانی نسخه‌های زبانی ساخته شد." : "پیش‌نویس ذخیره شد.");
      await loadNews();
      currentArticle = { ...currentArticle, slug };
      renderNewsList();
    } catch (error) { showFeedback("newsFeedback", error.message); }
  }

  async function loadComments() {
    const root = byId("commentsList");
    root.replaceChildren(make("p", "cms-muted", labels.loading || "در حال بارگذاری…"));
    try {
      const result = await api(`/api/admin/comments?status=${encodeURIComponent(byId("commentFilter").value)}`);
      root.replaceChildren();
      if (!result.comments.length) root.append(make("p", "cms-muted", labels.empty || "موردی پیدا نشد."));
      for (const comment of result.comments) {
        const card = make("article", "cms-row");
        card.append(make("small", "cms-muted", `${comment.article_slug} · ${new Date(comment.created_at * 1000).toLocaleString(currencyLocale)}`), make("p", "comment-body", comment.body));
        const actions = make("div", "comment-actions");
        for (const [status, text] of [["approved", labels.approved || "تأیید"], ["rejected", labels.rejected || "رد"]]) {
          const button = make("button", "quiet-button", text);
          button.type = "button";
          button.addEventListener("click", async () => {
            button.disabled = true;
            try { await api(`/api/admin/comments/${encodeURIComponent(comment.id)}`, { method: "PATCH", body: JSON.stringify({ status }) }); await loadComments(); }
            catch (error) { showFeedback("commentsFeedback", error.message); button.disabled = false; }
          });
          actions.append(button);
        }
        card.append(actions);
        root.append(card);
      }
      showFeedback("commentsFeedback");
    } catch (error) { showFeedback("commentsFeedback", error.message); root.replaceChildren(make("p", "cms-muted", error.message)); }
  }

  async function loadSettings() {
    try {
      const result = await api("/api/admin/content/settings");
      const form = byId("settingsForm");
      form.elements.whatsappPhone.value = result.content.whatsappPhone;
      form.elements.announcement.value = result.content.announcement || "";
      form.elements.bookingsOpen.checked = result.content.bookingsOpen !== false;
    } catch (error) { showFeedback("settingsFeedback", error.message); }
  }

  async function saveSettings(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const content = { whatsappPhone: form.elements.whatsappPhone.value.replace(/\D/g, ""), announcement: form.elements.announcement.value.trim(), bookingsOpen: form.elements.bookingsOpen.checked };
    try {
      const result = await api("/api/admin/content/settings", { method: "PUT", body: JSON.stringify(content) });
      showFeedback("settingsFeedback", `تنظیمات ذخیره شد · نسخهٔ ${result.version}`);
    } catch (error) { showFeedback("settingsFeedback", error.message); }
  }

  async function loadActivity() {
    try {
      const result = await api("/api/admin/activity");
      const root = byId("activityList");
      root.replaceChildren();
      if (!result.events.length) root.append(make("p", "cms-muted", labels.empty || "موردی پیدا نشد."));
      for (const event of result.events) {
        const row = make("article", "cms-row activity-row");
        row.append(make("span", "", `${event.summary} · ${event.target_type}/${event.target_id}`), make("small", "cms-muted", new Date(event.created_at * 1000).toLocaleString(currencyLocale)));
        root.append(row);
      }
      showFeedback("activityFeedback");
    } catch (error) { showFeedback("activityFeedback", error.message); }
  }

  async function activate(name) {
    for (const button of tabs) button.setAttribute("aria-selected", String(button.dataset.adminTab === name));
    for (const view of views) view.hidden = view.dataset.adminPanel !== name;
    if (loadedViews.has(name)) return;
    loadedViews.add(name);
    if (name === "overview") { await loadServices(); await loadOverview(); }
    if (name === "services") await loadServices();
    if (name === "portfolio") await loadPortfolio();
    if (name === "news") await loadNews();
    if (name === "comments") await loadComments();
    if (name === "settings") await loadSettings();
    if (name === "activity") await loadActivity();
  }

  for (const button of tabs) button.addEventListener("click", () => { void activate(button.dataset.adminTab); });
  byId("loadReport").addEventListener("click", () => { loadedViews.delete("overview"); void loadOverview(); });
  byId("saveServices").addEventListener("click", saveServices);
  byId("savePortfolio").addEventListener("click", savePortfolio);
  byId("mediaUpload").addEventListener("submit", uploadMedia);
  byId("newsSearch").addEventListener("input", renderNewsList);
  byId("newArticle").addEventListener("click", newArticle);
  byId("newsForm").addEventListener("submit", saveArticle);
  byId("newsLocale").addEventListener("change", (event) => {
    if (!currentArticle) return;
    syncCurrentArticle(activeNewsLocale);
    activeNewsLocale = event.target.value;
    setNewsFields(currentArticle.article, event.target.value);
  });
  byId("addNewsSection").addEventListener("click", () => addNewsSection());
  byId("commentFilter").addEventListener("change", loadComments);
  byId("settingsForm").addEventListener("submit", saveSettings);
  for (const input of [byId("reportFrom"), byId("reportTo")]) input.value = new Date().toISOString().slice(0, 10);
  const firstDay = new Date();
  firstDay.setDate(firstDay.getDate() - 29);
  byId("reportFrom").value = firstDay.toISOString().slice(0, 10);
  window.addEventListener("lena:admin-ready", () => { loadedViews.delete("overview"); void activate("overview"); });
})();
