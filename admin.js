if (!window.LenaLocale) {
  const localeLoader = document.createElement("script");
  localeLoader.src = "/assets/site-locale.js";
  localeLoader.defer = true;
  document.head.append(localeLoader);
}

const loginPanel = document.querySelector("#loginPanel");
const dashboard = document.querySelector("#dashboard");
const loginForm = document.querySelector("#loginForm");
const loginFeedback = document.querySelector("#loginFeedback");
const dashboardFeedback = document.querySelector("#dashboardFeedback");
const bookingList = document.querySelector("#bookingList");
const summary = document.querySelector("#summary");
const statusFilter = document.querySelector("#statusFilter");
const searchInput = document.querySelector("#searchInput");
const bookingPageSize = 50;
let bookingOffset = 0;
let bookingTotal = 0;
const bookingToolbar = document.querySelector(".toolbar");
const bookingDateFilter = document.createElement("div");
bookingDateFilter.className = "booking-date-filter";
const bookingFrom = document.createElement("input");
bookingFrom.type = "date";
bookingFrom.setAttribute("aria-label", "از تاریخ");
const bookingTo = document.createElement("input");
bookingTo.type = "date";
bookingTo.setAttribute("aria-label", "تا تاریخ");
const bookingFromLabel = document.createElement("label");
bookingFromLabel.append(document.createTextNode("از "), bookingFrom);
const bookingToLabel = document.createElement("label");
bookingToLabel.append(document.createTextNode("تا "), bookingTo);
bookingDateFilter.append(bookingFromLabel, bookingToLabel);
const exportBookingsButton = document.createElement("button");
exportBookingsButton.className = "quiet-button";
exportBookingsButton.type = "button";
exportBookingsButton.textContent = "دریافت CSV";
bookingToolbar.append(bookingDateFilter, exportBookingsButton);
const bookingPager = document.createElement("div");
bookingPager.className = "booking-pager";
const previousBookingsButton = document.createElement("button");
previousBookingsButton.className = "quiet-button";
previousBookingsButton.type = "button";
previousBookingsButton.textContent = "قبلی";
const bookingPageLabel = document.createElement("span");
const nextBookingsButton = document.createElement("button");
nextBookingsButton.className = "quiet-button";
nextBookingsButton.type = "button";
nextBookingsButton.textContent = "بعدی";
bookingPager.append(previousBookingsButton, bookingPageLabel, nextBookingsButton);
bookingList.before(bookingPager);
const adminLocale = (document.documentElement.lang || "fa").split("-")[0].toLowerCase();
const adminCopy = {
  fa: {
    all: "همهٔ درخواست‌ها", phone: "شماره تماس", service: "خدمت", payment: "نحوهٔ پرداخت", notes: "توضیحات",
    changeStatus: "تغییر وضعیت درخواست", privatePhoto: "مشاهدهٔ عکس خصوصی", loading: "در حال دریافت درخواست‌ها…",
    empty: "درخواستی برای این فیلتر پیدا نشد.", recent: "۲۰۰ درخواست اخیر نمایش داده شده‌اند؛ برای دیدن مورد خاص جست‌وجو کنید.",
    connection: "ارتباط با سامانه برقرار نشد.", session: "نشست مدیریت پایان یافته؛ دوباره وارد شوید."
  },
  en: {
    all: "All requests", phone: "Phone", service: "Service", payment: "Payment method", notes: "Notes",
    changeStatus: "Change request status", privatePhoto: "View private photo", loading: "Loading requests…",
    empty: "No requests match this filter.", recent: "Showing the 200 most recent requests. Search to find a specific request.",
    connection: "Could not connect to the booking service.", session: "Your admin session has expired. Please sign in again."
  },
  ar: {
    all: "كل الطلبات", phone: "رقم الهاتف", service: "الخدمة", payment: "طريقة الدفع", notes: "ملاحظات",
    changeStatus: "تغيير حالة الطلب", privatePhoto: "عرض الصورة الخاصة", loading: "جارٍ تحميل الطلبات…",
    empty: "لا توجد طلبات تطابق هذا الفلتر.", recent: "تُعرض أحدث 200 طلب. ابحثي للعثور على طلب محدد.",
    connection: "تعذّر الاتصال بنظام الحجوزات.", session: "انتهت جلسة الإدارة. يرجى تسجيل الدخول مجدداً."
  },
  zh: {
    all: "所有申请", phone: "电话", service: "服务项目", payment: "付款方式", notes: "备注",
    changeStatus: "更改申请状态", privatePhoto: "查看私密照片", loading: "正在加载申请…",
    empty: "没有符合此筛选条件的申请。", recent: "显示最近 200 条申请。请搜索以查找特定申请。",
    connection: "无法连接预约服务。", session: "管理员登录已过期，请重新登录。"
  }
}[adminLocale] || {
  all: "همهٔ درخواست‌ها", phone: "شماره تماس", service: "خدمت", payment: "نحوهٔ پرداخت", notes: "توضیحات",
  changeStatus: "تغییر وضعیت درخواست", privatePhoto: "مشاهدهٔ عکس خصوصی", loading: "در حال دریافت درخواست‌ها…",
  empty: "درخواستی برای این فیلتر پیدا نشد.", recent: "۲۰۰ درخواست اخیر نمایش داده شده‌اند؛ برای دیدن مورد خاص جست‌وجو کنید.",
  connection: "ارتباط با سامانه برقرار نشد.", session: "نشست مدیریت پایان یافته؛ دوباره وارد شوید."
};
const statusLabels = {
  fa: ["در انتظار", "تماس گرفته شد", "تأیید شد", "انجام شد", "لغو شد"],
  en: ["Pending", "Contacted", "Confirmed", "Completed", "Cancelled"],
  ar: ["قيد الانتظار", "تم التواصل", "تم التأكيد", "مكتمل", "ملغي"],
  zh: ["待处理", "已联系", "已确认", "已完成", "已取消"]
}[adminLocale] || ["در انتظار", "تماس گرفته شد", "تأیید شد", "انجام شد", "لغو شد"];
const statuses = new Map(["pending", "contacted", "confirmed", "completed", "cancelled"].map((key, index) => [key, statusLabels[index]]));
const paymentLabels = new Map([
  ["cash", { fa: "پرداخت نقدی و حضوری", en: "Cash payment (in person)", ar: "الدفع نقداً في الاستوديو", zh: "到店现金付款" }[adminLocale] || "پرداخت نقدی و حضوری"],
  ["consult", { fa: "درخواست مشاوره", en: "Consultation request", ar: "طلب استشارة", zh: "咨询申请" }[adminLocale] || "درخواست مشاوره"]
]);
const serviceNames = {
  microblading: ["میکروبلدینگ ابرو (فیبروز)", "Eyebrow microblading (PhiBrows)", "مايكروبليدنج الحواجب (PhiBrows)", "眉部微雕（PhiBrows）"],
  hairstroke: ["هیراستروک ابرو", "Eyebrow hairstrokes", "رسم شعيرات الحواجب", "眉部仿真线条"],
  "nano-brows": ["نانو بروز ابرو", "Nano brows", "حواجب النانو", "纳米眉"],
  "scalp-micropigmentation": ["میکرواسکالپ سر", "Scalp micropigmentation", "التصبغ التجميلي لفروة الرأس", "头皮微色素"],
  "lip-shading": ["شیدینگ لب", "Lip shading", "تظليل الشفاه", "唇部雾化"],
  "lip-tint": ["تینت لب", "Lip tint", "تلوين الشفاه", "唇部染色"],
  eyeliner: ["خط چشم", "Eyeliner", "الآيلاينر", "眼线"],
  "eye-shading": ["شید چشم", "Eye shading", "تظليل العين", "眼部柔雾"],
  "lash-line": ["بن مژه", "Lash-line enhancement", "تعزيز خط الرموش", "美瞳线"],
  "brow-removal": ["ریموو ابرو", "Brow pigment removal", "إزالة صبغة الحواجب", "眉部色料去除"],
  training: ["آموزش تخصصی", "Professional training", "تدريب متخصص", "专业培训"],
  consultation: ["مشاوره", "Consultation", "استشارة", "咨询"]
};
const localeIndex = { fa: 0, en: 1, ar: 2, zh: 3 }[adminLocale] ?? 0;
const serviceLabels = new Map(Object.entries(serviceNames).map(([key, names]) => [key, names[localeIndex]]));
const numberLocale = { fa: "fa-IR-u-nu-arabext", en: "en-US", ar: "ar", zh: "zh-CN" }[adminLocale] || "fa-IR";
const dateLocale = { fa: "fa-IR-u-ca-persian", en: "en-US", ar: "ar", zh: "zh-CN" }[adminLocale] || "fa-IR-u-ca-persian";

function localizedError(message) {
  if (!message || adminLocale === "fa") return message || adminCopy.connection;
  if (/وارد شوید|منقضی|نشست مدیریت/i.test(message)) return adminCopy.session;
  if (/ارتباط|سامانه|سرور/i.test(message)) return adminCopy.connection;
  if (/[\u0600-\u06ff]/u.test(message)) return adminCopy.connection;
  return message;
}

async function api(path, options = {}) {
  const response = await fetch(path, { ...options, credentials: "same-origin", headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(localizedError(body.error));
  return body;
}

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function addDetail(parent, label, value) {
  const box = node("div", "detail");
  box.append(node("span", "", label), node("b", "", value || "—"));
  parent.append(box);
}

function renderSummary(counts) {
  const values = new Map(counts.map((item) => [item.status, item.count]));
  summary.replaceChildren();
  [[adminCopy.all, counts.reduce((total, item) => total + item.count, 0)], ...[...statuses].map(([key, label]) => [label, values.get(key) || 0])].forEach(([label, count]) => {
    const item = node("div", "summary-item");
    item.append(node("span", "", label), node("b", "", new Intl.NumberFormat(numberLocale).format(count)));
    summary.append(item);
  });
}

function renderBooking(booking) {
  const card = node("article", "booking-card");
  const top = node("div", "booking-top");
  const identity = document.createElement("div");
  identity.append(node("h2", "", booking.name), node("p", "booking-meta", new Date(booking.created_at * 1000).toLocaleString(dateLocale)));
  top.append(identity, node("span", "booking-ref", `#${booking.id.slice(0, 8).toUpperCase()}`));
  const details = node("div", "booking-details");
  addDetail(details, adminCopy.phone, booking.phone);
  addDetail(details, adminCopy.service, serviceLabels.get(booking.service) || booking.service);
  addDetail(details, adminCopy.payment, paymentLabels.get(booking.payment_method) || booking.payment_method);
  card.append(top, details);
  if (booking.message) card.append(node("p", "booking-message", `${adminCopy.notes}: ${booking.message}`));
  const actions = node("div", "booking-actions");
  const status = document.createElement("select");
  status.setAttribute("aria-label", adminCopy.changeStatus);
  for (const [value, label] of statuses) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.selected = value === booking.status;
    status.append(option);
  }
  status.addEventListener("change", async () => {
    status.disabled = true;
    try { await api(`/api/admin/bookings/${encodeURIComponent(booking.id)}`, { method: "PATCH", body: JSON.stringify({ status: status.value }) }); await loadBookings(); }
    catch (error) { dashboardFeedback.textContent = error.message; status.value = booking.status; }
    finally { status.disabled = false; }
  });
  actions.append(status);
  const internalNote = document.createElement("details");
  internalNote.className = "booking-internal-note";
  internalNote.append(node("summary", "", "یادداشت داخلی مدیر"));
  const noteInput = document.createElement("textarea");
  noteInput.maxLength = 1000;
  noteInput.rows = 3;
  noteInput.value = booking.admin_note || "";
  noteInput.setAttribute("aria-label", "یادداشت داخلی؛ برای مشتری نمایش داده نمی‌شود");
  const saveNote = node("button", "quiet-button", "ذخیره یادداشت");
  saveNote.type = "button";
  saveNote.addEventListener("click", async () => {
    saveNote.disabled = true;
    try {
      await api(`/api/admin/bookings/${encodeURIComponent(booking.id)}`, { method: "PATCH", body: JSON.stringify({ status: booking.status, adminNote: noteInput.value }) });
      booking.admin_note = noteInput.value.trim();
      saveNote.textContent = "ذخیره شد";
    } catch (error) { dashboardFeedback.textContent = error.message; }
    finally { saveNote.disabled = false; }
  });
  internalNote.append(noteInput, saveNote);
  card.append(internalNote);
  if (booking.has_photo) {
    const photo = node("a", "photo-link", adminCopy.privatePhoto);
    photo.href = `/api/admin/bookings/${encodeURIComponent(booking.id)}/photo`;
    photo.target = "_blank";
    photo.rel = "noopener noreferrer";
    actions.append(photo);
  }
  card.append(actions);
  return card;
}

async function loadBookings() {
  dashboardFeedback.textContent = adminCopy.loading;
  const params = new URLSearchParams();
  if (statusFilter.value) params.set("status", statusFilter.value);
  if (searchInput.value.trim()) params.set("q", searchInput.value.trim());
  if (bookingFrom.value) params.set("from", String(Math.floor(new Date(`${bookingFrom.value}T00:00:00Z`).getTime() / 1000)));
  if (bookingTo.value) params.set("to", String(Math.floor(new Date(`${bookingTo.value}T00:00:00Z`).getTime() / 1000) + 86400));
  params.set("limit", String(bookingPageSize));
  params.set("offset", String(bookingOffset));
  try {
    const result = await api(`/api/admin/bookings?${params}`);
    bookingTotal = Number(result.total) || 0;
    renderSummary(result.counts);
    bookingList.replaceChildren();
    if (result.bookings.length) result.bookings.forEach((booking) => bookingList.append(renderBooking(booking)));
    else bookingList.append(node("div", "empty-state", adminCopy.empty));
    const currentPage = bookingTotal ? Math.floor(bookingOffset / bookingPageSize) + 1 : 0;
    const pageCount = Math.ceil(bookingTotal / bookingPageSize);
    bookingPageLabel.textContent = `صفحه ${currentPage} از ${pageCount} · ${bookingTotal} درخواست`;
    previousBookingsButton.disabled = bookingOffset <= 0;
    nextBookingsButton.disabled = bookingOffset + bookingPageSize >= bookingTotal;
    dashboardFeedback.textContent = "";
  } catch (error) {
    if (error.message === adminCopy.session) showLogin();
    dashboardFeedback.textContent = error.message;
  }
}

function bookingFilterParams(limit, offset) {
  const params = new URLSearchParams();
  if (statusFilter.value) params.set("status", statusFilter.value);
  if (searchInput.value.trim()) params.set("q", searchInput.value.trim());
  if (bookingFrom.value) params.set("from", String(Math.floor(new Date(`${bookingFrom.value}T00:00:00Z`).getTime() / 1000)));
  if (bookingTo.value) params.set("to", String(Math.floor(new Date(`${bookingTo.value}T00:00:00Z`).getTime() / 1000) + 86400));
  params.set("limit", String(limit));
  params.set("offset", String(offset));
  return params;
}

async function exportBookings() {
  exportBookingsButton.disabled = true;
  dashboardFeedback.textContent = "در حال آماده‌سازی فایل CSV…";
  try {
    const allBookings = [];
    let total = 0;
    for (let offset = 0; ; offset += 2000) {
      const result = await api(`/api/admin/bookings?${bookingFilterParams(2000, offset)}`);
      total = Number(result.total) || 0;
      if (total > 20000) throw new Error("برای خروجی گرفتن، بازهٔ تاریخ را محدودتر کنید (حداکثر ۲۰٬۰۰۰ ردیف)." );
      allBookings.push(...result.bookings);
      if (!result.bookings.length || allBookings.length >= total) break;
    }
    const fields = ["id", "name", "phone", "service", "payment_method", "status", "created_at", "message", "admin_note"];
    const csvCell = (value) => {
      const text = String(value ?? "").replace(/[\r\n]+/g, " ");
      const safe = /^\s*[=+\-@\t]/.test(text) ? `'${text}` : text;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const rows = [fields.map(csvCell).join(","), ...allBookings.map((booking) => fields.map((field) => csvCell(booking[field])).join(","))];
    const blob = new Blob(["\uFEFF", rows.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `lena-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    dashboardFeedback.textContent = `${allBookings.length} درخواست در فایل خروجی قرار گرفت.`;
  } catch (error) { dashboardFeedback.textContent = error.message; }
  finally { exportBookingsButton.disabled = false; }
}

function showLogin() {
  dashboard.hidden = true;
  loginPanel.hidden = false;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = loginForm.querySelector("button");
  button.disabled = true;
  loginFeedback.textContent = "";
  try {
    const fields = new FormData(loginForm);
    await api("/api/admin/login", { method: "POST", body: JSON.stringify({ username: fields.get("username"), password: fields.get("password") }) });
    loginForm.reset();
    loginForm.elements.username.value = "lena";
    loginPanel.hidden = true;
    dashboard.hidden = false;
    window.dispatchEvent(new Event("lena:admin-ready"));
    await loadBookings();
  } catch (error) { loginFeedback.textContent = error.message; }
  finally { button.disabled = false; }
});

document.querySelector("#logoutButton").addEventListener("click", async () => {
  try { await api("/api/admin/logout", { method: "POST", body: "{}" }); } catch {}
  showLogin();
});
document.querySelector("#refreshButton").addEventListener("click", loadBookings);
const resetBookingPage = () => { bookingOffset = 0; void loadBookings(); };
statusFilter.addEventListener("change", resetBookingPage);
bookingFrom.addEventListener("change", resetBookingPage);
bookingTo.addEventListener("change", resetBookingPage);
previousBookingsButton.addEventListener("click", () => { bookingOffset = Math.max(0, bookingOffset - bookingPageSize); void loadBookings(); });
nextBookingsButton.addEventListener("click", () => { if (bookingOffset + bookingPageSize < bookingTotal) { bookingOffset += bookingPageSize; void loadBookings(); } });
exportBookingsButton.addEventListener("click", exportBookings);
let searchTimer;
searchInput.addEventListener("input", () => { clearTimeout(searchTimer); searchTimer = setTimeout(resetBookingPage, 250); });

api("/api/admin/bookings").then((result) => {
  loginPanel.hidden = true;
  dashboard.hidden = false;
  window.dispatchEvent(new Event("lena:admin-ready"));
  bookingTotal = Number(result.total) || 0;
  renderSummary(result.counts);
  bookingList.replaceChildren(...result.bookings.map(renderBooking));
  bookingPageLabel.textContent = `صفحه ${bookingTotal ? 1 : 0} از ${Math.ceil(bookingTotal / bookingPageSize)} · ${bookingTotal} درخواست`;
  previousBookingsButton.disabled = true;
  nextBookingsButton.disabled = bookingPageSize >= bookingTotal;
}).catch(() => {});
