import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { runInNewContext } from "node:vm";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const locales = ["en", "ar", "zh"];
const htmlTokenPattern = /<!--[^]*?-->|<[^>]+>|[^<]+/g;
const translatableAttributes = new Set(["alt", "aria-label", "content", "placeholder", "title", "value"]);
const structuredDataMachineKeys = new Set(["@id", "url", "item", "image", "sameAs", "isBasedOn", "contentUrl", "embedUrl", "thumbnailUrl", "datePublished", "dateModified", "dateCreated", "datePosted", "uploadDate", "duration", "inLanguage"]);
const ignoredDirectories = new Set([".git", ".locale-preview", ".vps-tools", ".playwright-cli", "node_modules", "output", "en", "ar", "zh"]);
const ignoredPagePaths = new Set(["contact-me/index.html"]);

function decodeEntities(value) {
  return value.replace(/&(#x[\da-f]+|#\d+|amp|apos|gt|lt|nbsp|quot);/gi, (entity, code) => {
    if (code[0] === "#") {
      const number = code[1].toLowerCase() === "x" ? Number.parseInt(code.slice(2), 16) : Number.parseInt(code.slice(1), 10);
      return Number.isFinite(number) ? String.fromCodePoint(number) : entity;
    }
    return ({ amp: "&", apos: "'", gt: ">", lt: "<", nbsp: "\u00a0", quot: '"' })[code.toLowerCase()];
  });
}

function encodeText(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatLocaleDigits(value, locale) {
  const digits = locale === "ar" ? "٠١٢٣٤٥٦٧٨٩" : "0123456789";
  return value
    .replace(/[0-9۰-۹٠-٩]/g, (digit) => {
      const index = "0123456789۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩".indexOf(digit);
      if (index < 10) return digits[index];
      if (index < 20) return digits[index - 10];
      return digits[index - 20];
    })
    .replace(/٬/g, locale === "ar" ? "٬" : ",")
    .replace(/٫/g, locale === "ar" ? "٫" : ".");
}

function isTranslatable(value) {
  return /[\u0600-\u06ff]/u.test(value) && !/^\s*[\d٠-٩۰-۹\s.,:؛٬٫٪%+−–—/|()#]+\s*$/u.test(value);
}

function collectTranslatableValues(value, target) {
  if (typeof value === "string") {
    if (isTranslatable(value)) target.add(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectTranslatableValues(item, target));
    return;
  }
  if (!value || typeof value !== "object") return;
  const translations = value.translations;
  Object.entries(value).forEach(([key, item]) => {
    if (key === "translations") return;
    const translatedInEveryLocale = typeof item === "string"
      && locales.every((locale) => typeof translations?.[locale]?.[key] === "string" && translations[locale][key].trim());
    if (!translatedInEveryLocale) collectTranslatableValues(item, target);
  });
}

async function walk(directory, files = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(fullPath, files);
    else if (entry.isFile() && entry.name.endsWith(".html")) files.push(fullPath);
  }
  return files;
}

function replaceLocalizedText(value, catalog, missing) {
  const key = decodeEntities(value.trim()).replace(/\s+/g, " ");
  if (!isTranslatable(key)) return formatLocaleDigits(value, catalog.locale);
  const translation = catalog.page[key] ?? catalog.common[key];
  if (typeof translation !== "string" || !translation.trim()) {
    missing.add(key);
    return value;
  }
  const leading = value.match(/^\s*/)?.[0] || "";
  const trailing = value.match(/\s*$/)?.[0] || "";
  return `${leading}${encodeText(formatLocaleDigits(translation, catalog.locale))}${trailing}`;
}

function translateJson(value, catalog, missing, key = "") {
  if (typeof value === "string") {
    if (structuredDataMachineKeys.has(key) || /^(?:https?:\/\/|\/\/|\/)/i.test(value.trim()) || /^\d{4}-\d{2}-\d{2}(?:[Tt].*)?$/.test(value.trim()) || /^PT\d/i.test(value)) return value;
    return replaceLocalizedText(value, catalog, missing);
  }
  if (Array.isArray(value)) return value.map((item) => translateJson(item, catalog, missing, key));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([childKey, item]) => [childKey, translateJson(item, catalog, missing, childKey)]));
  }
  return value;
}

function localizeStructuredData(value, sourcePath, locale, pageSet, readyPages) {
  if (Array.isArray(value)) return value.map((item) => localizeStructuredData(item, sourcePath, locale, pageSet, readyPages));
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    if (key === "inLanguage") return [key, locale === "zh" ? "zh-CN" : locale === "ar" ? "ar" : "en-US"];
    if (typeof item === "string" && ["@id", "url", "item"].includes(key)) {
      const target = pageForHref(item, sourcePath, pageSet);
      if (target && readyPages.has(`${locale}:${target.page}`)) {
        const url = new URL(item, `https://lenabahri.ir${sourceRoute(sourcePath)}`);
        return [key, `https://lenabahri.ir${routeFor(target.page, locale)}${url.search}${url.hash}`];
      }
      return [key, item];
    }
    return [key, localizeStructuredData(item, sourcePath, locale, pageSet, readyPages)];
  }));
}

function translateAttribute(tag, catalog, missing) {
  let translatedTag = tag.replace(/\b([\w:-]+)\s*=\s*(["'])(.*?)\2/gs, (match, name, quote, value) => {
    if (!translatableAttributes.has(name.toLowerCase())) return match;
    const trimmedValue = value.trim();
    if (name.toLowerCase() === "content") {
      const metaName = tag.match(/\bname\s*=\s*(["'])(.*?)\1/i)?.[2]?.toLowerCase();
      if (["viewport", "theme-color"].includes(metaName) || /^(?:https?:\/\/|\/\/|\/)/i.test(trimmedValue) || /^\d{4}-\d{2}-\d{2}(?:[Tt].*)?$/.test(trimmedValue)) return match;
    }
    return `${name}=${quote}${replaceLocalizedText(value, catalog, missing)}${quote}`;
  });
  if (/property\s*=\s*["']og:locale["']/i.test(translatedTag)) {
    const socialLocale = localeSocialCode(catalog.locale);
    translatedTag = translatedTag.replace(/(content\s*=\s*["'])[^"']*(["'])/i, `$1${socialLocale}$2`);
  }
  return translatedTag;
}

function localeSocialCode(locale) {
  return locale === "zh" ? "zh_CN" : locale === "ar" ? "ar_SA" : "en_US";
}

function routeFor(sourcePath, locale) {
  const slashPath = sourcePath.split(path.sep).join("/");
  if (slashPath === "index.html") return `/${locale}/`;
  if (slashPath.endsWith("/index.html")) return `/${locale}/${slashPath.slice(0, -"index.html".length)}`;
  return `/${locale}/${slashPath}`;
}

function sourceRoute(sourcePath) {
  const slashPath = sourcePath.split(path.sep).join("/");
  if (slashPath === "index.html") return "/";
  if (slashPath.endsWith("/index.html")) return `/${slashPath.slice(0, -"index.html".length)}`;
  return `/${slashPath}`;
}

function ensureTwitterCard(html) {
  if (/\bname=["']twitter:card["']/i.test(html) || !/\bproperty=["']og:image["']/i.test(html)) return html;
  return html.replace(/<\/head>/i, '<meta name="twitter:card" content="summary_large_image">\n</head>');
}

function normalizedRoute(route) {
  return route === "/" ? route : route.replace(/\/+$/, "");
}

function pageForHref(value, sourcePath, pageSet) {
  if (!value || value.startsWith("#") || /^(?:mailto:|tel:|javascript:|data:)/i.test(value)) return null;
  let target;
  try {
    const baseRoute = sourceRoute(sourcePath);
    target = new URL(value, `https://lenabahri.ir${baseRoute}`);
  } catch {
    return null;
  }
  if (target.origin !== "https://lenabahri.ir") return null;
  let relative = decodeURIComponent(target.pathname).replace(/^\//, "");
  if (!relative) relative = "index.html";
  if (relative.endsWith("/")) relative += "index.html";
  if (pageSet.has(relative)) return { page: relative, search: target.search, hash: target.hash };
  const directoryIndex = `${relative}/index.html`;
  if (pageSet.has(directoryIndex)) return { page: directoryIndex, search: target.search, hash: target.hash };
  return null;
}

function rewriteHref(tag, sourcePath, locale, pageSet, readyPages) {
  return tag.replace(/\bhref\s*=\s*(["'])(.*?)\1/gs, (match, quote, href) => {
    const target = pageForHref(href, sourcePath, pageSet);
    if (!target) return match;
    const route = readyPages.has(`${locale}:${target.page}`) ? routeFor(target.page, locale) : sourceRoute(target.page);
    return `href=${quote}${route}${target.search}${target.hash}${quote}`;
  });
}

function rewriteMetaUrl(tag, sourcePath, locale, pageSet, readyPages) {
  if (!/<meta\b/i.test(tag) || !/(?:property|name)\s*=\s*["'](?:og:url|twitter:url)["']/i.test(tag)) return tag;
  return tag.replace(/\bcontent\s*=\s*(["'])(.*?)\1/i, (match, quote, value) => {
    const target = pageForHref(value, sourcePath, pageSet);
    if (!target) return match;
    const route = readyPages.has(`${locale}:${target.page}`) ? routeFor(target.page, locale) : sourceRoute(target.page);
    return `content=${quote}https://lenabahri.ir${route}${target.search}${target.hash}${quote}`;
  });
}

function rewriteRelativeResources(tag, sourcePath) {
  const sourceDirectory = path.posix.dirname(sourcePath.split(path.sep).join("/"));
  return tag.replace(/\b(src|href|poster)\s*=\s*(["'])(.*?)\2/gs, (match, attribute, quote, value) => {
    if (!value || value.startsWith("#") || value.startsWith("/") || /^(?:[a-z]+:|\/\/)/i.test(value)) return match;
    const resourcePath = path.posix.normalize(path.posix.join(sourceDirectory === "." ? "" : sourceDirectory, value));
    if (resourcePath === ".." || resourcePath.startsWith("../")) return match;
      const versionedResourcePath = resourcePath
       .replace(/^script\.js(?:\?[^#]*)?/, "script.js?v=20261014-customer-1")
       .replace(/^gallery-data\.js(?:\?[^#]*)?/, "gallery-data.js?v=20261014-people-1")
       .replace(/^museum\.js(?:\?[^#]*)?/, "museum.js?v=20261014-people-1")
       .replace(/^museum\.css(?:\?[^#]*)?/, "museum.css?v=20261014-people-1")
      .replace(/^service-videos\.js(?:\?[^#]*)?/, "service-videos.js?v=20261014-2");
    return `${attribute}=${quote}/${versionedResourcePath}${quote}`;
  });
}

function transformHtml(html, sourcePath, locale, catalog, pageSet, readyPages, missing) {
  let inScript = false;
  let jsonLd = false;
  let result = html.replace(htmlTokenPattern, (token) => {
    if (/^<script\b/i.test(token)) {
      inScript = true;
      jsonLd = /type\s*=\s*["']application\/ld\+json["']/i.test(token);
      return rewriteRelativeResources(token, sourcePath);
    }
    if (/^<\/script\b/i.test(token)) {
      inScript = false;
      jsonLd = false;
      return token;
    }
    if (token.startsWith("<")) {
      let updated = translateAttribute(token, catalog, missing);
      updated = rewriteHref(updated, sourcePath, locale, pageSet, readyPages);
      updated = rewriteMetaUrl(updated, sourcePath, locale, pageSet, readyPages);
      updated = rewriteRelativeResources(updated, sourcePath);
      updated = updated.replace(/\blang\s*=\s*(["'])[\w-]+\1/i, `lang="${locale === "zh" ? "zh-Hans" : locale}"`);
      updated = updated.replace(/\bdir\s*=\s*(["'])[\w-]+\1/i, `dir="${locale === "ar" ? "rtl" : "ltr"}"`);
      return updated;
    }
    if (inScript && !jsonLd) return token;
    if (inScript && jsonLd) {
      try {
        const translated = translateJson(JSON.parse(decodeEntities(token)), catalog, missing);
        return JSON.stringify(localizeStructuredData(translated, sourcePath, locale, pageSet, readyPages));
      }
      catch { return token; }
    }
    return replaceLocalizedText(token, catalog, missing);
  });

  const canonical = `https://lenabahri.ir${routeFor(sourcePath, locale)}`;
  const alternates = locales
    .filter((code) => readyPages.has(`${code}:${sourcePath}`))
    .map((code) => `<link rel="alternate" hreflang="${code === "zh" ? "zh-CN" : code}" href="https://lenabahri.ir${routeFor(sourcePath, code)}">`)
    .join("\n  ");
  const hasLocalizedAlternates = locales.some((code) => readyPages.has(`${code}:${sourcePath}`));
  const faAlternate = hasLocalizedAlternates ? `<link rel="alternate" hreflang="fa" href="https://lenabahri.ir${sourceRoute(sourcePath)}">` : "";
  const defaultAlternate = hasLocalizedAlternates ? `<link rel="alternate" hreflang="x-default" href="https://lenabahri.ir${sourceRoute(sourcePath)}">` : "";
  const headLinks = `<link rel="canonical" href="${canonical}">\n  ${alternates}${faAlternate ? `\n  ${faAlternate}` : ""}${defaultAlternate ? `\n  ${defaultAlternate}` : ""}\n  <link rel="stylesheet" href="/assets/site-locale.css">`;
  result = result.replace(/\s*<link\b[^>]*rel=["'](?:canonical|alternate)["'][^>]*>/gi, "");
  result = result.replace(/<\/head>/i, `${headLinks}\n</head>`);
  if (!/src=["'][^"']*assets\/site-locale\.js/i.test(result)) {
    result = result.replace(/<\/body>/i, '<script src="/assets/site-locale.js?v=20261014-1" defer></script>\n</body>');
  }
  return ensureTwitterCard(result);
}

function addSourceAlternates(html, sourcePath, readyPages) {
  const alternatePattern = /\s*<link\b(?=[^>]*\brel=["'][^"']*\balternate\b[^"']*["'])(?=[^>]*\bhreflang=)[^>]*>/gi;
  const cleaned = html.replace(alternatePattern, "");
  const localized = locales
    .filter((code) => readyPages.has(`${code}:${sourcePath}`))
    .map((code) => `<link rel="alternate" hreflang="${code === "zh" ? "zh-CN" : code}" href="https://lenabahri.ir${routeFor(sourcePath, code)}">`);
  if (!localized.length) return cleaned;
  const href = `https://lenabahri.ir${sourceRoute(sourcePath)}`;
  localized.push(`<link rel="alternate" hreflang="fa" href="${href}">`);
  localized.push(`<link rel="alternate" hreflang="x-default" href="${href}">`);
  return cleaned.replace(/<\/head>/i, `${localized.join("\n  ")}\n</head>`);
}

const args = new Set(process.argv.slice(2));
const auditOnly = args.has("--audit");
const sourceAlternatesOnly = args.has("--source-alternates-only");
const twitterCardsOnly = args.has("--twitter-cards-only");
const allowPartial = args.has("--allow-partial");
const listMissingIndex = process.argv.indexOf("--list-missing");
const outputDirIndex = process.argv.indexOf("--output-dir");
const pathPrefixIndex = process.argv.indexOf("--only-path-prefix");
const requestedPathPrefix = pathPrefixIndex === -1 ? "" : (process.argv[pathPrefixIndex + 1] || "").replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
if (pathPrefixIndex !== -1 && (!requestedPathPrefix || requestedPathPrefix.split("/").some((segment) => segment === "." || segment === ".."))) {
  throw new Error("Use --only-path-prefix <project-relative-path>.");
}
const requestedOutput = outputDirIndex === -1 ? "." : process.argv[outputDirIndex + 1];
if (!requestedOutput) throw new Error("Use --output-dir <directory>.");
const outputRoot = path.resolve(projectRoot, requestedOutput);
if (outputRoot !== projectRoot && !outputRoot.startsWith(`${projectRoot}${path.sep}`)) {
  throw new Error("Output directory must remain inside the project.");
}
const sourceFiles = (await walk(projectRoot))
  .filter((file) => !ignoredPagePaths.has(path.relative(projectRoot, file).split(path.sep).join("/")))
  .sort();
const relativePages = sourceFiles.map((file) => path.relative(projectRoot, file).split(path.sep).join("/"));
const buildPages = requestedPathPrefix
  ? relativePages.filter((relativePath) => relativePath === requestedPathPrefix || relativePath.startsWith(`${requestedPathPrefix}/`))
  : relativePages;
if (requestedPathPrefix && !buildPages.length) throw new Error(`No source pages match: ${requestedPathPrefix}`);
const pageSet = new Set(relativePages);
const runtimeTextValues = new Set();
for (const [relativePath, globalName] of [["gallery-data.js", "LENA_GALLERY"], ["service-videos.js", "LENA_VIDEO_LIBRARY"]]) {
  const source = await readFile(path.join(projectRoot, relativePath), "utf8");
  const window = {};
  runInNewContext(source, { window });
  collectTranslatableValues(window[globalName], runtimeTextValues);
}
const catalogs = {};
const reports = {};
const runtimeReports = {};

for (const locale of locales) {
  try {
    catalogs[locale] = JSON.parse(await readFile(path.join(projectRoot, "locales", `${locale}.json`), "utf8"));
  } catch {
    catalogs[locale] = { common: {}, pages: {} };
  }
  reports[locale] = new Map();
  runtimeReports[locale] = new Set([...runtimeTextValues].filter((value) => !catalogs[locale].common?.[value]));
  for (const relativePath of relativePages) {
    const html = await readFile(path.join(projectRoot, relativePath), "utf8");
    const missing = new Set();
    transformHtml(html, relativePath, locale, {
      locale,
      common: catalogs[locale].common || {},
      page: catalogs[locale].pages?.[relativePath] || {}
    }, pageSet, new Set(), missing);
    reports[locale].set(relativePath, missing);
  }
}

if (listMissingIndex !== -1) {
  const locale = process.argv[listMissingIndex + 1];
  const page = process.argv[listMissingIndex + 2];
  const missing = reports[locale]?.get(page);
  if (!missing) {
    console.error("Use --list-missing <en|ar|zh> <relative-html-path>.");
    process.exit(2);
  }
  console.log([...missing].join("\n"));
  process.exit(0);
}

const incomplete = [];
for (const locale of locales) {
  const items = [...reports[locale]].filter(([, missing]) => missing.size > 0);
  const missingCount = items.reduce((sum, [, missing]) => sum + missing.size, 0);
  const missingRuntimeCount = runtimeReports[locale].size;
  console.log(`${locale}: ${relativePages.length - items.length}/${relativePages.length} HTML pages fully translated; ${missingCount} missing page-text entries; ${missingRuntimeCount} missing gallery/video strings.`);
  const visibleItems = args.has("--report-all") ? items : items.slice(0, 8);
  for (const [page, missing] of visibleItems) {
    console.log(`  ${page}: ${missing.size} untranslated strings`);
  }
  if (missingRuntimeCount) console.log(`  runtime data: ${[...runtimeReports[locale]].slice(0, 8).join(" | ")}`);
  if (items.length || missingRuntimeCount) incomplete.push(locale);
}

if (auditOnly) process.exit(0);
if (incomplete.length && !allowPartial) {
  console.error("Build stopped: complete all page translations or explicitly pass --allow-partial.");
  process.exit(1);
}

const readyPages = new Set();
for (const locale of locales) {
  for (const [page, missing] of reports[locale]) {
    const source = await readFile(path.join(projectRoot, page), "utf8");
    const noindex = /<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["'][^"']*\bnoindex\b/i.test(source);
    if (!missing.size && !noindex) readyPages.add(`${locale}:${page}`);
  }
}

if (twitterCardsOnly) {
  if (outputRoot !== projectRoot) throw new Error("--twitter-cards-only requires the project root as output.");
  const localizedFiles = (await Promise.all(locales.map((locale) => walk(path.join(projectRoot, locale)))))
    .flat();
  const htmlFiles = [...sourceFiles, ...localizedFiles];
  let updated = 0;
  for (const file of htmlFiles) {
    const html = await readFile(file, "utf8");
    const improved = ensureTwitterCard(html);
    if (improved !== html) {
      await writeFile(file, improved, "utf8");
      updated += 1;
    }
  }
  console.log(`Twitter summary cards added to ${updated} page(s).`);
  process.exit(0);
}

if (sourceAlternatesOnly) {
  if (outputRoot !== projectRoot) throw new Error("--source-alternates-only requires the project root as output.");
  for (const relativePath of buildPages) {
    const sourceFile = path.join(projectRoot, relativePath);
    const html = await readFile(sourceFile, "utf8");
    const noindex = /<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["'][^"']*\bnoindex\b/i.test(html);
    if (noindex) continue;
    const translated = addSourceAlternates(html, relativePath, readyPages);
    if (translated !== html) await writeFile(sourceFile, translated, "utf8");
  }
  console.log("Reciprocal hreflang links added to eligible Persian source pages.");
  process.exit(0);
}

for (const locale of locales) {
  const languageOutput = path.join(outputRoot, locale);
  for (const relativePath of buildPages) {
    const missing = reports[locale].get(relativePath);
    if (missing.size && !allowPartial) continue;
    const html = await readFile(path.join(projectRoot, relativePath), "utf8");
    const translated = transformHtml(html, relativePath, locale, {
      locale,
      common: catalogs[locale].common || {},
      page: catalogs[locale].pages?.[relativePath] || {}
    }, pageSet, readyPages, missing);
    const destination = path.join(languageOutput, relativePath);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, translated, "utf8");
  }
}

if (outputRoot === projectRoot) {
  for (const relativePath of buildPages) {
    const sourceFile = path.join(projectRoot, relativePath);
    const html = await readFile(sourceFile, "utf8");
    const noindex = /<meta\b[^>]*\bname=["']robots["'][^>]*\bcontent=["'][^"']*\bnoindex\b/i.test(html);
    if (noindex) continue;
    const translated = addSourceAlternates(html, relativePath, readyPages);
    if (translated !== html) await writeFile(sourceFile, translated, "utf8");
  }
}

const sitemapFile = path.join(outputRoot, "sitemap.xml");
const sitemapSource = await readFile(path.join(projectRoot, "sitemap.xml"), "utf8");
const sourcePagesByRoute = new Map(relativePages.map((relativePath) => [normalizedRoute(sourceRoute(relativePath)), relativePath]));
const sitemapLocations = [...sitemapSource.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => match[1]);
const existingLocations = new Set(sitemapLocations);
const sourcePagesInSitemap = new Set();

for (const location of sitemapLocations) {
  const url = new URL(location);
  if (url.origin !== "https://lenabahri.ir" || /^\/(?:en|ar|zh)(?:\/|$)/.test(url.pathname)) continue;
  const relativePath = sourcePagesByRoute.get(normalizedRoute(url.pathname));
  if (relativePath) sourcePagesInSitemap.add(relativePath);
}

const localizedSitemapEntries = [];
for (const locale of locales) {
  for (const relativePath of sourcePagesInSitemap) {
    if (!readyPages.has(`${locale}:${relativePath}`)) continue;
    const location = `https://lenabahri.ir${routeFor(relativePath, locale)}`;
    if (existingLocations.has(location)) continue;
    existingLocations.add(location);
    localizedSitemapEntries.push(`  <url>\n    <loc>${location}</loc>\n  </url>`);
  }
}

if (localizedSitemapEntries.length) {
  const updatedSitemap = sitemapSource.replace(/<\/urlset>\s*$/i, `${localizedSitemapEntries.join("\n")}\n</urlset>\n`);
  if (updatedSitemap === sitemapSource) throw new Error("Could not append localized pages to sitemap.xml.");
  await writeFile(sitemapFile, updatedSitemap, "utf8");
} else if (outputRoot !== projectRoot) {
  await writeFile(sitemapFile, sitemapSource, "utf8");
}

console.log("Localized static pages written to the site root.");
