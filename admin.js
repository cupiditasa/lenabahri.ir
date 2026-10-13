const loginPanel = document.querySelector("#loginPanel");
const dashboard = document.querySelector("#dashboard");
const loginForm = document.querySelector("#loginForm");
const loginFeedback = document.querySelector("#loginFeedback");
const dashboardFeedback = document.querySelector("#dashboardFeedback");
const bookingList = document.querySelector("#bookingList");
const summary = document.querySelector("#summary");
const statusFilter = document.querySelector("#statusFilter");
const searchInput = document.querySelector("#searchInput");
const statuses = new Map([["pending", "در انتظار"], ["contacted", "تماس گرفته شد"], ["confirmed", "تأیید شد"], ["completed", "انجام شد"], ["cancelled", "لغو شد"]]);
const paymentLabels = new Map([["cash", "پرداخت نقدی و حضوری"], ["consult", "درخواست مشاوره"]]);
const serviceLabels = new Map([["microblading", "میکروبلدینگ ابرو (فیبروز)"], ["hairstroke", "هیراستروک ابرو"], ["nano-brows", "نانو بروز ابرو"], ["scalp-micropigmentation", "میکرواسکالپ سر"], ["lip-shading", "شیدینگ لب"], ["lip-tint", "تینت لب"], ["eyeliner", "خط چشم"], ["eye-shading", "شید چشم"], ["lash-line", "بن مژه"], ["brow-removal", "ریموو ابرو"], ["training", "آموزش تخصصی"], ["consultation", "مشاوره"]]);

async function api(path, options = {}) {
  const response = await fetch(path, { ...options, credentials: "same-origin", headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "ارتباط با سامانه برقرار نشد.");
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
  [["همهٔ درخواست‌ها", counts.reduce((total, item) => total + item.count, 0)], ...[...statuses].map(([key, label]) => [label, values.get(key) || 0])].forEach(([label, count]) => {
    const item = node("div", "summary-item");
    item.append(node("span", "", label), node("b", "", new Intl.NumberFormat("fa-IR").format(count)));
    summary.append(item);
  });
}

function renderBooking(booking) {
  const card = node("article", "booking-card");
  const top = node("div", "booking-top");
  const identity = document.createElement("div");
  identity.append(node("h2", "", booking.name), node("p", "booking-meta", new Date(booking.created_at * 1000).toLocaleString("fa-IR")));
  top.append(identity, node("span", "booking-ref", `#${booking.id.slice(0, 8).toUpperCase()}`));
  const details = node("div", "booking-details");
  addDetail(details, "شماره تماس", booking.phone);
  addDetail(details, "خدمت", serviceLabels.get(booking.service) || booking.service);
  addDetail(details, "نحوهٔ پرداخت", paymentLabels.get(booking.payment_method) || booking.payment_method);
  card.append(top, details);
  if (booking.message) card.append(node("p", "booking-message", `توضیحات: ${booking.message}`));
  const actions = node("div", "booking-actions");
  const status = document.createElement("select");
  status.setAttribute("aria-label", "تغییر وضعیت درخواست");
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
    const photo = node("a", "photo-link", "مشاهدهٔ عکس خصوصی");
    photo.href = `/api/admin/bookings/${encodeURIComponent(booking.id)}/photo`;
    photo.target = "_blank";
    photo.rel = "noopener noreferrer";
    actions.append(photo);
  }
  card.append(actions);
  return card;
}

async function loadBookings() {
  dashboardFeedback.textContent = "در حال دریافت درخواست‌ها…";
  const params = new URLSearchParams();
  if (statusFilter.value) params.set("status", statusFilter.value);
  if (searchInput.value.trim()) params.set("q", searchInput.value.trim());
  try {
    const result = await api(`/api/admin/bookings?${params}`);
    renderSummary(result.counts);
    bookingList.replaceChildren();
    if (result.bookings.length) result.bookings.forEach((booking) => bookingList.append(renderBooking(booking)));
    else bookingList.append(node("div", "empty-state", "درخواستی برای این فیلتر پیدا نشد."));
    dashboardFeedback.textContent = result.bookings.length >= 200 ? "۲۰۰ درخواست اخیر نمایش داده شده‌اند؛ برای دیدن مورد خاص جست‌وجو کنید." : "";
  } catch (error) {
    if (error.message.includes("وارد شوید") || error.message.includes("منقضی")) showLogin();
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
