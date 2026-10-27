(() => {
  if (!document.querySelector('script[data-lena-locale-loader]')) {
    const localeLoader = document.createElement("script");
    localeLoader.src = "/assets/site-locale.js?v=20261014-1";
    localeLoader.defer = true;
    localeLoader.dataset.lenaLocaleLoader = "true";
    document.head.append(localeLoader);
  }

  const locale = (document.documentElement.lang || "fa").split("-")[0].toLowerCase();
  const consentCopy = {
    fa: {
      settings: "تنظیمات آمار", settingsLabel: "تنظیمات رضایت آمار بازدید", region: "انتخاب رضایت آمار بازدید",
      title: "تنظیمات آمار بازدید",
      description: "در صورت موافقت، آمار بازدید صفحات برای بهبود سایت ثبت می‌شود. نام، شماره، عکس و متن فرم رزرو به Google ارسال نمی‌شود. انتخابت را هر زمان از «تنظیمات آمار» تغییر بده.",
      accept: "موافقم", decline: "مخالفم"
    },
    en: {
      settings: "Analytics settings", settingsLabel: "Analytics consent settings", region: "Analytics consent choice",
      title: "Analytics settings",
      description: "If you agree, page-visit data will be collected to improve the website. Your booking name, phone number, photo and message are not sent to Google. Change your choice at any time in Analytics settings.",
      accept: "Agree", decline: "Decline"
    },
    ar: {
      settings: "إعدادات الإحصاءات", settingsLabel: "إعدادات الموافقة على الإحصاءات", region: "اختيار الموافقة على الإحصاءات",
      title: "إعدادات الإحصاءات",
      description: "إذا وافقتِ، ستُجمع بيانات زيارات الصفحات لتحسين الموقع. لا يُرسل اسمك أو رقم هاتفك أو صورتك أو رسالتك في نموذج الحجز إلى Google. يمكنك تغيير اختيارك في أي وقت من إعدادات الإحصاءات.",
      accept: "موافقة", decline: "رفض"
    },
    zh: {
      settings: "数据统计设置", settingsLabel: "访问统计授权设置", region: "访问统计授权选项",
      title: "访问统计设置",
      description: "如果你同意，我们会收集页面访问数据以改进网站。预约表单中的姓名、电话、照片和留言不会发送给 Google。你可以随时在“数据统计设置”中更改选择。",
      accept: "同意", decline: "拒绝"
    }
  }[locale] || {
    settings: "تنظیمات آمار", settingsLabel: "تنظیمات رضایت آمار بازدید", region: "انتخاب رضایت آمار بازدید",
    title: "تنظیمات آمار بازدید",
    description: "در صورت موافقت، آمار بازدید صفحات برای بهبود سایت ثبت می‌شود. نام، شماره، عکس و متن فرم رزرو به Google ارسال نمی‌شود. انتخابت را هر زمان از «تنظیمات آمار» تغییر بده.",
    accept: "موافقم", decline: "مخالفم"
  };

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
    stylesheet.href = "/assets/ga4.css?v=20261027-home-ux-01";
    document.head.append(stylesheet);

    const settingsButton = document.createElement("button");
    settingsButton.type = "button";
    settingsButton.className = "lena-analytics-settings";
    settingsButton.textContent = consentCopy.settings;
    settingsButton.setAttribute("aria-label", consentCopy.settingsLabel);

    const panel = document.createElement("section");
    panel.className = "lena-analytics-consent";
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", consentCopy.region);
    panel.innerHTML = `<div class="lena-analytics-copy"><strong>${consentCopy.title}</strong><p>${consentCopy.description}</p></div><div class="lena-analytics-actions"><button type="button" data-analytics-choice="granted">${consentCopy.accept}</button><button type="button" data-analytics-choice="denied">${consentCopy.decline}</button></div>`;
    panel.hidden = true;
    const settingsHost = document.querySelector(".site-footer, footer") || document.body;
    settingsHost.append(settingsButton);
    document.body.append(panel);

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

  window.addEventListener("lena:booking-submitted", () => window.LenaAnalytics.trackLead());

  buildConsentUi();
  startAnalytics();
})();
