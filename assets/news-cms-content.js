(() => {
  const locale = (document.documentElement.lang || "fa").split("-")[0].toLowerCase();
  const prefix = locale === "fa" ? "" : `/${locale}`;
  const text = (element, value) => { if (element && value !== undefined) element.textContent = String(value); };
  const setMeta = (selector, value) => {
    const element = document.querySelector(selector);
    if (element && value) element.content = value;
  };
  const updateSchema = (article, slug) => {
    const script = document.querySelector('script[type="application/ld+json"]');
    if (!script) return;
    try {
      const schema = JSON.parse(script.textContent);
      const canonical = `https://lenabahri.ir${prefix}/khabar/beauty/${slug}/`;
      const graph = schema["@graph"] || [schema];
      const newsArticle = graph.find((item) => ["NewsArticle", "Article"].includes(item["@type"])) || graph[0];
      Object.assign(newsArticle, { "@type": article.schemaType || "NewsArticle", headline: article.title, description: article.description, image: [`https://lenabahri.ir${article.image}`], mainEntityOfPage: canonical, dateModified: new Date().toISOString().slice(0, 10) });
      script.textContent = JSON.stringify(schema).replace(/</g, "\\u003c");
    } catch {}
  };
  const applyArticle = (entry) => {
    const article = locale === "fa" ? entry.article : entry.article.translations?.[locale];
    if (!article) return;
    const slug = entry.slug;
    const pageTitle = article.metaTitle || article.title;
    document.title = `${pageTitle} | ${locale === "fa" ? "لنا بحری" : "Lena Bahri"}`;
    setMeta('meta[name="description"]', article.description);
    setMeta('meta[property="og:title"]', pageTitle);
    setMeta('meta[property="og:description"]', article.description);
    setMeta('meta[property="og:url"]', `https://lenabahri.ir${prefix}/khabar/beauty/${slug}/`);
    setMeta('meta[property="og:image"]', `https://lenabahri.ir${article.image}`);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = `https://lenabahri.ir${prefix}/khabar/beauty/${slug}/`;
    text(document.querySelector(".article-heading h1"), article.title);
    text(document.querySelector(".article-dek"), article.excerpt);
    text(document.querySelector(".article-lead"), article.lead);
    text(document.querySelector(".article-heading .news-category"), article.categoryLabel || entry.article.categoryLabel || entry.article.category);
    const hero = document.querySelector(".article-hero img");
    if (hero) { hero.src = article.image || entry.article.image; hero.alt = article.imageAlt || entry.article.imageAlt || article.title; }
    const newsArticle = document.querySelector(".news-article");
    const sourceNote = newsArticle?.querySelector(".source-note");
    if (newsArticle && sourceNote) {
      for (const section of newsArticle.querySelectorAll(":scope > section:not(.source-note):not(.related-section):not(.news-community)")) section.remove();
      for (const section of article.sections || entry.article.sections || []) {
        const node = document.createElement("section");
        const heading = document.createElement("h2");
        heading.textContent = section.heading || "";
        node.append(heading);
        for (const paragraph of section.paragraphs || []) {
          const item = document.createElement("p");
          item.textContent = paragraph;
          node.append(item);
        }
        newsArticle.insertBefore(node, sourceNote);
      }
    }
    const sourceLink = sourceNote?.querySelector("ol a");
    if (sourceLink) {
      sourceLink.href = entry.article.sourceUrl;
      sourceLink.textContent = `${entry.article.sourceTitle || entry.article.sourceUrl} — ${entry.article.sourceLabel || "Source"}`;
    }
    const community = document.querySelector("[data-news-community]");
    if (community) community.dataset.articleSlug = slug;
    updateSchema({ ...entry.article, ...article }, slug);
  };
  const image = (source, alt) => {
    const element = document.createElement("img");
    element.src = source;
    element.alt = alt || "";
    element.loading = "lazy";
    return element;
  };
  const addHubArticles = async () => {
    const list = document.querySelector("#all-news.news-list");
    if (!list) return;
    try {
      const response = await fetch("/api/public/news", { cache: "no-cache" });
      if (!response.ok) return;
      const result = await response.json();
      const existing = new Set([...list.querySelectorAll(".news-card a[href]")].map((link) => new URL(link.href).pathname.replace(/\/$/, "")));
      const added = [];
      for (const entry of result.articles || []) {
        const article = locale === "fa" ? entry.article : entry.article.translations?.[locale];
        const target = `${prefix}/khabar/beauty/${entry.slug}/`;
        if (!article?.title || existing.has(target.replace(/\/$/, ""))) continue;
        const card = document.createElement("article");
        card.className = "news-card";
        card.dataset.category = article.category || entry.article.category || "all";
        const imageLink = document.createElement("a");
        imageLink.className = "news-card-image";
        imageLink.href = target;
        imageLink.append(image(article.image || entry.article.image, article.imageAlt || entry.article.imageAlt || article.title));
        const copy = document.createElement("div");
        copy.className = "news-card-copy";
        const category = document.createElement("span");
        category.className = "news-category";
        category.textContent = article.categoryLabel || entry.article.categoryLabel || entry.article.category || "Beauty";
        const title = document.createElement("h2");
        const titleLink = document.createElement("a");
        titleLink.href = target;
        titleLink.textContent = article.title;
        title.append(titleLink);
        const excerpt = document.createElement("p");
        excerpt.textContent = article.excerpt || article.description;
        const more = document.createElement("a");
        more.className = "read-more";
        more.href = target;
        more.textContent = locale === "fa" ? "خواندن گزارش ←" : locale === "ar" ? "اقرئي التقرير ←" : locale === "zh" ? "阅读报道 ←" : "Read story →";
        copy.append(category, title, excerpt, more);
        card.append(imageLink, copy);
        list.append(card);
        existing.add(target.replace(/\/$/, ""));
        added.push({ slug: entry.slug, title: article.title });
      }
      if (added.length) {
        const script = [...document.querySelectorAll('script[type="application/ld+json"]')].find((item) => item.textContent.includes('"ItemList"'));
        if (script) {
          try {
            const schema = JSON.parse(script.textContent);
            const listSchema = (schema["@graph"] || []).find((item) => item["@type"] === "ItemList");
            if (listSchema) {
              const known = new Set((listSchema.itemListElement || []).map((item) => item.url));
              for (const item of added) {
                const url = `https://lenabahri.ir${prefix}/khabar/beauty/${item.slug}/`;
                if (known.has(url)) continue;
                listSchema.itemListElement.push({ "@type": "ListItem", position: listSchema.itemListElement.length + 1, url, name: item.title });
              }
              listSchema.numberOfItems = listSchema.itemListElement.length;
              script.textContent = JSON.stringify(schema).replace(/</g, "\\u003c");
            }
          } catch {}
        }
      }
    } catch {}
  };

  const hub = document.querySelector("#all-news.news-list");
  if (hub) void addHubArticles();
  const community = document.querySelector("[data-news-community]");
  if (community?.dataset.articleSlug) {
    fetch(`/api/public/news/${encodeURIComponent(community.dataset.articleSlug)}`, { cache: "no-cache" })
      .then((response) => response.ok ? response.json() : null)
      .then((entry) => { if (entry) applyArticle(entry); })
      .catch(() => {});
  }
})();
