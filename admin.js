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
  try {
    const result = await api(`/api/admin/bookings?${params}`);
    renderSummary(result.counts);
    bookingList.replaceChildren();
    if (result.bookings.length) result.bookings.forEach((booking) => bookingList.append(renderBooking(booking)));
    else bookingList.append(node("div", "empty-state", adminCopy.empty));
    dashboardFeedback.textContent = result.bookings.length >= 200 ? adminCopy.recent : "";
  } catch (error) {
    if (error.message === adminCopy.session) showLogin();
    dashboardFeedback.textContent = error.message;
  }
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
    await loadBookings();
  } catch (error) { loginFeedback.textContent = error.message; }
  finally { button.disabled = false; }
});

document.querySelector("#logoutButton").addEventListener("click", async () => {
  try { await api("/api/admin/logout", { method: "POST", body: "{}" }); } catch {}
  showLogin();
});
document.querySelector("#refreshButton").addEventListener("click", loadBookings);
statusFilter.addEventListener("change", loadBookings);
let searchTimer;
searchInput.addEventListener("input", () => { clearTimeout(searchTimer); searchTimer = setTimeout(loadBookings, 250); });

api("/api/admin/bookings").then((result) => {
  loginPanel.hidden = true;
  dashboard.hidden = false;
  renderSummary(result.counts);
  bookingList.replaceChildren(...result.bookings.map(renderBooking));
}).catch(() => {});
