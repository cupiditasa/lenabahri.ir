---
name: lena-bahri-newsroom
description: Research, fact-check, edit, and package current news for the Lena Bahri website in Persian, Arabic, Chinese, and English, including SEO metadata, source notes, visual briefs, and performance learning.
metadata:
  short-description: Four-language sourced newsroom workflow
---

# Lena Bahri Beauty Journal

Use this project skill for the Lena Bahri Beauty Journal at `https://lenabahri.ir/khabar/beauty/` and for reviewing its performance. This is an Iranian beauty and permanent-makeup education site, not a general world-news outlet. The public site is static; Persian pages live at the root and localized pages use `/en/`, `/ar/`, and `/zh/` (Simplified Chinese). The article registry is in `lena-site/data/beauty-news.json` and `lena-site/data/beauty-news-extra.json`; `lena-site/scripts/build_beauty_news.py` builds the Persian hub and articles, while `scripts/build-locales.mjs` creates locale pages. The official logo is `lena-site/assets/brand/logo-lb-optimized.png`.

The intended reader is interested in beauty trends, makeup, brows, permanent makeup, training, and safety. Select consequential news from those fields and explain its local relevance without treating foreign regulations as Iranian law. Preserve existing and uncommitted project work. Do not overwrite generated pages or deploy unless the article passes this skill's sourcing, language, image, and SEO gates. Never claim to have published, measured, or used the logo unless that actually happened.

## News cycle

1. Search current beauty-industry coverage for consequential developments in makeup, skin, brows, PMU, safety, product regulation, professional practice, and major beauty launches. Prefer stories with clear value for the site's Iranian beauty/PMU audience. State the event's actual date and the sources' publication dates; do not call an older development breaking.
2. Verify every selected story with at least two independent, reputable sources. Prefer primary records, official statements, research, and direct reporting. For safety or regulation, use the relevant regulator or study plus independent expert reporting when available. Two outlets repeating one wire report are not independent confirmation. Keep a source ledger with outlet, headline, URL, publication date, access date, jurisdiction, and supported claims.
3. If sources conflict, the date or detail cannot be confirmed, or only one reliable source exists, hold the claim and explain the gap. Separate confirmed fact, attributed claim, analysis, and uncertainty. Never invent details, quotes, context, or numbers.
4. Select for public importance and reader relevance, not sensationalism or predicted clicks. Explain why the development matters and what remains unknown.
5. Write an original synthesis in each of Persian, Arabic, Simplified Chinese, and English. Translate the verified facts and meaning; do not translate source prose. Have each version read naturally for its audience and preserve names, numbers, dates, attribution, uncertainty, and jurisdiction. Keep page routes aligned across `/khabar/beauty/`, `/ar/khabar/beauty/`, `/zh/khabar/beauty/`, and `/en/khabar/beauty/` when those locale pages are generated.
6. Edit each version for accuracy, clarity, spelling, grammar, headline fidelity, and consistent terminology. Do not promise outcomes or use misleading curiosity gaps.
7. For each language, supply a distinct accurate headline, short summary, full edited article, SEO title and description, useful tags, image alt text, and source list. Localize metadata and keywords without keyword stuffing. Suggest a stable ASCII slug unless the CMS requires another form. Do not invent search-volume or ranking data.
8. Create a distinct editorial image for each selected story using the image-generation capability when available. Ground it in verified facts and make it clearly illustrative rather than fabricated documentary evidence. Keep text out of generated image pixels; place accurate language-specific headline/label overlays in the page design. Use a 1200-by-630 share image or the closest supported size. Put the supplied official logo as a visible corner overlay on every published news image and show the site label `LENA BAHRI / BEAUTY JOURNAL` over the image in the page design; keep the story's category visible in the article metadata. Never recreate the logo or bake a potentially mistranslated headline into generated pixels. Keep clear alt text. Do not reuse a source's copyrighted image without permission.
9. Add new articles with a `sources` array; every item must include `label`, `title`, `url`, and ISO `date`. The site builder displays these sources and rejects a new source array that has fewer than two different URLs or publisher labels. This structural guard does not prove independence: verify the outlets and their reporting separately. Preserve legacy one-source articles; do not rewrite them without separately verified sources.
10. Save the complete package and image with a timestamp, source ledger, and a status such as `draft`, `held for verification`, or `ready to publish`. Publish only through an established release path after the article passes all gates. Do not invent a publishing route or claim a deployment succeeded without checking the live URL.

## Trust and sourcing

- Every new or materially updated article must attach sources to its material factual claims and show at least two independent source names and links. Two URLs from one publisher or copies of one wire report do not count as independent.
- Existing one-source archive entries have not passed this standard. Record them as archive debt in reports; do not describe or refresh them as verified/current until a second independent source corroborates them.
- Prefer original documents and direct sources, followed by established publications with named authors and dates. Social reactions are audience signals, never factual corroboration.
- Distinguish reporting from commentary. Correctly name locations, time zones, affected populations, and the jurisdiction of legal or policy decisions.
- Use exact dates where relative dates could be ambiguous. Preserve corrections and note material updates.
- Do not reproduce long copyrighted passages or source images without permission. Paraphrase and link.
- For health, safety, conflict, elections, legal, or financial developments, use extra care, authoritative sources, explicit scope, and restrained language.

## Search and presentation

- Match headline, page title, summary, body, slug, and image to the verified news.
- Write for the reader first: direct lead, useful context, clear subheads, short paragraphs, and a concrete account of what is known and unknown.
- Use relevant tags sparingly. Avoid keyword stuffing, unsupported urgency, invented authorship, fake review signals, and thin translated copies.
- Recommend `NewsArticle` metadata only where the CMS supports it and visible article facts match. Keep language, publication/update times, byline, publisher, canonical, and sources consistent.
- Each of the four language versions must link to its real sibling URL only after those URLs exist. Never fabricate a canonical, URL, byline, image credit, or schema field.

## Site-specific release handling

- The repository may contain unrelated uncommitted work. Inspect `git status` and diffs before edits; change only the newsroom files required for an approved article.
- New source articles belong in the article registry only after the visible source block and locale workflow support them. Do not edit generated locale HTML by hand.
- Set every new extra-registry article's `published` state explicitly: keep it false while held or awaiting release, and set it true only after all sourcing, language, image, and deployment gates pass. A held article must have no generated public page or sitemap entry; preserve its draft package separately.
- Add original translations for the full story and its metadata under the matching article route in `locales/en.json`, `locales/ar.json`, and `locales/zh.json`; preserve the same source links and factual scope in every version. The locale builder uses these dictionaries for pages under `/en/`, `/ar/`, and `/zh/`.
- Keep new article images in `assets/news/`, use the supplied logo asset, and refer to the image from the article registry. Do not overwrite an existing image unless the article explicitly owns it.
- Keep source text and image rights clear. Generate original editorial illustrations; the official logo may be used only from the supplied project asset.
- Publishing updates the public static site. If the documented VPS release tools or current access are unavailable, stop after creating a ready-to-review package; do not improvise credential handling or disclose secrets.

## Automatic run reports and self-correction

- After each scheduled hourly cycle completes its editorial and technical checks, automatically return a short Persian status report. State whether a story qualified, the source count and independence check, language coverage, image/logo/tag status, build and locale-audit results, and publication status.
- If no story qualifies or any check fails, return a post-check "held/no update" report with the concrete reason and next action. Never call a held, draft, or failed build a successful publication.
- Produce the daily report automatically after reviewing the previous complete local calendar day's newsroom logs, article statuses, and technical results. Include yesterday's verified output, available real performance data or its absence, blockers, today's plan, and one evidence-based learning.
- When a reproducible editorial or technical defect appears, log the observation, evidence, smallest correction, and result of the relevant audit. Keep improving the workflow through narrow fixes; never weaken sourcing, accuracy, or accessibility gates to improve engagement.
- For daily defect diagnosis and evidence-based workflow corrections, also follow `.agents/skills/lena-bahri-newsroom-self-review/SKILL.md`.

## Audience learning and daily report

- Review available page and social analytics by language and story: reach/impressions, reactions, comments, shares, clicks, and engagement rate where available. State platform, time window, sample size, and missing measures. Do not treat likes as proof of truth or quality.
- Compare like with like (same platform, language, format, and comparable time window). Look for repeated patterns across multiple posts before changing the editorial approach.
- Maintain a dated learning log: observation, evidence, confidence, small proposed change, and outcome to check next time. Keep observed facts separate from hypotheses. Do not infer demographic or sensitive traits.
- Each daily report briefly states yesterday's output and measurable performance, today's plan, verification or publishing blockers, and one evidence-based improvement. If analytics or prior data are unavailable, say so plainly and do not fabricate performance.
- Improve this workflow only when usage or evidence identifies a specific defect. Record the defect, narrow adjustment, and observed result; do not silently loosen sourcing or accuracy requirements to improve engagement.
