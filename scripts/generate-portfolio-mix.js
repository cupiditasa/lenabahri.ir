const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, "gallery-data.js"), "utf8"), context);
const gallery = context.window.LENA_GALLERY;
const locales = Object.fromEntries(["en", "ar", "zh"].map((code) => [
  code,
  JSON.parse(fs.readFileSync(path.join(root, "locales", `${code}.json`), "utf8"))
]));
locales.fa = { common: {}, pages: {} };

const languages = {
  fa: { prefix: "", dir: "rtl", name: "فارسی" },
  en: { prefix: "/en", dir: "ltr", name: "English" },
  ar: { prefix: "/ar", dir: "rtl", name: "العربية" },
  zh: { prefix: "/zh", dir: "ltr", name: "简体中文" }
};

const copy = {
  fa: {
    gallery: "گالری نتایج", all: "همه نمونه‌کارها", photos: "تصاویر نمونه‌کار", videos: "ویدیوهای نمونه‌کار",
    detail: "مشاهده جزئیات", book: "رزرو مشاوره", options: "نمایش گزینه‌های نمونه‌کار", image: "تصویر",
    video: "ویدیو", brows: "ابرو", lip: "شیدینگ لب", eye: "چشم و بن‌مژه", scalp: "اسکالپ", academy: "آموزش",
    collectionTitle: "نمونه‌کارهای آرایش دائم در شیراز | تصاویر و ویدیوها | لنا بحری",
    collectionDescription: "مجموعه تصاویر و ویدیوهای نمونه‌کار آرایش دائم لنا بحری در شیراز؛ نتایج ابرو، شیدینگ لب، چشم و اسکالپ را ببینید و بر اساس خدمت فیلتر کنید.",
    intro: "تصاویر و ویدیوهای واقعی خدمات لنا بحری را یک‌جا ببینید؛ بر اساس نوع رسانه یا خدمت دلخواهتان فیلتر کنید.",
    filterType: "نوع نمونه‌کار", filterService: "دسته خدمات", results: "مجموعه نمونه‌کارها",
    allTypes: "همه", allServices: "همه خدمات", open: "مشاهده نمونه", home: "خانه", videoArchive: "آرشیو ویدیوها", photoArchive: "موزه تصاویر", services: "خدمات و قیمت‌ها",
    noResults: "نمونه‌ای با این فیلتر پیدا نشد.", photoAlt: "نمونه تصویری آرایش دائم", videoAlt: "ویدیوی نمونه‌کار آرایش دائم", photoUnit: "تصویر", videoUnit: "ویدیو"
  },
  en: {
    gallery: "Results Gallery", all: "All Portfolio Work", photos: "Portfolio Photos", videos: "Portfolio Videos",
    detail: "View details", book: "Book a consultation", options: "Show work options", image: "Photo",
    video: "Video", brows: "Brows", lip: "Lip Shading", eye: "Eyes & Lash Line", scalp: "Scalp", academy: "Education",
    collectionTitle: "Permanent Makeup Portfolio in Shiraz | Lena Bahri",
    collectionDescription: "Explore Lena Bahri’s permanent makeup portfolio in Shiraz, with brow, lip shading, eye and scalp results in photo and video.",
    intro: "Explore Lena Bahri’s portfolio photos and videos in one place. Filter by media type or service.",
    filterType: "Media type", filterService: "Service", results: "Portfolio collection",
    allTypes: "All", allServices: "All services", open: "View example", home: "Home", videoArchive: "Video portfolio", photoArchive: "Photo museum", services: "Services & prices",
    noResults: "No examples match these filters.", photoAlt: "Permanent makeup portfolio photo", videoAlt: "Permanent makeup portfolio video", photoUnit: "photos", videoUnit: "videos"
  },
  ar: {
    gallery: "معرض النتائج", all: "جميع الأعمال", photos: "صور الأعمال", videos: "فيديوهات الأعمال",
    detail: "عرض التفاصيل", book: "احجزي استشارة", options: "عرض خيارات العمل", image: "صورة",
    video: "فيديو", brows: "الحواجب", lip: "تظليل الشفاه", eye: "العين وخط الرموش", scalp: "فروة الرأس", academy: "التعليم",
    collectionTitle: "أعمال المكياج الدائم في شيراز | صور وفيديو | لنا بحري",
    collectionDescription: "تصفحي صور وفيديوهات أعمال لنا بحري في شيراز للحواجب وتظليل الشفاه والعين وفروة الرأس، مع إمكانية التصفية حسب نوع العمل والخدمة.",
    intro: "شاهدي صور وفيديوهات أعمال لنا بحري في مكان واحد، وصفي النتائج حسب نوع الوسائط أو الخدمة.",
    filterType: "نوع العمل", filterService: "الخدمة", results: "مجموعة الأعمال",
    allTypes: "الكل", allServices: "جميع الخدمات", open: "عرض المثال", home: "الرئيسية", videoArchive: "أرشيف الفيديو", photoArchive: "معرض الصور", services: "الخدمات والأسعار",
    noResults: "لا توجد أمثلة تطابق خيارات التصفية.", photoAlt: "صورة من أعمال المكياج الدائم", videoAlt: "فيديو من أعمال المكياج الدائم", photoUnit: "صورة", videoUnit: "فيديو"
  },
  zh: {
    gallery: "效果展示", all: "全部作品", photos: "作品图片", videos: "作品视频",
    detail: "查看详情", book: "预约咨询", options: "查看作品选项", image: "图片",
    video: "视频", brows: "眉部", lip: "唇部雾化", eye: "眼部与睫毛线", scalp: "头皮", academy: "培训",
    collectionTitle: "设拉子半永久妆作品集｜图片与视频｜Lena Bahri",
    collectionDescription: "浏览 Lena Bahri 在设拉子的半永久妆作品图片与视频，涵盖眉部、唇部雾化、眼部和头皮项目，并按作品类型或服务筛选。",
    intro: "在一个页面浏览 Lena Bahri 的作品图片与视频，并按媒体类型或服务筛选。",
    filterType: "作品类型", filterService: "服务分类", results: "作品合集",
    allTypes: "全部", allServices: "全部服务", open: "查看案例", home: "首页", videoArchive: "作品视频", photoArchive: "图片作品馆", services: "服务与价格",
    noResults: "没有符合筛选条件的作品。", photoAlt: "半永久妆作品图片", videoAlt: "半永久妆作品视频", photoUnit: "张图片", videoUnit: "个视频"
  }
};

const videos = [
  { slug: "microblading-natural-eyebrows", category: "brow", title: "میکروبلیدینگ ابرو ظریف و طبیعی در شیراز", poster: "/assets/videos/portfolio/posters/microblading-natural-eyebrows.jpg" },
  { slug: "thai-style-hairstroke-brows", category: "brow", title: "هیراستروک ابرو با استایل تایلندی در شیراز", poster: "/assets/videos/portfolio/posters/thai-style-hairstroke-brows.jpg" },
  { slug: "natural-girly-hairstroke-brows", category: "brow", title: "هیراستروک دخترانه و طبیعی؛ طراحی ظریف ابرو", poster: "/assets/videos/portfolio/posters/natural-girly-hairstroke-brows.jpg" },
  { slug: "eyebrow-technique-differences", category: "brow", title: "تفاوت تکنیک‌های ابرو؛ میکروبلیدینگ، هیراستروک و نانو", poster: "/assets/videos/portfolio/posters/eyebrow-technique-differences.jpg" },
  { slug: "temporary-microblading-guide", category: "brow", title: "میکروبلیدینگ موقت چیست؟ واقعیت ماندگاری ابرو", poster: "/assets/videos/portfolio/posters/temporary-microblading-guide.jpg" },
  { slug: "natural-brow-shape-face", category: "brow", title: "فرم طبیعی ابرو متناسب با چهره؛ طراحی اختصاصی", poster: "/assets/videos/portfolio/posters/natural-brow-shape-face.jpg" },
  { slug: "eyebrow-shapes-guide", category: "brow", title: "تفاوت فرم ابروها؛ صاف، قوس‌دار یا طبیعی؟", poster: "/assets/videos/portfolio/posters/eyebrow-shapes-guide.jpg" },
  { slug: "natural-lash-line-enhancement", category: "eye", title: "بن مژه طبیعی و ظریف در شیراز", poster: "/assets/videos/portfolio/posters/natural-lash-line-enhancement.jpg" },
  { slug: "fibroze-microblading-techniques", category: "brow", title: "تکنیک‌های فیبروز و میکروبلیدینگ ابرو", poster: "/assets/videos/portfolio/posters/fibroze-microblading-techniques.jpg" },
  { slug: "lip-shading-natural-color", category: "lip", title: "شیدینگ لب برای خوش‌رنگ‌تر شدن لب‌ها", poster: "/assets/videos/portfolio/posters/lip-shading-natural-color.jpg" },
  { slug: "lip-shading-cosmetic-not-medical", category: "lip", title: "شیدینگ لب؛ خدمت آرایشی، نه درمان پزشکی", poster: "/assets/videos/portfolio/posters/lip-shading-cosmetic-not-medical.jpg" }
];

const homeVideoSlugs = [
  "microblading-natural-eyebrows",
  "thai-style-hairstroke-brows",
  "natural-lash-line-enhancement",
  "lip-shading-natural-color"
];

const photoSlugs = {
  1: "natural-brow-design",
  2: "brow-redesign",
  3: "soft-brow-design",
  4: "natural-brow-hairstrokes",
  5: "nano-brows",
  6: "subtle-eye-pigmentation",
  7: "lip-shading",
  8: "natural-lip-color",
  9: "scalp-micropigmentation-stage-one",
  10: "scalp-density",
  11: "scalp-treatment-process",
  12: "scalp-result",
  13: "sterile-professional-practice",
  14: "natural-lip-shading-before-after",
  15: "natural-hairstrokes-example-one",
  16: "soft-hairstrokes-example-two",
  17: "powder-brows-before-after",
  18: "red-lip-shading-before-after",
  19: "nano-brows-before-after",
  20: "fibroze-brows-before-after",
  21: "eyebrow-microblading-before-after"
};

const photoDetailLabels = {
  fa: { eyebrow: "نمونه‌کارهای لنا بحری", technique: "تکنیک", duration: "مدت و تعداد جلسات", previous: "نمونه قبلی", next: "نمونه بعدی", back: "بازگشت به همه نمونه‌کارها", booking: "رزرو مشاوره" },
  en: { eyebrow: "Lena Bahri Portfolio", technique: "Technique", duration: "Session duration", previous: "Previous work", next: "Next work", back: "Back to all portfolio work", booking: "Book a consultation" },
  ar: { eyebrow: "أعمال لنا بحري", technique: "التقنية", duration: "المدة وعدد الجلسات", previous: "العمل السابق", next: "العمل التالي", back: "العودة إلى جميع الأعمال", booking: "احجزي استشارة" },
  zh: { eyebrow: "Lena Bahri 作品案例", technique: "技法", duration: "服务时长与次数", previous: "上一个案例", next: "下一个案例", back: "返回全部作品", booking: "预约咨询" }
};

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[char]);
const localizedPath = (language, pathname) => `${languages[language].prefix}${pathname}`;

function translatePhoto(project, language) {
  if (language === "fa") return project;
  const common = locales[language].common || {};
  const entry = project.translations?.[language];
  return {
    ...project,
    title: entry?.title || common[project.title] || project.title,
    description: entry?.description || common[project.description] || project.description,
    technique: entry?.technique || common[project.technique] || project.technique,
    subtitle: common[project.subtitle] || project.subtitle
  };
}

function translateVideo(video, language) {
  const page = locales[language].pages?.["portfolio/videos/index.html"] || {};
  return { ...video, displayTitle: page[video.title] || video.title };
}

function photoUrl(language, id) {
  const slug = photoSlugs[id];
  if (!slug) throw new Error(`Missing SEO slug for portfolio photo ${id}`);
  return localizedPath(language, `/portfolio/photos/${slug}/`);
}

function videoUrl(language, slug) {
  return `${localizedPath(language, `/portfolio/videos/${slug}/`)}`;
}

function renderHomeCard(item, language, number) {
  const text = copy[language];
  const isVideo = item.kind === "video";
  const title = isVideo ? item.displayTitle : item.title;
  const image = isVideo ? item.poster : item.image;
  const destination = isVideo ? videoUrl(language, item.slug) : photoUrl(language, item.id);
  const category = text[item.category] || text.brows;
  const id = `${item.kind}-${isVideo ? item.slug : item.id}`;
  const alt = `${isVideo ? text.videoAlt : text.photoAlt}: ${title}`;
  const action = isVideo ? text.detail : text.detail;
  return `
        <article class="result-card result-card--${item.category} ${isVideo ? "result-card--video" : ""} reveal" data-result-card data-result-kind="${item.kind}" data-result-category="${item.category}">
          <div class="result-card__surface">
            <div class="result-card__media" data-result-media role="button" tabindex="0" aria-label="${escapeHtml(`${text.options}: ${title}`)}" aria-expanded="false" aria-controls="result-menu-${escapeHtml(id)}">
              <img class="result-card__image" src="${escapeHtml(image)}" alt="${escapeHtml(alt)}" loading="lazy">
              <span class="result-card__type">${isVideo ? text.video : text.image}</span>${isVideo ? '<span class="result-card__play" aria-hidden="true">▶</span>' : ""}
            </div>
            <div class="result-card__meta">
              <span class="result-card__number">${String(number).padStart(2, "0")}</span>
              <div><h3>${escapeHtml(title)}</h3><small>${escapeHtml(category)}</small></div>
              <button class="result-card__trigger" type="button" aria-label="${escapeHtml(`${text.options}: ${title}`)}" aria-expanded="false" aria-controls="result-menu-${escapeHtml(id)}"><span></span><span></span><span></span></button>
            </div>
          </div>
          <nav class="result-card__menu" id="result-menu-${escapeHtml(id)}" aria-label="${escapeHtml(`${text.options}: ${title}`)}" aria-hidden="true">
            <a href="${escapeHtml(destination)}">${escapeHtml(action)} <span aria-hidden="true">↗</span></a>
            <a href="${escapeHtml(localizedPath(language, "/index.html#booking"))}">${escapeHtml(text.book)} <span aria-hidden="true">←</span></a>
            <a href="${escapeHtml(localizedPath(language, "/portfolio/all.html"))}">${escapeHtml(text.all)} <span aria-hidden="true">←</span></a>
          </nav>
        </article>`;
}

function renderHome(language) {
  const text = copy[language];
  const photos = gallery.projects.filter((item) => [14, 15, 16, 17].includes(item.id)).sort((a, b) => a.id - b.id);
  const featuredVideos = homeVideoSlugs.map((slug) => videos.find((video) => video.slug === slug));
  const sequence = [
    { kind: "photo", ...translatePhoto(photos[0], language) },
    { kind: "photo", ...translatePhoto(photos[1], language) },
    { kind: "video", ...translateVideo(featuredVideos[0], language) },
    { kind: "video", ...translateVideo(featuredVideos[1], language) },
    { kind: "photo", ...translatePhoto(photos[2], language) },
    { kind: "photo", ...translatePhoto(photos[3], language) },
    { kind: "video", ...translateVideo(featuredVideos[2], language) },
    { kind: "video", ...translateVideo(featuredVideos[3], language) }
  ];
  const grid = `      <div class="portfolio-grid" aria-label="${escapeHtml(text.all)}">
${sequence.map((item, index) => renderHomeCard(item, language, index + 1)).join("\n")}
      </div>`;
  const pagePath = language === "fa" ? "index.html" : `${language}/index.html`;
  const page = fs.readFileSync(path.join(root, pagePath), "utf8");
  const sectionStart = page.indexOf('<section class="portfolio section"');
  const sectionEnd = page.indexOf("</section>", sectionStart);
  const gridStart = page.indexOf('      <div class="portfolio-grid"', sectionStart);
  const gridClose = page.lastIndexOf("</div>", sectionEnd);
  if (sectionStart < 0 || sectionEnd < 0 || gridStart < 0 || gridClose < 0) throw new Error(`Could not locate home portfolio block in ${pagePath}: ${sectionStart}, ${sectionEnd}, ${gridStart}, ${gridClose}`);
  const gridEnd = gridClose + "</div>".length;
  let updated = `${page.slice(0, gridStart)}${grid}${page.slice(gridEnd)}`;
  const updatedSectionStart = updated.indexOf('<section class="portfolio section"');
  const updatedSectionEnd = updated.indexOf("</section>", updatedSectionStart);
  const section = updated.slice(updatedSectionStart, updatedSectionEnd);
  const cta = new RegExp('(<a class="instagram-link" href=")[^"]*("[^>]*>)[\\s\\S]*?(<\\/a>)');
  const ctaLabel = language === "fa" ? "مشاهده همه نمونه‌کارها" : text.all;
  const nextSection = section.replace(cta, `$1${localizedPath(language, "/portfolio/all.html")}$2${escapeHtml(ctaLabel)} <span>←</span>$3`);
  if (nextSection === section && !section.includes(`href="${localizedPath(language, "/portfolio/all.html")}"`)) throw new Error(`Could not update portfolio link in ${pagePath}`);
  updated = `${updated.slice(0, updatedSectionStart)}${nextSection}${updated.slice(updatedSectionEnd)}`;
  fs.writeFileSync(path.join(root, pagePath), updated, "utf8");
}

function mixItems() {
  const photos = [...gallery.projects].sort((a, b) => a.id - b.id);
  const featuredPhotos = [14, 15, 16, 17].map((id) => photos.find((item) => item.id === id));
  const featuredVideos = homeVideoSlugs.map((slug) => videos.find((item) => item.slug === slug));
  const remainingPhotos = photos.filter((item) => ![14, 15, 16, 17].includes(item.id));
  const remainingVideos = videos.filter((item) => !homeVideoSlugs.includes(item.slug));
  const result = [];
  for (let index = 0; index < 2; index += 1) {
    result.push({ kind: "photo", ...featuredPhotos[index] });
  }
  for (let index = 0; index < 2; index += 1) {
    result.push({ kind: "video", ...featuredVideos[index] });
  }
  for (let index = 2; index < 4; index += 1) {
    result.push({ kind: "photo", ...featuredPhotos[index] });
  }
  for (let index = 2; index < 4; index += 1) {
    result.push({ kind: "video", ...featuredVideos[index] });
  }
  while (remainingPhotos.length || remainingVideos.length) {
    result.push(...remainingPhotos.splice(0, 2).map((item) => ({ kind: "photo", ...item })));
    result.push(...remainingVideos.splice(0, 2).map((item) => ({ kind: "video", ...item })));
  }
  return result;
}

function renderCollectionCard(item, language) {
  const text = copy[language];
  const isVideo = item.kind === "video";
  const project = isVideo ? item : translatePhoto(item, language);
  const title = isVideo ? translateVideo(item, language).displayTitle : project.title;
  const image = isVideo ? item.poster : item.image;
  const link = isVideo ? videoUrl(language, item.slug) : photoUrl(language, item.id);
  const type = isVideo ? "video" : "photo";
  const categoryName = text[item.category] || text.brows;
  const alt = `${isVideo ? text.videoAlt : text.photoAlt}: ${title}`;
  return `
      <article class="mix-card" data-kind="${type}" data-category="${escapeHtml(item.category)}">
        <a class="mix-card__link" href="${escapeHtml(link)}">
          <span class="mix-card__media"><img src="${escapeHtml(image)}" alt="${escapeHtml(alt)}" loading="lazy">${isVideo ? '<span class="mix-card__play" aria-hidden="true">▶</span>' : ""}<span class="mix-card__type">${isVideo ? text.video : text.image}</span></span>
          <span class="mix-card__copy"><small>${escapeHtml(categoryName)}</small><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text.open)} <b aria-hidden="true">↗</b></span></span>
        </a>
      </article>`;
}

function renderCollection(language, items) {
  const text = copy[language];
  const lang = languages[language];
  const pagePath = localizedPath(language, "/portfolio/all.html");
  const canonical = `https://lenabahri.ir${pagePath}`;
  const homeUrl = localizedPath(language, "/index.html");
  const filterTypes = [
    ["all", text.allTypes], ["photo", text.photos], ["video", text.videos]
  ];
  const filterCategories = [
    ["all", text.allServices], ["brow", text.brows], ["lip", text.lip], ["eye", text.eye], ["scalp", text.scalp], ["academy", text.academy]
  ];
  const schemaItems = items.map((item, index) => {
    const title = item.kind === "video" ? translateVideo(item, language).displayTitle : translatePhoto(item, language).title;
    const url = item.kind === "video" ? videoUrl(language, item.slug) : photoUrl(language, item.id);
    return { "@type": "ListItem", position: index + 1, name: title, url: `https://lenabahri.ir${url}` };
  });
  const schema = JSON.stringify({ "@context": "https://schema.org", "@type": "CollectionPage", name: text.collectionTitle, description: text.collectionDescription, url: canonical, inLanguage: language === "fa" ? "fa-IR" : language === "zh" ? "zh-Hans" : language === "ar" ? "ar" : "en", mainEntity: { "@type": "ItemList", itemListElement: schemaItems } }).replace(/</g, "\\u003c");
  const languageLinks = Object.entries(languages).map(([code, value]) => `<link rel="alternate" hreflang="${code === "zh" ? "zh-Hans" : code}" href="https://lenabahri.ir${localizedPath(code, "/portfolio/all.html")}">`).join("\n  ");
  return `<!doctype html>
<html lang="${language === "zh" ? "zh-Hans" : language}" dir="${lang.dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(text.collectionTitle)}</title>
  <meta name="description" content="${escapeHtml(text.collectionDescription)}">
  <link rel="canonical" href="${canonical}">
  ${languageLinks}
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(text.collectionTitle)}">
  <meta property="og:description" content="${escapeHtml(text.collectionDescription)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="https://lenabahri.ir/assets/gallery/portfolio/portfolio-new-lip-shading-natural.jpg">
  <link rel="stylesheet" href="/style.css?v=20261030-portfolio-mix">
  <link rel="stylesheet" href="/assets/portfolio-mix.css?v=20261030-portfolio-mix">
  <script type="application/ld+json">${schema}</script>
  <script src="/assets/site-locale.js" defer></script>
  <script src="/assets/portfolio-mix.js?v=20261030-portfolio-mix" defer></script>
</head>
<body class="portfolio-mix-page">
  <header class="portfolio-mix-header">
    <a class="portfolio-mix-brand" href="${homeUrl}"><img src="/assets/brand/logo-lb-optimized.png" alt="" width="42" height="42"><span><b>LENA BAHRI</b><small>PERMANENT MAKEUP</small></span></a>
    <nav aria-label="${escapeHtml(text.all)}"><a href="${homeUrl}">${escapeHtml(text.home)}</a><a href="${localizedPath(language, "/portfolio/videos/")}">${escapeHtml(text.videoArchive)}</a><a href="${localizedPath(language, "/portfolio.html")}">${escapeHtml(text.photoArchive)}</a><a href="${localizedPath(language, "/services.html")}">${escapeHtml(text.services)}</a></nav>
  </header>
  <main class="portfolio-mix-shell">
    <nav class="portfolio-mix-breadcrumbs" aria-label="Breadcrumb"><a href="${homeUrl}">${escapeHtml(text.home)}</a><span aria-hidden="true">›</span><span>${escapeHtml(text.all)}</span></nav>
    <section class="portfolio-mix-hero">
      <p class="portfolio-mix-eyebrow">LENA BAHRI · ${escapeHtml(text.gallery)}</p>
      <h1>${escapeHtml(text.all)}</h1>
      <p>${escapeHtml(text.intro)}</p>
      <span>${items.filter((item) => item.kind === "photo").length} ${escapeHtml(text.photoUnit)} · ${items.filter((item) => item.kind === "video").length} ${escapeHtml(text.videoUnit)}</span>
    </section>
    <section class="portfolio-mix-controls" aria-label="${escapeHtml(text.filterType)}">
      <div class="portfolio-mix-filter-group"><h2>${escapeHtml(text.filterType)}</h2><div class="portfolio-mix-buttons" data-filter-group="kind">${filterTypes.map(([id, label], index) => `<button type="button" data-filter-value="${id}" aria-pressed="${index === 0}">${escapeHtml(label)}</button>`).join("")}</div></div>
      <div class="portfolio-mix-filter-group"><h2>${escapeHtml(text.filterService)}</h2><div class="portfolio-mix-buttons" data-filter-group="category">${filterCategories.map(([id, label], index) => `<button type="button" data-filter-value="${id}" aria-pressed="${index === 0}">${escapeHtml(label)}</button>`).join("")}</div></div>
    </section>
    <section class="portfolio-mix-results" aria-live="polite">
      <h2>${escapeHtml(text.results)}</h2>
      <p class="portfolio-mix-empty" hidden>${escapeHtml(text.noResults)}</p>
      <div class="portfolio-mix-grid" id="portfolioMixGrid">
${items.map((item) => renderCollectionCard(item, language)).join("\n")}
      </div>
    </section>
  </main>
  <footer class="portfolio-mix-footer"><a href="${homeUrl}">${escapeHtml(text.home)}</a><a href="${localizedPath(language, "/portfolio/videos/")}">${escapeHtml(text.videoArchive)}</a><a href="${localizedPath(language, "/services.html")}">${escapeHtml(text.services)}</a><a href="${localizedPath(language, "/index.html#booking")}">${escapeHtml(text.book)}</a></footer>
</body>
</html>
`;
}

function renderPhotoPage(language, project, previousProject, nextProject) {
  const lang = languages[language];
  const labels = photoDetailLabels[language];
  const text = copy[language];
  const translated = translatePhoto(project, language);
  const category = text[project.category] || text.brows;
  const slug = photoSlugs[project.id];
  const pagePath = localizedPath(language, `/portfolio/photos/${slug}/`);
  const canonical = `https://lenabahri.ir${pagePath}`;
  const image = `/${project.image.replace(/^\//, "")}`;
  const imageAlt = `${translated.title} — ${category}`;
  const homeUrl = localizedPath(language, "/index.html");
  const collectionUrl = localizedPath(language, "/portfolio/all.html");
  const alternates = Object.keys(languages).map((code) => `<link rel="alternate" hreflang="${code === "zh" ? "zh-Hans" : code}" href="https://lenabahri.ir${localizedPath(code, `/portfolio/photos/${slug}/`)}">`).join("\n  ");
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: translated.title,
    description: translated.description,
    url: canonical,
    inLanguage: language === "fa" ? "fa-IR" : language === "zh" ? "zh-Hans" : language,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: text.home, item: `https://lenabahri.ir${homeUrl}` },
        { "@type": "ListItem", position: 2, name: text.all, item: `https://lenabahri.ir${collectionUrl}` },
        { "@type": "ListItem", position: 3, name: translated.title, item: canonical }
      ]
    },
    primaryImageOfPage: {
      "@type": "ImageObject",
      contentUrl: `https://lenabahri.ir${image}`,
      caption: imageAlt,
      description: translated.description
    }
  }).replace(/</g, "\\u003c");
  const previousUrl = photoUrl(language, previousProject.id);
  const nextUrl = photoUrl(language, nextProject.id);
  return `<!doctype html>
<html lang="${language === "zh" ? "zh-Hans" : language}" dir="${lang.dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(translated.title)} | Lena Bahri</title>
  <meta name="description" content="${escapeHtml(translated.description)}">
  <link rel="canonical" href="${canonical}">
  ${alternates}
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(translated.title)} | Lena Bahri">
  <meta property="og:description" content="${escapeHtml(translated.description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="https://lenabahri.ir${image}">
  <meta property="og:image:alt" content="${escapeHtml(imageAlt)}">
  <link rel="stylesheet" href="/style.css?v=20261030-portfolio-mix">
  <link rel="stylesheet" href="/assets/portfolio-mix.css?v=20261030-portfolio-mix">
  <script type="application/ld+json">${schema}</script>
  <script src="/assets/site-locale.js" defer></script>
</head>
<body class="portfolio-mix-page photo-detail-page">
  <header class="portfolio-mix-header">
    <a class="portfolio-mix-brand" href="${homeUrl}"><img src="/assets/brand/logo-lb-optimized.png" alt="" width="42" height="42"><span><b>LENA BAHRI</b><small>PERMANENT MAKEUP</small></span></a>
    <nav aria-label="${escapeHtml(text.all)}"><a href="${homeUrl}">${escapeHtml(text.home)}</a><a href="${collectionUrl}">${escapeHtml(text.all)}</a><a href="${localizedPath(language, "/services.html")}">${escapeHtml(text.services)}</a></nav>
  </header>
  <main class="photo-detail portfolio-mix-shell">
    <nav class="portfolio-mix-breadcrumbs" aria-label="Breadcrumb"><a href="${homeUrl}">${escapeHtml(text.home)}</a><span aria-hidden="true">›</span><a href="${collectionUrl}">${escapeHtml(text.all)}</a><span aria-hidden="true">›</span><span>${escapeHtml(translated.title)}</span></nav>
    <article class="photo-detail__layout">
      <figure class="photo-detail__figure"><img class="photo-detail__image" src="${escapeHtml(image)}" alt="${escapeHtml(imageAlt)}" fetchpriority="high"><figcaption>${escapeHtml(translated.subtitle || category)} · ${escapeHtml(category)}</figcaption></figure>
      <div class="photo-detail__copy">
        <p class="portfolio-mix-eyebrow">${escapeHtml(labels.eyebrow)} · ${escapeHtml(category)}</p>
        <h1>${escapeHtml(translated.title)}</h1>
        <p class="photo-detail__description">${escapeHtml(translated.description)}</p>
        <dl class="photo-detail__facts"><div><dt>${escapeHtml(labels.technique)}</dt><dd>${escapeHtml(translated.technique)}</dd></div><div><dt>${escapeHtml(labels.duration)}</dt><dd>${escapeHtml(translated.duration)}</dd></div></dl>
        <a class="photo-detail__booking" href="${localizedPath(language, "/index.html#booking")}">${escapeHtml(labels.booking)}</a>
      </div>
    </article>
    <nav class="photo-detail-pagination" aria-label="Portfolio navigation"><a href="${previousUrl}"><span aria-hidden="true">${lang.dir === "rtl" ? "→" : "←"}</span>${escapeHtml(labels.previous)}</a><a href="${collectionUrl}">${escapeHtml(labels.back)}</a><a href="${nextUrl}">${escapeHtml(labels.next)}<span aria-hidden="true">${lang.dir === "rtl" ? "←" : "→"}</span></a></nav>
  </main>
</body>
</html>
`;
}

function updateSitemap() {
  const sitemapPath = path.join(root, "sitemap.xml");
  let sitemap = fs.readFileSync(sitemapPath, "utf8");
  const urls = Object.keys(languages).flatMap((language) => [
    `https://lenabahri.ir${localizedPath(language, "/portfolio/all.html")}`,
    ...gallery.projects.map((project) => `https://lenabahri.ir${photoUrl(language, project.id)}`)
  ]);
  const missing = urls.filter((url) => !sitemap.includes(`<loc>${url}</loc>`));
  if (!missing.length) return;
  const entries = missing.map((url) => `  <url>\n    <loc>${url}</loc>\n  </url>`).join("\n");
  sitemap = sitemap.replace("</urlset>", `${entries}\n</urlset>`);
  fs.writeFileSync(sitemapPath, sitemap, "utf8");
}

function verifyGenerated(items) {
  const expected = ["photo", "photo", "video", "video", "photo", "photo", "video", "video"];
  if (Object.keys(photoSlugs).length !== gallery.projects.length) throw new Error("Every portfolio photo must have a unique detail-page slug");
  const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
  for (const language of Object.keys(languages)) {
    const homePath = language === "fa" ? "index.html" : `${language}/index.html`;
    const home = fs.readFileSync(path.join(root, homePath), "utf8");
    const cardKinds = [...home.matchAll(/data-result-kind="(photo|video)"/g)].map((match) => match[1]);
    if (cardKinds.length !== expected.length || cardKinds.some((kind, index) => kind !== expected[index])) {
      throw new Error(`Unexpected featured-work order in ${homePath}: ${cardKinds.join(",")}`);
    }
    const mixPath = language === "fa" ? "portfolio/all.html" : `${language}/portfolio/all.html`;
    const mixPage = fs.readFileSync(path.join(root, mixPath), "utf8");
    const cardCount = [...mixPage.matchAll(/<article class="mix-card"/g)].length;
    if (cardCount !== items.length) throw new Error(`Expected ${items.length} collection cards in ${mixPath}, found ${cardCount}`);
    for (const project of gallery.projects) {
      const detailPath = language === "fa"
        ? path.join(root, "portfolio", "photos", photoSlugs[project.id], "index.html")
        : path.join(root, language, "portfolio", "photos", photoSlugs[project.id], "index.html");
      if (!fs.existsSync(detailPath)) throw new Error(`Missing ${language} photo detail page for project ${project.id}`);
      const detailPage = fs.readFileSync(detailPath, "utf8");
      const canonical = `https://lenabahri.ir${photoUrl(language, project.id)}`;
      const alternateCount = [...detailPage.matchAll(/rel="alternate" hreflang=/g)].length;
      if (!detailPage.includes(`<link rel="canonical" href="${canonical}">`) || !detailPage.includes('name="description"') || !detailPage.includes('primaryImageOfPage') || !detailPage.includes("<h1>") || alternateCount !== Object.keys(languages).length) {
        throw new Error(`Incomplete SEO metadata on ${language} photo detail page for project ${project.id}`);
      }
      if (!sitemap.includes(`<loc>${canonical}</loc>`)) throw new Error(`Photo detail page missing from sitemap: ${canonical}`);
    }
  }
  for (const item of gallery.projects) {
    const asset = path.join(root, item.image.replace(/^\//, ""));
    if (!fs.existsSync(asset)) throw new Error(`Missing portfolio image: ${item.image}`);
  }
  for (const video of videos) {
    const poster = path.join(root, video.poster.replace(/^\//, ""));
    const page = path.join(root, "portfolio", "videos", video.slug, "index.html");
    if (!fs.existsSync(poster) || !fs.existsSync(page)) throw new Error(`Missing video asset or page: ${video.slug}`);
  }
}

for (const language of Object.keys(languages)) renderHome(language);
const allItems = mixItems();
for (const language of Object.keys(languages)) {
  const pagePath = language === "fa" ? "portfolio/all.html" : `${language}/portfolio/all.html`;
  fs.mkdirSync(path.dirname(path.join(root, pagePath)), { recursive: true });
  fs.writeFileSync(path.join(root, pagePath), renderCollection(language, allItems), "utf8");
  const projects = [...gallery.projects].sort((left, right) => left.id - right.id);
  projects.forEach((project, index) => {
    const pageFile = language === "fa"
      ? path.join(root, "portfolio", "photos", photoSlugs[project.id], "index.html")
      : path.join(root, language, "portfolio", "photos", photoSlugs[project.id], "index.html");
    fs.mkdirSync(path.dirname(pageFile), { recursive: true });
    fs.writeFileSync(pageFile, renderPhotoPage(language, project, projects[(index - 1 + projects.length) % projects.length], projects[(index + 1) % projects.length]), "utf8");
  });
}
updateSitemap();
verifyGenerated(allItems);
