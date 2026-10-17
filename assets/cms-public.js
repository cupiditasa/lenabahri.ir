(() => {
  if (window.__lenaCmsPublicStarted) return;
  window.__lenaCmsPublicStarted = true;
  const locale = (document.documentElement.lang || "fa").split("-")[0].toLowerCase();
  const currencyLocale = { fa: "fa-IR-u-nu-arabext", ar: "ar", zh: "zh-CN", en: "en-US" }[locale] || "fa-IR";
  const copy = {
    fa: { fixed: "قیمت اعلام‌شده", range: "بازهٔ قیمت", quote: "استعلام قیمت", toman: "تومان", million: "میلیون تومان", separator: " تا ", bookingClosed: "ثبت درخواست رزرو موقتاً بسته است." },
    en: { fixed: "Listed price", range: "Price range", quote: "Price on consultation", toman: " toman", million: " million toman", separator: " to ", bookingClosed: "Booking requests are temporarily closed." },
    ar: { fixed: "السعر المعلن", range: "نطاق السعر", quote: "السعر بعد الاستشارة", toman: " تومان", million: " مليون تومان", separator: " إلى ", bookingClosed: "طلبات الحجز مغلقة مؤقتاً." },
    zh: { fixed: "标示价格", range: "价格范围", quote: "咨询后报价", toman: " 托曼", million: " 百万托曼", separator: " 至 ", bookingClosed: "预约申请暂时关闭。" }
  }[locale] || { fixed: "قیمت اعلام‌شده", range: "بازهٔ قیمت", quote: "استعلام قیمت", toman: "تومان", million: "میلیون تومان", separator: " تا ", bookingClosed: "ثبت درخواست رزرو موقتاً بسته است." };
  const format = (amount) => new Intl.NumberFormat(currencyLocale).format(amount);
  const read = async (kind) => {
    try {
      const response = await fetch(`/api/public/content/${kind}`, { credentials: "same-origin", cache: "no-cache" });
      if (!response.ok) return null;
      return (await response.json()).content;
    } catch { return null; }
  };

  Promise.all([read("services"), read("settings")]).then(([services, settings]) => {
    if (Array.isArray(services)) {
      const byId = new Map(services.map((service) => [service.id, service]));
      for (const card of document.querySelectorAll("[data-service-key], .service-price-card")) {
        let serviceKey = card.dataset.serviceKey;
        if (!serviceKey) {
          const bookingLink = card.querySelector('a[href*="service="]');
          try { serviceKey = bookingLink ? new URL(bookingLink.href).searchParams.get("service") : ""; } catch {}
        }
        const service = byId.get(serviceKey);
        if (!service || service.active === false) {
          if (service) card.hidden = true;
          continue;
        }
        const title = card.querySelector("h3");
        const description = card.querySelector(":scope > p");
        const priceLabel = card.querySelector(".service-price-card__price span");
        const priceValue = card.querySelector(".service-price-card__price b");
        if (title) title.textContent = service.name?.[locale] || service.name?.fa || title.textContent;
        if (description) description.textContent = service.description?.[locale] || service.description?.fa || description.textContent;
        if (priceLabel && priceValue) {
          if (service.price?.max > 0) {
            const { min, max } = service.price;
            const compact = min !== max && min % 1000000 === 0 && max % 1000000 === 0;
            priceLabel.textContent = min === max ? copy.fixed : copy.range;
            priceValue.replaceChildren(document.createTextNode(compact ? `${format(min / 1000000)}${copy.separator}${format(max / 1000000)}` : min === max ? format(min) : `${format(min)}${copy.separator}${format(max)}`), document.createTextNode(compact ? copy.million : copy.toman));
          } else {
            priceLabel.textContent = copy.quote;
            priceValue.textContent = copy.quote;
          }
        }
      }
      const select = document.querySelector('#bookingForm select[name="service"]');
      if (select) {
        for (const option of select.options) {
          const service = byId.get(option.value);
          if (!service) continue;
          const price = service.price?.max > 0
            ? service.price.min === service.price.max ? ` — ${format(service.price.min)}${copy.toman}`
              : ` — ${format(service.price.min)}${copy.separator}${format(service.price.max)}${copy.toman}`
            : "";
          option.textContent = `${service.name?.[locale] || service.name?.fa || option.textContent}${price}`;
          option.disabled = service.active === false;
        }
      }
    }
    if (settings?.whatsappPhone) {
      for (const link of document.querySelectorAll('a[href*="wa.me/"]')) {
        const target = new URL(link.href);
        target.pathname = `/${settings.whatsappPhone}`;
        link.href = target.toString();
      }
    }
    if (settings?.announcement) {
      let announcement = document.querySelector("[data-cms-announcement]");
      if (!announcement) {
        announcement = document.createElement("aside");
        announcement.dataset.cmsAnnouncement = "true";
        announcement.setAttribute("role", "status");
        announcement.className = "cms-announcement";
        document.body.prepend(announcement);
      }
      announcement.textContent = settings.announcement;
    }
    if (settings?.bookingsOpen === false) {
      const submit = document.querySelector('#bookingForm button[type="submit"]');
      if (submit) submit.disabled = true;
      const formStatus = document.querySelector("#bookingFormStatus");
      if (formStatus) formStatus.textContent = copy.bookingClosed;
    }
  });
})();
