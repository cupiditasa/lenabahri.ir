---
name: lena-bahri-seo-optimizer
description: "Project workflow used by SEO01 to audit and improve Lena Bahri technical SEO, multilingual routes, editorial quality, and Google Search Console coverage using verified evidence."
metadata:
  short-description: "Evidence-led SEO for Lena Bahri"
---

# SEO01 — Lena Bahri SEO Optimizer

Use this project-specific workflow whenever the user invokes SEO01 for `lenabahri.ir`. It covers Persian root pages plus English `/en/`, Arabic `/ar/`, and Simplified Chinese `/zh/` pages, the beauty-news section, portfolio, services, people profiles, and local-business/contact routes. The globally installed `seo01` skill is the user-facing entrypoint; this file and its scripts are the site's implementation guide.

## Guardrails

- First read the installed `editorial-seo-publishing` skill when available, plus `.agents/skills/lena-bahri-newsroom/SKILL.md` and `.agents/skills/lena-bahri-newsroom-self-review/SKILL.md` for editorial or analytics work. Never claim to have consulted a skill that was not actually read.
- Inspect `git status --short` and diffs before edits. Preserve existing staged, unstaged, and untracked work; do not revert broad files, regenerate translations, or publish unrelated changes.
- Separate facts, hypotheses, and recommendations. Never invent Search Console, Analytics, rank, traffic, backlinks, keyword-volume, review, or conversion data. A small sample is not a trend.
- Prioritize correct crawl/index/canonical routes, helpful and trustworthy content, accessible navigation, accurate language targeting, and working conversion paths. Do not create pages or keywords solely to increase page count.
- Do not claim Google ranking, rich results, indexing, or traffic outcomes are guaranteed. Google decides crawling, indexing, snippets, and result presentation.
- Do not redirect retired URLs to unrelated pages. Verify the old route, closest equivalent, internal references, and live status before proposing a redirect.
- Never expose credentials. Do not submit Search Console validation/sitemaps, change account/domain settings, or deploy without explicit approval for that specific consequential action and a verified release path.
- Treat Search Console indexing reports as dated snapshots. A submitted sitemap, a discovered URL, and a live URL test are different signals; none alone proves indexing or ranking.
- Do not click Request indexing, validate fixes, submit sitemaps, or alter Search Console settings unless the user explicitly authorizes that exact action in the current task.

## Audit loop

1. **Establish baseline.** Inspect repository guidance, `robots.txt`, XML sitemap(s), build/deploy instructions, locale routes, and the exact working-tree state. Keep pre-existing staged, unstaged, and untracked work intact. If an authenticated Search Console session is already available, record its property, retrieval date, report status, and known staleness.
2. **Round one — source and release.** Run `py .agents/skills/lena-bahri-seo-optimizer/scripts/audit_static_site.py --json`. For an actual release, also pass its exact newline-delimited file manifest with `--release-manifest <manifest>`; do not substitute a stale or guessed manifest. Review canonical/sitemap parity, noindex exclusions, assets, crawlable internal links, fragments, hreflang reciprocity, and held-draft exclusion.
3. **Round two — production and Google signals.** Run `node .agents/skills/lena-bahri-seo-optimizer/scripts/audit_live_sitemap.mjs` against the production sitemap. Confirm representative route status and redirects, then inspect Search Console read-only for the root, key service/news/profile routes, and one route per locale. Distinguish a historical indexing result from a live fetch/test. A sitemap helps discovery but does not guarantee crawl or indexing.
4. **Prioritize evidence.** Fix privacy/security and broken release paths first; then wrong canonical/redirect/404, missing sitemap entries, orphan pages, broken fragments/assets, locale alternates, or rendering defects; then metadata, structured data, accessibility, and content. Label each item as verified defect, observed Google status, hypothesis, or recommendation.
5. **Round three — root-cause correction and regression.** Patch the source of truth where possible; regenerate only the necessary pages. Re-run the full source and exact-release audits, locale checks, live URL checks for affected routes, and representative page checks in all four languages. Reinspect Search Console only when it can provide a new signal; do not repeatedly query unchanged data. Stop after three meaningful passes when no material high-severity defect remains. Never claim perfection or guaranteed ranking/indexing.
6. **Report and release.** Summarize each pass, evidence, fixes, checks, Google-side pending work, and limitations. Before publishing, inspect the exact diff and staged public file list; exclude build tools, drafts, private reports, source registries with unpublished copy, and temporary credentials. Deploy only through the documented path. Submit sitemaps, request indexing, validate fixes, or change settings only after specific user authorization.

## Site-specific checks

- Static directory routes should be linked and canonicalized consistently with the server's trailing-slash behavior. `.html` file routes remain file routes; do not append `/` to them.
- Keep Persian canonical URLs on the root path and localized pages on their own `/en/`, `/ar/`, or `/zh/` routes. Hreflang targets must exist, use the correct language/region codes, and reciprocate. Never advertise a translation that is incomplete or absent.
- Sitemap entries must be unique, same-site, indexable, resolvable to a real page, and use that page's final canonical route. `lastmod` is optional; include or change it only when the page materially changed and the date is truthful.
- Important indexable pages should have at least one crawlable internal `<a href>` link, not only a sitemap entry. Validate internal fragments (`#id`) as well as target paths. Sitemap presence alone does not resolve an orphan-page risk.
- When auditing a release manifest, resolve pages, links, assets, sitemap targets, and hreflang targets against the manifest itself—not files that merely exist in the working tree. Reject manifest paths that escape the project or do not exist.
- A held newsroom draft must be explicitly unpublished in the registry and absent from every public locale page and sitemap. Keep the source package in drafts; never let a missing publication flag default a draft to public.
- Inspect the staged release itself, not just the source tree: exclude the build-only `data/beauty-news-extra.json` registry when it contains held article copy, ensure held article routes and images are absent from the release manifest, and scan released text files (including locale dictionaries) for held slugs.
- Check internal anchors and assets after route edits. A sitemap is a discovery hint, not proof that Google has indexed a page.
- Review business name, service area, address/phone/contact details, booking paths, and any LocalBusiness structured data for consistency with visible page content. Never publish private customer data.
- For structured data, verify JSON syntax and consistency with visible, current content. Markup eligibility is not a promise of a rich result.
- For news, apply the editorial source, date, jurisdiction, image, attribution, translation, and archive-debt rules in the newsroom skills. Do not use scheduled publishing volume as a substitute for reader value.

## Official references

- Google Search Essentials: https://developers.google.com/search/docs/essentials
- Helpful, reliable, people-first content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Crawlable links: https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- Localized versions and hreflang: https://developers.google.com/search/docs/specialty/international/localized-versions
- Canonical URLs: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Sitemaps: https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- Structured data policies: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- Article structured data: https://developers.google.com/search/docs/appearance/structured-data/article
- Local business structured data: https://developers.google.com/search/docs/appearance/structured-data/local-business
- Image SEO: https://developers.google.com/search/docs/appearance/google-images
- Sitemap overview and indexing caveat: https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- Crawlable links and internal discovery: https://developers.google.com/search/docs/crawling-indexing/links-crawlable

Use current Google Search Central documentation as the technical source of truth; distinguish recommendations from requirements and from guarantees.
