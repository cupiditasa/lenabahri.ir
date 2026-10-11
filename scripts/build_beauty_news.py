import html
import json
import re
from pathlib import Path
from urllib.parse import urljoin
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "data" / "beauty-news.json").read_text(encoding="utf-8"))
EXTRA_PATH = ROOT / "data" / "beauty-news-extra.json"
if EXTRA_PATH.exists():
    EXTRA = json.loads(EXTRA_PATH.read_text(encoding="utf-8"))
    DATA["categories"].extend(EXTRA.get("categories", []))
    category_labels = {category["slug"]: category["label"] for category in DATA["categories"]}
    article_overrides = EXTRA.get("articleOverrides", {})
    slug_overrides = {slug: values.get("slug", slug) for slug, values in article_overrides.items()}
    extra_articles = []
    for article in EXTRA.get("articles", []):
        if not article.pop("published", True):
            continue
        original_slug = article["slug"]
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
        article.setdefault("serviceUrl", "/nano-brows-shiraz.html" if article["category"] == "brows" else "/lip-blush-shiraz.html")
        article.setdefault("serviceLabel", "مشاهده خدمات مرتبط در شیراز")
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
SITE = DATA["siteUrl"].rstrip("/")
NEWS_PATH = "/khabar/beauty/"
PUBLISHER = DATA["publisher"]
NEWSROOM = DATA["newsroom"]
PUBLISH_DATE = DATA["publishedAt"]


def esc(value):
    return html.escape(str(value), quote=True)


def absolute(path):
    return urljoin(SITE + "/", path.lstrip("/"))


def json_ld(value):
    return json.dumps(value, ensure_ascii=False).replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")


def date_label(value):
    return DATA["publishedLabel"] if value == PUBLISH_DATE else value


def doc_head(title, description, canonical, image, schema, og_type="website"):
    return f'''<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(description)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="{esc(canonical)}">
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
        "dateModified": PUBLISH_DATE,
        "author": {"@type": "Organization", "name": NEWSROOM, "url": absolute(NEWS_PATH)},
        "publisher": {"@type": "Organization", "name": PUBLISHER, "url": absolute("/")},
        "mainEntityOfPage": {"@type": "WebPage", "@id": absolute(NEWS_PATH + article["slug"])},
        "articleSection": article["categoryLabel"],
        "keywords": article["keywords"],
        "inLanguage": "fa-IR",
        "isBasedOn": article["sourceUrl"],
    }


def article_page(article, by_slug):
    canonical = absolute(NEWS_PATH + article["slug"])
    related = [by_slug[slug] for slug in article.get("related", []) if slug in by_slug and slug != article["slug"]]
    related_html = "".join(f'<a class="related-link" href="{NEWS_PATH}{esc(item["slug"])}"><span>{esc(item["categoryLabel"])}</span><strong>{esc(item["title"])}</strong></a>' for item in related[:3])
    sections = "".join(f'<section><h2>{esc(section["heading"])}</h2>{"".join(f"<p>{esc(paragraph)}</p>" for paragraph in section["paragraphs"])}</section>' for section in article["sections"])
    extra_links = [item for item in DATA["articles"] if item["slug"] != article["slug"] and item not in related]
    extra = extra_links[0] if extra_links else None
    if len(related) < 2 and extra:
        related_html += f'<a class="related-link" href="{NEWS_PATH}{esc(extra["slug"])}"><span>{esc(extra["categoryLabel"])}</span><strong>{esc(extra["title"])}</strong></a>'
    schema = {"@context": "https://schema.org", "@graph": [source_schema(article), {
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
    <header class="article-heading"><a class="news-category" href="{NEWS_PATH}#category-{esc(article["category"])}">{esc(article["categoryLabel"])}</a><h1>{esc(article["title"])}</h1><p class="article-dek">{esc(article["excerpt"])}</p><div class="article-byline"><span>نویسنده: {esc(NEWSROOM)}</span><time datetime="{PUBLISH_DATE}">{esc(date_label(PUBLISH_DATE))}</time><span>{esc(article["readingTime"])} دقیقه مطالعه</span></div></header>
    <figure class="article-hero"><img src="{esc(article["image"])}" alt="{esc(article["imageAlt"])}" fetchpriority="high"><figcaption>تصویرسازی هوش مصنوعی اختصاصی برای این موضوع؛ نه عکس خبری و نه نمونه‌کار.</figcaption></figure>
    <p class="article-lead">{esc(article["lead"])}</p>
    {sections}
    <aside class="source-note"><h2>منبع و تاریخ گزارش</h2><p>این مطلب بر پایهٔ منبع زیر و با جمع‌بندی تحریریه تهیه شده است. تاریخ انتشار منبع: {esc(article["sourceDate"])}.</p><a href="{esc(article["sourceUrl"])}" target="_blank" rel="noopener noreferrer">{esc(article["sourceTitle"])} — {esc(article["sourceLabel"])} <span aria-hidden="true">↗</span></a><small>این صفحه در {esc(date_label(PUBLISH_DATE))} به فارسی منتشر شده و بازنویسی/تحلیل مستقل تحریریه است؛ نقل مستقیم طولانی از منبع نیست.</small></aside>
    <aside class="service-note"><div><span>از روند تا انتخاب شخصی</span><h2>{esc(article["serviceLabel"])}</h2><p>ترندهای آرایشی را از خدمات آرایش دائم جدا ببینید و برای تصمیم متناسب با شرایط خودتان مشاوره بگیرید.</p></div><a href="{esc(article["serviceUrl"])}">دیدن جزئیات خدمات <span aria-hidden="true">←</span></a></aside>
    <section class="related-section"><h2>مطالب مرتبط</h2><div class="related-grid">{related_html}</div></section>
  </article>
  <p class="back-to-news"><a href="{NEWS_PATH}">← بازگشت به همهٔ خبرهای زیبایی</a></p>
</main>
<footer class="news-footer"><span>© {PUBLISH_DATE[:4]} {esc(PUBLISHER)}</span><a href="/">صفحهٔ اصلی</a><a href="/about.html">دربارهٔ لنا</a></footer>
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
<footer class="news-footer"><span>© {PUBLISH_DATE[:4]} {esc(PUBLISHER)}</span><a href="/">صفحهٔ اصلی</a><a href="/about.html">دربارهٔ لنا</a><a href="/portfolio.html">نمونه‌کارها</a></footer>
<script src="/assets/beauty-news.js" defer></script>
</body></html>'''
    return doc_head("خبرهای دنیای زیبایی | ترندها و راهنماها | لنا بحری", description, canonical, image, schema) + body


def update_sitemap():
    sitemap_path = ROOT / "sitemap.xml"
    sitemap_text = sitemap_path.read_text(encoding="utf-8")
    root = ET.fromstring(sitemap_text)
    namespace = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
    existing = {node.findtext(namespace + "loc") for node in root.findall(namespace + "url")}
    new_urls = [NEWS_PATH] + [NEWS_PATH + article["slug"] for article in DATA["articles"]]
    additions = []
    for path in new_urls:
        loc = absolute(path)
        if loc in existing:
            continue
        priority = "0.7" if path == NEWS_PATH else "0.6"
        additions.append(f'''  <url>
    <loc>{loc}</loc>
    <lastmod>{PUBLISH_DATE}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>{priority}</priority>
  </url>''')
    if additions:
        for path in new_urls:
            loc = absolute(path)
            if loc in existing:
                continue
            node = ET.SubElement(root, namespace + "url")
            ET.SubElement(node, namespace + "loc").text = loc
            ET.SubElement(node, namespace + "lastmod").text = PUBLISH_DATE
            ET.SubElement(node, namespace + "changefreq").text = "monthly"
            ET.SubElement(node, namespace + "priority").text = "0.7" if path == NEWS_PATH else "0.6"
            existing.add(loc)
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
    (ROOT / "khabar" / "beauty" / "index.html").write_text(hub_page(), encoding="utf-8")
    for article in DATA["articles"]:
        if not re.fullmatch(r"[a-z0-9-]+", article["slug"]):
            raise ValueError(f"Invalid slug: {article['slug']}")
        article_dir = ROOT / "khabar" / "beauty" / article["slug"]
        article_dir.mkdir(parents=True, exist_ok=True)
        (article_dir / "index.html").write_text(article_page(article, by_slug), encoding="utf-8")
    update_sitemap()


if __name__ == "__main__":
    main()
