(() => {
  const measurementId = "G-60JSKEGQ5N";
  const consentKey = "lena_analytics_consent";
  const utmKeys = new Set(["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_id"]);
  let choice = readChoice();
  let tagLoaded = false;
  let pageViewSent = false;

  function readChoice() {
    try {
      const value = localStorage.getItem(consentKey);
      return value === "granted" || value === "denied" ? value : null;
    } catch {
      return null;
    }
  }

  function saveChoice(value) {
    choice = value;
    try {
      localStorage.setItem(consentKey, value);
    } catch {
      return;
    }
  }

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag("consent", "default", {
    analytics_storage: choice === "granted" ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied"
  });

  function pageData() {
    const cleanPath = window.location.pathname.split("/").map((segment) => segment.includes("@") || /\d{7,}/.test(segment) ? "" : segment).join("/");
    const safeUrl = new URL(window.location.origin + (cleanPath || "/"));
    const search = new URLSearchParams(window.location.search);
    for (const [key, value] of search) {
      if (!utmKeys.has(key.toLowerCase())) continue;
      if (!/^[\p{L}\p{N} ._-]{1,80}$/u.test(value) || /\d{7,}/.test(value)) continue;
      safeUrl.searchParams.set(key.toLowerCase(), value);
    }
    let referrerOrigin = "";
    try {
      referrerOrigin = document.referrer ? new URL(document.referrer).origin : "";
    } catch {
      referrerOrigin = "";
    }
    return {
      page_location: safeUrl.toString(),
      page_title: document.title.slice(0, 150),
      page_referrer: referrerOrigin
    };
  }

  function loadTag() {
    if (tagLoaded) return;
    tagLoaded = true;
    const tag = document.createElement("script");
    tag.async = true;
    tag.src = "https://www.googletagmanager.com/gtag/js?id=" + measurementId;
    document.head.append(tag);
  }

  function startAnalytics() {
    if (choice !== "granted") return;
    const page = pageData();
    gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });
    gtag("js", new Date());
    gtag("config", measurementId, {
      send_page_view: false,
      page_location: page.page_location,
      page_title: page.page_title,
      page_referrer: page.page_referrer,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    if (!pageViewSent) {
      gtag("event", "page_view", page);
      pageViewSent = true;
    }
    loadTag();
  }

  function clearAnalyticsCookies() {
    const names = document.cookie.split(";").map((item) => item.split("=")[0].trim()).filter((name) => name === "_ga" || name.startsWith("_ga_"));
    for (const name of names) {
      document.cookie = name + "=; Max-Age=0; path=/; SameSite=Lax; Secure";
      document.cookie = name + "=; Max-Age=0; path=/; domain=.lenabahri.ir; SameSite=Lax; Secure";
    }
  }

  function buildConsentUi() {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "/assets/ga4.css";
    document.head.append(stylesheet);

    const settingsButton = document.createElement("button");
    settingsButton.type = "button";
    settingsButton.className = "lena-analytics-settings";
    settingsButton.textContent = "تنظیمات آمار";
    settingsButton.setAttribute("aria-label", "تنظیمات رضایت آمار بازدید");

    const panel = document.createElement("section");
    panel.className = "lena-analytics-consent";
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "انتخاب رضایت آمار بازدید");
    panel.innerHTML = '<div class="lena-analytics-copy"><strong>تنظیمات آمار بازدید</strong><p>در صورت موافقت، آمار بازدید صفحات برای بهبود سایت ثبت می‌شود. نام، شماره، عکس و متن فرم رزرو به Google ارسال نمی‌شود. انتخابت را هر زمان از «تنظیمات آمار» تغییر بده.</p></div><div class="lena-analytics-actions"><button type="button" data-analytics-choice="granted">موافقم</button><button type="button" data-analytics-choice="denied">مخالفم</button></div>';
    panel.hidden = true;
    document.body.append(settingsButton, panel);

    function showPanel(moveFocus = true) {
      panel.hidden = false;
      settingsButton.hidden = true;
      if (moveFocus) panel.querySelector('[data-analytics-choice="granted"]').focus();
    }

    function hidePanel() {
      panel.hidden = true;
      settingsButton.hidden = false;
      settingsButton.focus();
    }

    settingsButton.addEventListener("click", showPanel);
    panel.addEventListener("click", (event) => {
      const button = event.target.closest("[data-analytics-choice]");
      if (!button) return;
      const nextChoice = button.dataset.analyticsChoice;
      saveChoice(nextChoice);
      if (nextChoice === "granted") startAnalytics();
      else {
        gtag("consent", "update", {
          analytics_storage: "denied",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied"
        });
        clearAnalyticsCookies();
      }
      hidePanel();
    });

    if (!choice) showPanel(false);
  }

  window.LenaAnalytics = {
    trackLead() {
      if (choice === "granted") gtag("event", "generate_lead", { method: "booking_form" });
    }
  };

  const bookingStatus = document.getElementById("bookingFormStatus");
  if (bookingStatus) {
    let leadTracked = false;
    const observer = new MutationObserver(() => {
      if (leadTracked || !bookingStatus.textContent.includes("درخواست با کد") || !bookingStatus.textContent.includes("ثبت شد")) return;
      leadTracked = true;
      window.LenaAnalytics.trackLead();
      observer.disconnect();
    });
    observer.observe(bookingStatus, { childList: true, subtree: true, characterData: true });
  }

  buildConsentUi();
  startAnalytics();
})();
