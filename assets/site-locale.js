(() => {
  "use strict";
  if (window.LenaLocale) return;

  const localeCodes = ["fa", "en", "ar", "zh"];
  const localeNames = {
    fa: "فارسی",
    en: "English",
    ar: "العربية",
    zh: "简体中文"
  };
  const pathLocale = window.location.pathname.match(/^\/(en|ar|zh)(?=\/|$)/)?.[1];
  const locale = pathLocale || "fa";
  const rightToLeft = locale === "fa" || locale === "ar";
  const sourcePath = window.location.pathname.replace(/^\/(en|ar|zh)(?=\/|$)/, "/") || "/";
  const catalogReady = locale === "fa"
    ? Promise.resolve({ common: {}, pages: {} })
    : fetch(`/locales/${locale}.json`, { credentials: "same-origin" })
      .then((response) => response.ok ? response.json() : { common: {}, pages: {} })
      .catch(() => ({ common: {}, pages: {} }));

  const formatDigits = (value) => {
    const digitSet = locale === "ar" ? "٠١٢٣٤٥٦٧٨٩" : "0123456789";
    return String(value).replace(/[0-9۰-۹٠-٩]/g, (digit) => {
      const index = "0123456789۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩".indexOf(digit);
      if (index < 10) return digitSet[index];
      if (index < 20) return digitSet[index - 10];
      return digitSet[index - 20];
    }).replace(/٬/g, locale === "ar" ? "٬" : ",").replace(/٫/g, locale === "ar" ? "٫" : ".");
  };

  document.documentElement.lang = locale === "zh" ? "zh-Hans" : locale;
  document.documentElement.dir = rightToLeft ? "rtl" : "ltr";

  if (!document.querySelector('link[href="/assets/site-locale.css"]')) {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "/assets/site-locale.css";
    document.head.append(stylesheet);
  }

  const localizedPath = (targetLocale) => {
    const cleanPath = sourcePath.startsWith("/") ? sourcePath : `/${sourcePath}`;
    return targetLocale === "fa" ? cleanPath : `/${targetLocale}${cleanPath === "/" ? "/" : cleanPath}`;
  };

  const rewriteInternalLinks = (root = document) => {
    root.querySelectorAll?.("a[href]").forEach((link) => {
      if (link.dataset.localeLink === "false") return;
      let target;
      try {
        target = new URL(link.getAttribute("href"), document.baseURI);
      } catch {
        return;
      }
      if (target.origin !== window.location.origin || target.hash && !target.pathname) return;
      const isPage = target.pathname === "/" || target.pathname.endsWith("/") || target.pathname.endsWith(".html");
      if (!isPage) return;
      const unlocalized = target.pathname.replace(/^\/(en|ar|zh)(?=\/|$)/, "/") || "/";
      target.pathname = locale === "fa"
        ? unlocalized
        : `/${locale}${unlocalized === "/" ? "/" : unlocalized}`;
      link.href = `${target.pathname}${target.search}${target.hash}`;
    });
  };

  const mountLanguagePicker = () => {
    const header = document.querySelector("header");
    if (!header || header.querySelector(".site-language")) return;

    const wrapper = document.createElement("label");
    wrapper.className = "site-language";
    wrapper.setAttribute("aria-label", locale === "fa" ? "انتخاب زبان" : locale === "ar" ? "اختيار اللغة" : locale === "zh" ? "选择语言" : "Choose language");

    const selector = document.createElement("select");
    selector.name = "site-language";
    selector.setAttribute("aria-label", wrapper.getAttribute("aria-label"));
    localeCodes.forEach((code) => {
      const option = document.createElement("option");
      option.value = code;
      option.textContent = localeNames[code];
      option.selected = code === locale;
      selector.appendChild(option);
    });
    selector.addEventListener("change", () => {
      const nextLocale = selector.value;
      try { window.localStorage.setItem("lena-site-locale", nextLocale); } catch {}
      window.location.assign(localizedPath(nextLocale));
    });
    wrapper.appendChild(selector);

    const nav = header.querySelector("nav");
    (nav || header).appendChild(wrapper);
  };

  window.LenaLocale = Object.freeze({ code: locale, dir: rightToLeft ? "rtl" : "ltr", localizedPath, catalogReady, formatDigits });
  window.LenaLocaleReady = catalogReady.then((catalog) => {
    window.LenaLocaleCatalog = catalog;
    window.dispatchEvent(new Event("lena:locale-ready"));
    return catalog;
  });
  rewriteInternalLinks();
  mountLanguagePicker();

  const observer = new MutationObserver((records) => {
    records.forEach((record) => record.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) rewriteInternalLinks(node);
    }));
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
