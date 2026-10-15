const accountLocale = (document.documentElement.lang || "fa").split("-")[0].toLowerCase();
const accountMessages = {
  fa: {
    sent: "کد ورود ارسال شد. کد تا ۵ دقیقه اعتبار دارد.", loading: "در حال دریافت اطلاعات…", saved: "اطلاعات پروفایل ذخیره شد.",
    noOrders: "هنوز سفارشی با این شماره ثبت نشده است.", signIn: "برای ادامه، با شماره همراه وارد شو.", signedOut: "از حساب خارج شدی.",
    requestFailed: "ارسال کد انجام نشد.", verifyFailed: "ورود انجام نشد.", saveFailed: "ذخیرهٔ اطلاعات انجام نشد.",
    errors: { 400: "اطلاعات واردشده را بررسی کن.", 401: "کد درست نیست یا منقضی شده؛ کد تازه بگیر.", 403: "درخواست معتبر نیست؛ صفحه را تازه‌سازی کن.", 413: "حجم عکس باید حداکثر ۱٫۵ مگابایت باشد.", 415: "فقط عکس JPG، PNG یا WebP پذیرفته می‌شود.", 429: "درخواست‌های زیادی ثبت شده؛ کمی بعد تلاش کن.", 502: "ارسال پیامک انجام نشد؛ بعداً دوباره تلاش کن.", 503: "ورود پیامکی موقتاً آماده نیست." },
    status: { pending: "در انتظار بررسی", contacted: "تماس گرفته شد", confirmed: "تأیید شد", completed: "انجام شد", cancelled: "لغو شد" },
    services: { microblading: "میکروبلدینگ ابرو", hairstroke: "هیراستروک ابرو", "nano-brows": "نانو بروز ابرو", "scalp-micropigmentation": "میکرواسکالپ سر", "lip-shading": "شیدینگ لب", "lip-tint": "تینت لب", eyeliner: "خط چشم", "eye-shading": "شید چشم", "lash-line": "بن مژه", "brow-removal": "ریموو ابرو", training: "آموزش تخصصی", consultation: "مشاوره" },
    date: "fa-IR-u-ca-persian", payment: { cash: "پرداخت حضوری", consult: "درخواست مشاوره" }, reference: "کد پیگیری"
  },
  en: {
    sent: "Your sign-in code was sent. It expires in 5 minutes.", loading: "Loading your account…", saved: "Profile details saved.",
    noOrders: "No requests have been found for this number yet.", signIn: "Sign in with your mobile number to continue.", signedOut: "You have signed out.",
    requestFailed: "Could not send the code.", verifyFailed: "Sign-in failed.", saveFailed: "Could not save your profile.",
    errors: { 400: "Please check the information and try again.", 401: "The code is incorrect or expired. Request a new one.", 403: "This request could not be verified. Refresh and try again.", 413: "The photo must be no larger than 1.5 MB.", 415: "Upload a JPG, PNG, or WebP photo.", 429: "Too many requests. Please try again shortly.", 502: "The SMS could not be sent. Please try again later.", 503: "SMS sign-in is temporarily unavailable." },
    status: { pending: "Pending review", contacted: "Contacted", confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled" },
    services: { microblading: "Eyebrow microblading", hairstroke: "Eyebrow hairstrokes", "nano-brows": "Nano brows", "scalp-micropigmentation": "Scalp micropigmentation", "lip-shading": "Lip shading", "lip-tint": "Lip tint", eyeliner: "Eyeliner", "eye-shading": "Eye shading", "lash-line": "Lash-line enhancement", "brow-removal": "Brow pigment removal", training: "Professional training", consultation: "Consultation" },
    date: "en-US", payment: { cash: "In-person payment", consult: "Consultation request" }, reference: "Reference"
  },
  ar: {
    sent: "تم إرسال رمز الدخول. تنتهي صلاحيته خلال ٥ دقائق.", loading: "جارٍ تحميل الحساب…", saved: "تم حفظ بيانات الملف الشخصي.",
    noOrders: "لم يتم العثور على طلبات بهذا الرقم حتى الآن.", signIn: "سجّلي الدخول برقم هاتفك للمتابعة.", signedOut: "تم تسجيل الخروج.",
    requestFailed: "تعذّر إرسال الرمز.", verifyFailed: "تعذّر تسجيل الدخول.", saveFailed: "تعذّر حفظ الملف الشخصي.",
    errors: { 400: "يرجى مراجعة البيانات والمحاولة مجدداً.", 401: "الرمز غير صحيح أو منتهي الصلاحية. اطلبي رمزاً جديداً.", 403: "تعذّر التحقق من الطلب. حدّثي الصفحة ثم حاولي مجدداً.", 413: "يجب ألا يتجاوز حجم الصورة ١٫٥ ميغابايت.", 415: "ارفعي صورة JPG أو PNG أو WebP.", 429: "طلبات كثيرة. يرجى المحاولة بعد قليل.", 502: "تعذّر إرسال الرسالة النصية. حاولي لاحقاً.", 503: "تسجيل الدخول بالرسائل غير متاح مؤقتاً." },
    status: { pending: "قيد المراجعة", contacted: "تم التواصل", confirmed: "تم التأكيد", completed: "مكتمل", cancelled: "ملغي" },
    services: { microblading: "مايكروبليدنج الحواجب", hairstroke: "رسم شعيرات الحواجب", "nano-brows": "حواجب النانو", "scalp-micropigmentation": "تصبغ فروة الرأس", "lip-shading": "تظليل الشفاه", "lip-tint": "تلوين الشفاه", eyeliner: "آيلاينر", "eye-shading": "تظليل العين", "lash-line": "تعزيز خط الرموش", "brow-removal": "إزالة صبغة الحواجب", training: "تدريب متخصص", consultation: "استشارة" },
    date: "ar", payment: { cash: "دفع حضوري", consult: "طلب استشارة" }, reference: "رقم المتابعة"
  },
  zh: {
    sent: "登录验证码已发送，有效期为 5 分钟。", loading: "正在加载账户…", saved: "个人资料已保存。",
    noOrders: "暂未找到使用此号码提交的申请。", signIn: "请使用手机号码登录后继续。", signedOut: "已退出登录。",
    requestFailed: "无法发送验证码。", verifyFailed: "登录失败。", saveFailed: "无法保存个人资料。",
    errors: { 400: "请检查填写的信息后重试。", 401: "验证码错误或已过期，请重新获取。", 403: "无法验证此请求，请刷新页面后重试。", 413: "照片大小不能超过 1.5 MB。", 415: "请上传 JPG、PNG 或 WebP 图片。", 429: "请求过于频繁，请稍后重试。", 502: "短信发送失败，请稍后重试。", 503: "短信登录暂时不可用。" },
    status: { pending: "待审核", contacted: "已联系", confirmed: "已确认", completed: "已完成", cancelled: "已取消" },
    services: { microblading: "眉部微雕", hairstroke: "眉部仿真线条", "nano-brows": "纳米眉", "scalp-micropigmentation": "头皮微色素", "lip-shading": "唇部雾化", "lip-tint": "唇部染色", eyeliner: "眼线", "eye-shading": "眼部柔雾", "lash-line": "美瞳线", "brow-removal": "眉部色料去除", training: "专业培训", consultation: "咨询" },
    date: "zh-CN", payment: { cash: "到店付款", consult: "咨询申请" }, reference: "查询编号"
  }
};
const accountCopy = accountMessages[accountLocale] || accountMessages.fa;
const loginView = document.querySelector("#loginView");
const phoneForm = document.querySelector("#phoneForm");
const otpForm = document.querySelector("#otpForm");
const customerView = document.querySelector("#customerView");
const feedback = document.querySelector("#accountFeedback");
const phoneInput = document.querySelector("#customerPhone");
const otpInput = document.querySelector("#customerOtp");
const resendButton = document.querySelector("#resendOtp");
const changePhoneButton = document.querySelector("#changePhone");
const profileForm = document.querySelector("#profileForm");
const photoInput = document.querySelector("#customerPhoto");
const profilePhoto = document.querySelector("#profilePhoto");
let resendTimer;
let profilePhotoPreviewUrl = "";

function showFeedback(message, kind = "info") {
  feedback.textContent = message;
  feedback.dataset.kind = kind;
}

async function api(path, options = {}) {
  const response = await fetch(path, { ...options, credentials: "same-origin" });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(accountCopy.errors[response.status] || result.error || ""), { status: response.status });
  return result;
}

function lockButton(button, locked) {
  if (button) button.disabled = locked;
}

function returnToNewsAfterLogin() {
  const requested = new URLSearchParams(window.location.search).get("returnTo");
  if (!requested) return;
  let destination;
  try { destination = new URL(requested, window.location.origin); } catch { return; }
  if (destination.origin !== window.location.origin
    || !/^\/(?:en\/|ar\/|zh\/)?khabar\/beauty\/[a-z0-9]+(?:-[a-z0-9]+)*\/?$/.test(destination.pathname)) return;
  try { sessionStorage.setItem("lena-news-tutorial-pending", "1"); } catch {}
  window.location.assign(destination.href);
}

function startResendCountdown(seconds = 60) {
  window.clearInterval(resendTimer);
  let remaining = seconds;
  resendButton.disabled = true;
  const initialText = resendButton.textContent;
  const render = () => {
    resendButton.textContent = remaining > 0 ? `${initialText} (${remaining})` : initialText;
    resendButton.disabled = remaining > 0;
    if (remaining <= 0) window.clearInterval(resendTimer);
    remaining -= 1;
  };
  render();
  resendTimer = window.setInterval(render, 1000);
}

async function requestCode() {
  const button = phoneForm.querySelector("button[type='submit']");
  lockButton(button, true);
  showFeedback(accountCopy.loading);
  try {
    await api("/api/customer/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phoneInput.value })
    });
    phoneForm.hidden = true;
    otpForm.hidden = false;
    otpInput.focus();
    showFeedback(accountCopy.sent);
    startResendCountdown();
  } catch (error) {
    showFeedback(error.message || accountCopy.requestFailed, "error");
  } finally {
    lockButton(button, false);
  }
}

function renderOrders(orders) {
  const list = document.querySelector("#ordersList");
  list.replaceChildren();
  if (!orders.length) {
    const empty = document.createElement("p");
    empty.className = "account-empty";
    empty.textContent = accountCopy.noOrders;
    list.append(empty);
    return;
  }
  for (const order of orders) {
    const row = document.createElement("article");
    row.className = "order-row";
    const details = document.createElement("div");
    const service = document.createElement("p");
    service.className = "order-service";
    service.textContent = accountCopy.services[order.service] || order.service;
    const meta = document.createElement("p");
    meta.className = "order-meta";
    meta.textContent = `${accountCopy.reference}: ${String(order.id).slice(0, 8).toUpperCase()} · ${accountCopy.payment[order.payment_method] || order.payment_method} · ${new Date(order.created_at * 1000).toLocaleDateString(accountCopy.date)}`;
    details.append(service, meta);
    const status = document.createElement("span");
    status.className = "order-status";
    status.dataset.status = order.status;
    status.textContent = accountCopy.status[order.status] || order.status;
    row.append(details, status);
    list.append(row);
  }
}

function showCustomer(data) {
  loginView.hidden = true;
  customerView.hidden = false;
  document.querySelector("#phoneHint").textContent = data.phoneHint;
  document.querySelector("#customerName").value = data.profile.fullName || "";
  const avatar = document.querySelector("#profileAvatar");
  avatar.dataset.initial = data.profile.fullName?.trim().slice(0, 1) || "LB";
  if (profilePhotoPreviewUrl) {
    URL.revokeObjectURL(profilePhotoPreviewUrl);
    profilePhotoPreviewUrl = "";
  }
  profilePhoto.hidden = !data.profile.hasPhoto;
  if (data.profile.hasPhoto) profilePhoto.src = `/api/customer/photo?v=${Date.now()}`;
  renderOrders(data.orders || []);
}

async function loadCustomer() {
  try {
    const data = await api("/api/customer/me");
    showCustomer(data);
    returnToNewsAfterLogin();
  } catch (error) {
    loginView.hidden = false;
    customerView.hidden = true;
    if (error.status !== 401) showFeedback(error.message || accountCopy.signIn, "error");
  }
}

phoneForm.addEventListener("submit", (event) => {
  event.preventDefault();
  void requestCode();
});

resendButton.addEventListener("click", () => {
  otpForm.hidden = true;
  phoneForm.hidden = false;
  void requestCode();
});

changePhoneButton.addEventListener("click", () => {
  window.clearInterval(resendTimer);
  otpForm.hidden = true;
  phoneForm.hidden = false;
  otpInput.value = "";
  showFeedback("");
  phoneInput.focus();
});

otpForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = otpForm.querySelector("button[type='submit']");
  lockButton(button, true);
  showFeedback(accountCopy.loading);
  try {
    await api("/api/customer/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phoneInput.value, code: otpInput.value })
    });
    window.clearInterval(resendTimer);
    await loadCustomer();
    showFeedback("");
  } catch (error) {
    showFeedback(error.message || accountCopy.verifyFailed, "error");
  } finally {
    lockButton(button, false);
  }
});

photoInput.addEventListener("change", () => {
  const file = photoInput.files?.[0];
  if (!file) return;
  const avatar = document.querySelector("#profileAvatar");
  if (profilePhotoPreviewUrl) URL.revokeObjectURL(profilePhotoPreviewUrl);
  profilePhotoPreviewUrl = URL.createObjectURL(file);
  profilePhoto.src = profilePhotoPreviewUrl;
  profilePhoto.hidden = false;
  avatar.dataset.initial = "";
});

profileForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = profileForm.querySelector("button[type='submit']");
  lockButton(button, true);
  showFeedback(accountCopy.loading);
  try {
    await api("/api/customer/profile", { method: "POST", body: new FormData(profileForm) });
    await loadCustomer();
    showFeedback(accountCopy.saved);
  } catch (error) {
    showFeedback(error.message || accountCopy.saveFailed, "error");
  } finally {
    lockButton(button, false);
  }
});

document.querySelector("#logoutButton").addEventListener("click", async () => {
  await api("/api/customer/logout", { method: "POST" }).catch(() => {});
  window.clearInterval(resendTimer);
  customerView.hidden = true;
  loginView.hidden = false;
  otpForm.hidden = true;
  phoneForm.hidden = false;
  profileForm.reset();
  otpInput.value = "";
  showFeedback(accountCopy.signedOut);
});

void loadCustomer();
