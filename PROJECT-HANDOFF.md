# Lena Bahri — Project Handoff

Updated: 2026-10-15

## Source of truth

- Public Git remote: `origin`, branch `main`.
- Latest verified remote/local commit at review: `77f6f04` (`Publish SEO and multilingual site updates`).
- The website and its production assets are versioned in Git. Keep tracked images and videos: the site uses them; they are not disposable build copies.
- Do not put credentials, production database files, customer photos, or private booking data in the public repository.

## Architecture

- Static Persian pages live at the repository root; English, Arabic, and Simplified Chinese pages live under `/en/`, `/ar/`, and `/zh/`.
- The Node.js booking API source, migrations, tests, and systemd templates live under `cloudflare/booking-api/`; production runs separately on the Iran VPS with private SQLite data.
- `assets/` contains production images, fonts, assistant assets, and portfolio videos. `output/`, `.locale-preview/`, `.playwright-cli/`, `.vps-tools/` release payloads, `node_modules/`, `.wrangler/`, and `__pycache__/` are generated/local-only.
- Project-specific SEO and newsroom procedures are under `.agents/skills/`.

## Validation commands

- Locale completeness: `node scripts/build-locales.mjs --audit`
- Static SEO audit: `py .agents/skills/lena-bahri-seo-optimizer/scripts/audit_static_site.py`
- Live sitemap/link check: `node .agents/skills/lena-bahri-seo-optimizer/scripts/audit_live_sitemap.mjs`
- API tests: `npm test --prefix cloudflare/booking-api`
- API syntax checks: `npm run check --prefix cloudflare/booking-api`

## Search Console — 2026-10-15

- Google accepted `https://lenabahri.ir/sitemap.xml` on October 15. The report still showed an older last-read date (October 10) and 15 discovered pages; wait for Google to reprocess before treating those totals as current.
- The beauty-news hub and `/about.html` were reported indexed; `/people/` and `/en/` were reported discovered but not indexed. No individual indexing requests were submitted.
- The local sitemap contains 252 URLs. The live redirects `/about-me` → `/about.html` and `/contact-me` → `/#contact` returned 301 during the final check.

## Backup and next steps

- API source code is backed up in the public Git remote. Keep server secrets and customer records separate from it.
- The repository contains a daily SQLite backup service template and a script that retains seven local database snapshots. The active timer was not verified on the VPS during this cleanup, and no off-site cloud destination is configured in this project.
- Off-site backups of customer records/photos need a private, encrypted destination and credentials. Cloudflare R2 was previously declined; do not enable it without fresh approval. Never upload the database to this public GitHub repository.
- Next: verify the VPS backup timer and backup restore procedure, then configure off-site backup only after the owner selects a private destination. Recheck Search Console after Google rereads the sitemap.
- Local newsroom drafts and content-registry edits are not equivalent to the public Git revision; review them before committing or publishing.
