---
name: lena-bahri-seo-optimizer
description: "Audit and improve Lena Bahri site's technical SEO, multilingual routes, local search signals, editorial quality, and Search Console coverage using verified evidence."
metadata:
  short-description: "Evidence-led SEO for Lena Bahri"
---

# Lena Bahri SEO Optimizer

Use this project-specific workflow for `lenabahri.ir` SEO audits and improvements. It covers Persian root pages plus English `/en/`, Arabic `/ar/`, and Simplified Chinese `/zh/` pages, the beauty-news section, portfolio, services, people profiles, and local-business/contact routes.

## Guardrails

- First read the installed `editorial-seo-publishing` skill when available, plus `.agents/skills/lena-bahri-newsroom/SKILL.md` and `.agents/skills/lena-bahri-newsroom-self-review/SKILL.md` for editorial or analytics work. Never claim to have consulted a skill that was not actually read.
- Inspect `git status --short` and diffs before edits. Preserve existing staged, unstaged, and untracked work; do not revert broad files, regenerate translations, or publish unrelated changes.
- Separate facts, hypotheses, and recommendations. Never invent Search Console, Analytics, rank, traffic, backlinks, keyword-volume, review, or conversion data. A small sample is not a trend.
- Prioritize correct crawl/index/canonical routes, helpful and trustworthy content, accessible navigation, accurate language targeting, and working conversion paths. Do not create pages or keywords solely to increase page count.
- Do not claim Google ranking, rich results, indexing, or traffic outcomes are guaranteed. Google decides crawling, indexing, snippets, and result presentation.
- Do not redirect retired URLs to unrelated pages. Verify the old route, closest equivalent, internal references, and live status before proposing a redirect.
- Never expose credentials. Do not submit Search Console validation/sitemaps, change account/domain settings, or deploy without explicit approval for that specific consequential action and a verified release path.

## Audit loop

1. **Establish baseline.** Inspect repository guidance, `robots.txt`, XML sitemap(s), build/deploy instructions, source generators, locale routes, and the current working-tree state. Use authenticated Search Console only when the user's existing session is available and authorized. Record the property, report date/range, counts, and limitations.
2. **Run deterministic checks.** Run `python .agents/skills/lena-bahri-seo-optimizer/scripts/audit_static_site.py`. Review each finding against the actual route, source generator, production behavior, and intended page purpose; do not treat the script as Google or browser validation.
3. **Prioritize evidence.** Fix P0 security/privacy or submission failures first; then P1 canonical/redirect/404, sitemap, internal-link, indexability, language-alternate, or page-rendering defects; then P2 metadata, structured-data, image, accessibility, and content improvements. Do not mark a Search Console issue fixed until the correction is live and rechecked.
4. **Patch the source of truth.** Prefer correcting a generator or route map over editing generated copies. Keep URLs stable where possible. When URL changes are necessary, preserve a relevant 301 mapping and update canonicals, internal links, locale alternates, structured data, and sitemap together.
5. **Self-review in three passes.** After the first implementation, (a) run focused tests and the site auditor, (b) inspect the diff for collateral changes and confirm each fix addresses the root cause, and (c) rerun the auditor/build and verify representative pages in every language. Stop after three meaningful passes when no known high-severity issue remains; do not claim perfection or continue cosmetic churn.
6. **Report and release.** Summarize verified defects, exact changes, validation results, remaining risks, and required user actions. Before a release, inspect the exact diff and staged public file manifest; run the auditor with `--release-manifest <manifest>` and exclude build tools, drafts, and source registries that contain unpublished copy. Use only the documented deploy path. Recheck production HTTP status, redirects, canonical, language alternates, sitemap and relevant page rendering. Ask before Search Console submission or validation clicks.

## Site-specific checks

- Static directory routes should be linked and canonicalized consistently with the server's trailing-slash behavior. `.html` file routes remain file routes; do not append `/` to them.
- Keep Persian canonical URLs on the root path and localized pages on their own `/en/`, `/ar/`, or `/zh/` routes. Hreflang targets must exist, use the correct language/region codes, and reciprocate. Never advertise a translation that is incomplete or absent.
- Sitemap entries must be unique, same-site, indexable, resolvable to a real page, and use that page's final canonical route. `lastmod` is optional; include or change it only when the page materially changed and the date is truthful.
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

Use current Google Search Central documentation as the technical source of truth; distinguish recommendations from requirements and from guarantees.
