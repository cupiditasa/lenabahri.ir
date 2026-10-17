import html
import json
import re
from pathlib import Path
from urllib.parse import urljoin, urlsplit
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "data" / "beauty-news.json").read_text(encoding="utf-8"))
EXTRA_PATH = ROOT / "data" / "beauty-news-extra.json"
UNPUBLISHED_EXTRA_SLUGS = set()
if EXTRA_PATH.exists():
    EXTRA = json.loads(EXTRA_PATH.read_text(encoding="utf-8"))
    DATA["categories"].extend(EXTRA.get("categories", []))
    category_labels = {category["slug"]: category["label"] for category in DATA["categories"]}
    article_overrides = EXTRA.get("articleOverrides", {})
    slug_overrides = {slug: values.get("slug", slug) for slug, values in article_overrides.items()}
    extra_articles = []
    for article in EXTRA.get("articles", []):
        original_slug = article["slug"]
        published = EXTRA.get("publicationOverrides", {}).get(original_slug, article.pop("published", False))
        if not published:
            UNPUBLISHED_EXTRA_SLUGS.add(original_slug)
            continue
        article.update(article_overrides.get(original_slug, {}))
        article.update(article_overrides.get(original_slug + "-content", {}))
        article.update(EXTRA.get("sourceOverrides", {}).get(article["sourceUrl"], {}))
        if article["slug"] != original_slug:
            article["image"] = article["image"].replace(original_slug, article["slug"])
        article["related"] = [slug_overrides.get(slug, slug) for slug in article.get("related", [])]
        article.setdefault("categoryLabel", category_labels[article["category"]])
        article.setdefault("metaTitle", article["title"][:65])
        article.setdefault("readingTime", 4)
        article.setdefault("schemaType", "NewsArticle")
        article.setdefault("serviceUrl", "")
        article.setdefault("serviceLabel", "")
        article["sections"] = [
            {"heading": article.pop("sourceHeading"), "paragraphs": [article.pop("sourceSummary")]},
            {"heading": article.pop("editorHeading"), "paragraphs": [article.pop("editorialTake")]},
        ]
        extra_articles.append(article)
    DATA["articles"].extend(extra_articles)
    for slug, image in EXTRA.get("imageOverrides", {}).items():
        article = next((item for item in DATA["articles"] if item["slug"] == slug), None)
        if article is None:
            raise ValueError(f"Image override refers to unknown article: {slug}")
        article["image"], article["imageAlt"] = image
    for slug, values in EXTRA.get("serviceOverrides", {}).items():
        article = next((item for item in DATA["articles"] if item["slug"] == slug), None)
        if article is None:
            raise ValueError(f"Service override refers to unknown article: {slug}")
        article.update(values)
SITE = DATA["siteUrl"].rstrip("/")
NEWS_PATH = "/khabar/beauty/"
EDITORIAL_PATH = NEWS_PATH + "editorial-policy/"
PUBLISHER = DATA["publisher"]
NEWSROOM = DATA["newsroom"]
PUBLISH_DATE = DATA["publishedAt"]
MODIFIED_DATE = DATA.get("modifiedAt", PUBLISH_DATE)


def esc(value):
    return html.escape(str(value), quote=True)


def absolute(path):
    return urljoin(SITE + "/", path.lstrip("/"))


def article_path(slug):
    return f"{NEWS_PATH}{slug}/"


def normalize_article_urls(content):
    return re.sub(r'(/khabar/beauty/[a-z0-9-]+)(?=["\'?#])', r'\1/', content)


def json_ld(value):
    return json.dumps(value, ensure_ascii=False).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")


def date_label(value):
    return DATA["publishedLabel"] if value == PUBLISH_DATE else value


def doc_head(title, description, canonical, image, schema, og_type="website"):
    canonical_path = urlsplit(canonical).path
    alternate_tags = []
    for locale, language in (("en", "en"), ("ar", "ar"), ("zh", "zh-CN")):
        translated_path = ROOT / locale / canonical_path.lstrip("/")
        if canonical_path.endswith("/"):
            translated_path = translated_path / "index.html"
        if translated_path.is_file():
            alternate_tags.append(f'<link rel="alternate" hreflang="{language}" href="https://lenabahri.ir/{locale}{canonical_path}">')
    if alternate_tags:
        alternate_tags.extend((
            f'<link rel="alternate" hreflang="fa" href="{esc(canonical)}">',
            f'<link rel="alternate" hreflang="x-default" href="{esc(canonical)}">',
        ))
    alternate_markup = "\n  ".join(alternate_tags)
    return f'''<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(description)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="{esc(canonical)}">
  {alternate_markup}
  <meta property="og:type" content="{esc(og_type)}">
  <meta property="og:locale" content="fa_IR">
  <meta property="og:site_name" content="{esc(PUBLISHER)}">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(description)}">
  <meta property="og:url" content="{esc(canonical)}">
  <meta property="og:image" content="{esc(absolute(image))}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(title)}">
  <meta name="twitter:description" content="{esc(description)}">
  <meta name="twitter:image" content="{esc(absolute(image))}">
  <link rel="stylesheet" href="/assets/beauty-news.css">
  <link rel="stylesheet" href="/assets/news-community.css?v=20261014-1">
  <script type="application/ld+json">{json_ld(schema)}</script>
</head>'''


def page_header():
    return f'''<header class="news-header"><a class="news-brand" href="/" aria-label="{esc(PUBLISHER)}، صفحهٔ اصلی"><span class="news-brand-mark">LB</span><span><strong>{esc(PUBLISHER)}</strong><small>BEAUTY JOURNAL</small></span></a><nav aria-label="منوی اصلی"><a href="/">خانه</a><a href="/portfolio.html">نمونه‌کارها</a><a href="{NEWS_PATH}" aria-current="page">اخبار زیبایی</a></nav><a class="news-header-cta" href="/about.html">ارتباط با لنا</a></header>'''


def crumbs(label=None):
    tail = f'<span aria-hidden="true">/</span><span>{esc(label)}</span>' if label else ""
    return f'<nav class="news-crumbs" aria-label="مسیر صفحه"><a href="/">خانه</a><span aria-hidden="true">/</span><a href="{NEWS_PATH}">اخبار دنیای زیبایی</a>{tail}</nav>'


def source_schema(article):
    return {
        "@type": article.get("schemaType", "NewsArticle"),
        "headline": article["title"],
        "description": article["description"],
        "image": [absolute(article["image"])],
        "datePublished": PUBLISH_DATE,
        "dateModified": article.get("modifiedAt", MODIFIED_DATE),
        "author": {"@type": "Organization", "name": NEWSROOM, "url": absolute(EDITORIAL_PATH)},
        "publisher": {"@type": "Organization", "name": PUBLISHER, "url": absolute("/")},
        "mainEntityOfPage": {"@type": "WebPage", "@id": absolute(article_path(article["slug"]))},
        "articleSection": article["categoryLabel"],
        "keywords": article["keywords"],
        "inLanguage": "fa-IR",
        "isBasedOn": [source["url"] for source in source_records(article)],
    }


def source_records(article):
    records = article.get("sources")
    if records is not None:
        valid = [
            source for source in records
            if all(source.get(field) for field in ("label", "title", "url", "date"))
        ]
        unique_urls = {source["url"].rstrip("/") for source in valid}
        unique_publishers = {source["label"].strip().casefold() for source in valid}
        if len(unique_urls) < 2 or len(unique_publishers) < 2:
            raise ValueError(f"Article {article.get('slug', '(unknown)')} needs at least two distinct sources.")
        return valid
    return [{
        "label": article["sourceLabel"],
        "title": article["sourceTitle"],
        "url": article["sourceUrl"],
        "date": article["sourceDate"],
    }]

def source_row_html(article, source):
    date_html = f'<small>{esc(source["date"])}</small>' if article.get("sources") else ""
    return f'<li><a href="{esc(source["url"])}" target="_blank" rel="noopener noreferrer">{esc(source["title"])} — {esc(source["label"])} <span aria-hidden="true">&nearr;</span></a>{date_html}</li>'


def article_page(article, by_slug):
    canonical = absolute(article_path(article["slug"]))
    related = [by_slug[slug] for slug in article.get("related", []) if slug in by_slug and slug != article["slug"]]
    related_html = "".join(f'<a class="related-link" href="{NEWS_PATH}{esc(item["slug"])}"><span>{esc(item["categoryLabel"])}</span><strong>{esc(item["title"])}</strong></a>' for item in related[:3])
    sections = "".join(f'<section><h2>{esc(section["heading"])}</h2>{"".join(f"<p>{esc(paragraph)}</p>" for paragraph in section["paragraphs"])}</section>' for section in article["sections"])
    source_rows = "".join(source_row_html(article, source) for source in source_records(article))
    source_intro = (
        f'این مطلب بر پایهٔ منبع زیر با کمک ابزارهای هوش مصنوعی برای پیش‌نویس و جمع‌بندی تحریریه تهیه شده است. تاریخ انتشار منبع: {esc(article["sourceDate"])}.'
        if not article.get("sources")
        else "این گزارش بر پایهٔ منابع زیر تهیه شده است. تاریخ هر منبع کنار پیوند آن آمده است؛ مطلب، جمع‌بندی اختصاصی تحریریه است و بازنشر متن منبع نیست."
    )
    service_note = ""
    if article.get("serviceUrl"):
        service_note = f'''    <aside class="service-note"><div><span>خدمات مرتبط در شیراز</span><h2>{esc(article.get("serviceLabel") or "اطلاعات خدمات")}</h2><p>{esc(article.get("serviceContext") or "این گزارش عمومی جایگزین مشاورهٔ فردی نیست؛ جزئیات خدمات را جداگانه بررسی کنید.")}</p></div><a href="{esc(article["serviceUrl"])}">{esc(article.get("serviceLinkLabel") or "مشاهده جزئیات")} <span aria-hidden="true">←</span></a></aside>'''
    schema = {"@context": "https://schema.org", "@graph": [source_schema(article), {
        "@type": "WebPage", "url": canonical,
        "reviewedBy": {"@type": "Person", "name": "لنا بحری", "url": absolute("/about.html"), "jobTitle": "مستر آرتیست و مدرس آرایش دائم"},
        "mainEntity": {"@id": canonical},
    }, {
        "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "خانه", "item": absolute("/")},
            {"@type": "ListItem", "position": 2, "name": "اخبار دنیای زیبایی", "item": absolute(NEWS_PATH)},
            {"@type": "ListItem", "position": 3, "name": article["title"], "item": canonical},
        ]}]}
    body = f'''<body class="beauty-news">
{page_header()}
<main class="news-shell news-article-shell">
  {crumbs(article["title"])}
  <article class="news-article">
    <header class="article-heading"><a class="news-category" href="{NEWS_PATH}#category-{esc(article["category"])}">{esc(article["categoryLabel"])}</a><h1>{esc(article["title"])}</h1><p class="article-dek">{esc(article["excerpt"])}</p><div class="article-byline"><span>نویسنده: <a href="{EDITORIAL_PATH}">{esc(NEWSROOM)}</a></span><span>بازبینی تخصصی: <a href="/about.html">لنا بحری</a></span><time datetime="{PUBLISH_DATE}">{esc(date_label(PUBLISH_DATE))}</time><span>{esc(article["readingTime"])} دقیقه مطالعه</span></div></header>
    <figure class="article-hero"><img src="{esc(article["image"])}" alt="{esc(article["imageAlt"])}" fetchpriority="high"><figcaption>تصویرسازی هوش مصنوعی اختصاصی برای این موضوع؛ نه عکس خبری و نه نمونه‌کار.</figcaption></figure>
    <p class="article-lead">{esc(article["lead"])}</p>
    {sections}
    <aside class="source-note"><h2>منبع و تاریخ گزارش</h2><p>{source_intro}</p><ol>{source_rows}</ol><small>این صفحه در {esc(date_label(PUBLISH_DATE))} به فارسی منتشر شده است. جزئیات روش تهیه و محدودیت‌های این گزارش را در <a href="{EDITORIAL_PATH}">اصول تحریریه</a> بخوانید.</small></aside>
{service_note}
    <section class="related-section"><h2>مطالب مرتبط</h2><div class="related-grid">{related_html}</div></section>
  </article>
  <section class="news-community" data-news-community data-article-slug="{esc(article["slug"])}" aria-live="polite"></section>
  <p class="back-to-news"><a href="{NEWS_PATH}">← بازگشت به همهٔ خبرهای زیبایی</a></p>
</main>
<footer class="news-footer"><span>© {PUBLISH_DATE[:4]} {esc(PUBLISHER)}</span><a href="/">صفحهٔ اصلی</a><a href="/about.html">دربارهٔ لنا</a><a href="{EDITORIAL_PATH}">اصول تحریریه</a></footer>
<script src="/assets/news-community.js?v=20261014-1" defer></script>
</body></html>'''
    return doc_head(article["metaTitle"], article["description"], canonical, article["image"], schema, "article") + body


def hub_page():
    canonical = absolute(NEWS_PATH)
    description = "خبرها و تحلیل‌های منتخب دنیای زیبایی؛ از ترند آرایش و طراحی ابرو تا راهنمای ایمنی آرایش دائم، با ذکر منبع و تاریخ."
    image = DATA["articles"][0]["image"]
    cards = []
    for article in DATA["articles"]:
        cards.append(f'''<article class="news-card" data-category="{esc(article["category"])}"><a class="news-card-image" href="{NEWS_PATH}{esc(article["slug"])}"><img src="{esc(article["image"])}" alt="{esc(article["imageAlt"])}" loading="lazy"></a><div class="news-card-copy"><span class="news-category">{esc(article["categoryLabel"])}</span><p class="news-card-meta">{esc(date_label(PUBLISH_DATE))} <span>·</span> {esc(article["readingTime"])} دقیقه</p><h2><a href="{NEWS_PATH}{esc(article["slug"])}">{esc(article["title"])}</a></h2><p>{esc(article["excerpt"])}</p><a class="read-more" href="{NEWS_PATH}{esc(article["slug"])}">خواندن گزارش <span aria-hidden="true">←</span></a></div></article>''')
    cat_items = "".join(f'<li><a href="{NEWS_PATH}{esc(a["slug"])}">{esc(a["title"])}</a></li>' for a in DATA["articles"])
    schema = {"@context": "https://schema.org", "@graph": [
        {"@type": "CollectionPage", "name": "خبرهای دنیای زیبایی | لنا بحری", "description": description, "url": canonical, "inLanguage": "fa-IR", "publisher": {"@type": "Organization", "name": PUBLISHER, "url": absolute("/")}},
        {"@type": "ItemList", "name": "منتخب خبرهای دنیای زیبایی", "numberOfItems": len(DATA["articles"]), "itemListElement": [{"@type": "ListItem", "position": index, "url": absolute(NEWS_PATH + a["slug"]), "name": a["title"]} for index, a in enumerate(DATA["articles"], 1)]},
        {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "خانه", "item": absolute("/")}, {"@type": "ListItem", "position": 2, "name": "اخبار دنیای زیبایی", "item": canonical}]},
    ]}
    body = f'''<body class="beauty-news">
{page_header()}
<main class="news-shell">
  {crumbs()}
  <section class="news-masthead"><div><span class="eyebrow">LENA BAHRI · BEAUTY JOURNAL</span><h1>خبرهای دنیای زیبایی</h1><p>منتخب خبرها و تحلیل‌های روز دنیای زیبایی؛ از آرایش و ترندهای ابرو تا نکات آگاهانه دربارهٔ آرایش دائم. هر مطلب منبع و تاریخ مشخص دارد.</p><span class="masthead-date">به‌روزرسانی تحریریه: {esc(date_label(PUBLISH_DATE))}</span></div><div class="masthead-ornament" aria-hidden="true"><span>LB</span><i></i></div></section>
  <nav class="category-nav" aria-label="دسته‌بندی خبرها"><a class="active" href="#all-news" data-filter="all">همهٔ خبرها</a>{"".join(f'<a href="#category-{esc(c["slug"])}" data-filter="{esc(c["slug"])}">{esc(c["label"])}</a>' for c in DATA["categories"])}</nav>
  <section class="news-list" id="all-news" aria-label="فهرست خبرها">{"".join(cards)}</section>
  <section class="news-categories"><div class="section-heading"><span>EXPLORE</span><h2>موضوعات این مجموعه</h2></div><div class="category-panels">{"".join(f'<section id="category-{esc(c["slug"])}"><h3>{esc(c["label"])}</h3><p>{esc(c["description"])}</p><ul>{"".join(f"<li><a href=\"{NEWS_PATH}{esc(a['slug'])}\">{esc(a['title'])}</a></li>" for a in DATA["articles"] if a["category"] == c["slug"])}</ul></section>' for c in DATA["categories"])}</div></section>
  <aside class="editorial-note"><span>یادداشت تحریریه</span><p>موضوعات مد و زیبایی ممکن است با بازارها و سلیقه‌های مختلف تفاوت داشته باشند. گزارش‌های ایمنی با ذکر نهاد و حوزهٔ جغرافیایی منبع ارائه می‌شوند؛ برای تصمیم شخصی دربارهٔ سلامت یا آرایش دائم با متخصص واجد صلاحیت مشورت کنید.</p></aside>
</main>
<footer class="news-footer"><span>© {PUBLISH_DATE[:4]} {esc(PUBLISHER)}</span><a href="/">صفحهٔ اصلی</a><a href="/about.html">دربارهٔ لنا</a><a href="/portfolio.html">نمونه‌کارها</a><a href="{EDITORIAL_PATH}">اصول تحریریه</a></footer>
<script src="/assets/beauty-news.js" defer></script>
</body></html>'''
    return doc_head("خبرهای دنیای زیبایی | ترندها و راهنماها | لنا بحری", description, canonical, image, schema) + body


def editorial_page():
    canonical = absolute(EDITORIAL_PATH)
    title = "اصول تحریریه و روش تهیهٔ خبرها | لنا بحری"
    description = "روش تهیه، منبع‌دهی، تصویرها و محدودیت‌های خبرهای دنیای زیبایی در وب‌سایت لنا بحری."
    image = DATA["articles"][0]["image"]
    schema = {"@context": "https://schema.org", "@graph": [
        {"@type": "AboutPage", "name": title, "description": description, "url": canonical, "inLanguage": "fa-IR", "publisher": {"@type": "Organization", "name": PUBLISHER, "url": absolute("/")}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "خانه", "item": absolute("/")},
            {"@type": "ListItem", "position": 2, "name": "اخبار دنیای زیبایی", "item": absolute(NEWS_PATH)},
            {"@type": "ListItem", "position": 3, "name": "اصول تحریریه", "item": canonical},
        ]},
    ]}
    body = f'''<body class="beauty-news">
{page_header()}
<main class="news-shell news-article-shell">
  {crumbs("اصول تحریریه")}
  <article class="news-article">
    <header class="article-heading"><h1>اصول تحریریهٔ خبرهای دنیای زیبایی</h1><p class="article-dek">شفافیت دربارهٔ نویسنده، منبع‌ها، تصویرها و محدودیت‌های این مجموعه.</p></header>
    <section><h2>نویسنده و بازبینی تخصصی</h2><p>نویسندهٔ مطالب این مجموعه «{esc(NEWSROOM)}» است؛ نامی برای محتوای تحریریهٔ وب‌سایت. همهٔ مقاله‌های این مجموعه را لنا بحری، مستر آرتیست و مدرس آرایش دائم، خوانده و تأیید کرده است. این بازبینی به‌معنای نویسندگی یا تأیید پزشکی/درمانی مطالب نیست.</p></section>
    <section><h2>روش تهیه</h2><p>برای تهیهٔ پیش‌نویس و جمع‌بندی فارسی از ابزارهای هوش مصنوعی کمک گرفته می‌شود و منبع هر گزارش در همان صفحه پیوند داده شده است. این مطالب خلاصه و توضیح تحریریه از منابع عمومی‌اند؛ ادعای آزمایش مستقل محصول، مصاحبهٔ اختصاصی یا تجربهٔ درمانی نیستند، مگر آن‌که همان صفحه صریحاً چنین چیزی را مستند کند.</p></section>
    <section><h2>منبع و محدودهٔ جغرافیایی</h2><p>تاریخ منبع از تاریخ انتشار مطلب فارسی جداگانه درج می‌شود. اطلاعات نهادهای خارجی مانند FDA مربوط به همان حوزهٔ قضایی است و به‌معنای تفسیر قوانین ایران نیست.</p></section>
    <section><h2>تصویرها و موضوعات سلامت</h2><p>تصویرهای دارای برچسب تصویرسازی هوش مصنوعی، عکس واقعیِ رویداد، محصول، محیط کار یا نمونه‌کار نیستند. مطالب ایمنی و پوست نیز توصیهٔ پزشکی یا جایگزین مشورت با پزشک و متخصص واجد صلاحیت محسوب نمی‌شوند.</p></section>
    <section><h2>اصلاح و بازخورد</h2><p>اگر خطا یا منبع تازه‌ای دیدید، از راه صفحهٔ <a href="/about.html">دربارهٔ لنا و ارتباط</a> اطلاع دهید تا مطلب بررسی و در صورت نیاز اصلاح شود.</p></section>
  </article>
  <p class="back-to-news"><a href="{NEWS_PATH}">← بازگشت به خبرهای زیبایی</a></p>
</main>
<footer class="news-footer"><span>© {PUBLISH_DATE[:4]} {esc(PUBLISHER)}</span><a href="/">صفحهٔ اصلی</a><a href="{NEWS_PATH}">اخبار زیبایی</a><a href="/about.html">ارتباط</a></footer>
</body></html>'''
    return doc_head(title, description, canonical, image, schema) + body


def update_sitemap():
    sitemap_path = ROOT / "sitemap.xml"
    sitemap_text = sitemap_path.read_text(encoding="utf-8")
    root = ET.fromstring(sitemap_text)
    namespace = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
    managed_paths = ["/", NEWS_PATH, EDITORIAL_PATH] + [article_path(article["slug"]) for article in DATA["articles"]]
    article_modified_dates = {article_path(article["slug"]): article.get("modifiedAt", MODIFIED_DATE) for article in DATA["articles"]}
    entries = {node.findtext(namespace + "loc"): node for node in root.findall(namespace + "url")}
    for article in DATA["articles"]:
        old_location = absolute(NEWS_PATH + article["slug"])
        new_location = absolute(article_path(article["slug"]))
        old_node = entries.pop(old_location, None)
        if old_node is None:
            continue
        if new_location in entries:
            root.remove(old_node)
        else:
            old_node.find(namespace + "loc").text = new_location
            entries[new_location] = old_node
    for slug in UNPUBLISHED_EXTRA_SLUGS:
        unpublished_paths = [article_path(slug)] + [f"/{locale}/{article_path(slug).lstrip('/')}" for locale in ("en", "ar", "zh")]
        for path in unpublished_paths:
            node = entries.pop(absolute(path), None)
            if node is not None:
                root.remove(node)
    for path in managed_paths:
        loc = absolute(path)
        modified_date = article_modified_dates.get(path, MODIFIED_DATE)
        node = entries.get(loc)
        if node is None:
            node = ET.SubElement(root, namespace + "url")
            ET.SubElement(node, namespace + "loc").text = loc
            ET.SubElement(node, namespace + "lastmod").text = modified_date
            ET.SubElement(node, namespace + "changefreq").text = "monthly"
            ET.SubElement(node, namespace + "priority").text = "0.7" if path in ("/", NEWS_PATH) else "0.6"
            entries[loc] = node
            continue
        lastmod = node.find(namespace + "lastmod")
        if lastmod is None:
            lastmod = ET.SubElement(node, namespace + "lastmod")
        lastmod.text = modified_date
    ET.register_namespace("", "http://www.sitemaps.org/schemas/sitemap/0.9")
    ET.indent(root, space="  ")
    xml_content = ET.tostring(root, encoding="unicode")
    sitemap_path.write_text('<?xml version="1.0" encoding="UTF-8"?>\n' + xml_content + "\n", encoding="utf-8")


def main():
    by_slug = {article["slug"]: article for article in DATA["articles"]}
    if len(by_slug) != len(DATA["articles"]):
        raise ValueError("Article slugs must be unique")
    image_paths = [article["image"] for article in DATA["articles"]]
    if len(set(image_paths)) != len(image_paths):
        raise ValueError("Every article must have its own unique image")
    for article in DATA["articles"]:
        image_path = ROOT / article["image"].lstrip("/")
        if not image_path.is_file():
            raise FileNotFoundError(f"Missing image for {article['slug']}: {image_path}")
        if not article.get("imageAlt", "").strip():
            raise ValueError(f"Image alt text is required: {article['slug']}")
    (ROOT / "khabar" / "beauty").mkdir(parents=True, exist_ok=True)
    (ROOT / "khabar" / "beauty" / "index.html").write_text(normalize_article_urls(hub_page()), encoding="utf-8")
    policy_dir = ROOT / EDITORIAL_PATH.strip("/")
    policy_dir.mkdir(parents=True, exist_ok=True)
    (policy_dir / "index.html").write_text(editorial_page(), encoding="utf-8")
    for article in DATA["articles"]:
        if not re.fullmatch(r"[a-z0-9-]+", article["slug"]):
            raise ValueError(f"Invalid slug: {article['slug']}")
        article_dir = ROOT / "khabar" / "beauty" / article["slug"]
        article_dir.mkdir(parents=True, exist_ok=True)
        (article_dir / "index.html").write_text(normalize_article_urls(article_page(article, by_slug)), encoding="utf-8")
    update_sitemap()


if __name__ == "__main__":
    main()
