const args = process.argv.slice(2);

function option(name, fallback) {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1] ?? fallback;
}

function decodeXml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .trim();
}

const sitemapUrl = option("--sitemap-url", "https://lenabahri.ir/sitemap.xml");
const concurrency = Math.min(12, Math.max(1, Number(option("--concurrency", "6")) || 6));
const timeoutMs = Math.min(60000, Math.max(1000, Number(option("--timeout-ms", "15000")) || 15000));
const pendingSitemaps = [sitemapUrl];
const visitedSitemaps = new Set();
const urls = new Set();
const sitemapFailures = [];

while (pendingSitemaps.length) {
  const currentSitemap = pendingSitemaps.shift();
  if (visitedSitemaps.has(currentSitemap)) continue;
  visitedSitemaps.add(currentSitemap);
  let sitemapAddress;
  try {
    sitemapAddress = new URL(currentSitemap);
  } catch {
    sitemapFailures.push({url: currentSitemap, error: "invalid absolute URL"});
    continue;
  }
  if (sitemapAddress.protocol !== "https:" || sitemapAddress.hostname.toLowerCase() !== "lenabahri.ir") {
    sitemapFailures.push({url: currentSitemap, error: "expected canonical HTTPS host lenabahri.ir"});
    continue;
  }

  try {
    const response = await fetch(currentSitemap, {
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (response.status !== 200) {
      sitemapFailures.push({url: currentSitemap, status: response.status, location: response.headers.get("location")});
      await response.body?.cancel();
      continue;
    }

    const xml = await response.text();
    const isIndex = /<(?:[\w.-]+:)?sitemapindex\b/i.test(xml);
    const isUrlSet = /<(?:[\w.-]+:)?urlset\b/i.test(xml);
    if (!isIndex && !isUrlSet) {
      sitemapFailures.push({url: currentSitemap, error: "response is not a sitemap or sitemap index"});
      continue;
    }

    const locations = [...xml.matchAll(/<(?:[\w.-]+:)?loc\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?loc\s*>/gi)]
      .map((match) => decodeXml(match[1]));
    for (const location of locations) {
      if (isIndex) pendingSitemaps.push(location);
      else urls.add(location);
    }
    if (urls.size > 50000) throw new Error("sitemap contains more than 50,000 URLs");
  } catch (error) {
    sitemapFailures.push({url: currentSitemap, error: String(error)});
  }
}

let cursor = 0;
const failures = [];
const redirects = [];
const invalidUrls = [];
const sitemapUrls = [...urls];

async function worker() {
  while (true) {
    const index = cursor++;
    if (index >= sitemapUrls.length) return;
    const url = sitemapUrls[index];
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      invalidUrls.push({url, error: "invalid absolute URL"});
      continue;
    }
    if (parsed.protocol !== "https:" || parsed.hostname.toLowerCase() !== "lenabahri.ir") {
      invalidUrls.push({url, error: "expected canonical HTTPS host lenabahri.ir"});
      continue;
    }

    try {
      const response = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.status >= 300 && response.status < 400) {
        redirects.push({url, status: response.status, location: response.headers.get("location")});
      } else if (!response.ok) {
        failures.push({url, status: response.status});
      }
      await response.body?.cancel();
    } catch (error) {
      failures.push({url, error: String(error)});
    }
  }
}

await Promise.all(Array.from({length: concurrency}, worker));

const result = {
  sitemapCount: visitedSitemaps.size,
  urlCount: urls.size,
  checked: sitemapUrls.length - invalidUrls.length,
  redirects,
  failures,
  invalidUrls,
  sitemapFailures,
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = redirects.length || failures.length || invalidUrls.length || sitemapFailures.length ? 1 : 0;
