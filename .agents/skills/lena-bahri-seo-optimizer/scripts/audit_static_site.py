from __future__ import annotations

import argparse
import json
import re
import sys
import xml.etree.ElementTree as ET
from collections import Counter, defaultdict
from datetime import date
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit


for stream in (sys.stdout, sys.stderr):
    if hasattr(stream, "reconfigure"):
        stream.reconfigure(encoding="utf-8", errors="backslashreplace")


ROOT = Path(__file__).resolve().parents[4]
SITE = "https://lenabahri.ir"
SKIP_DIRS = {".git", ".locale-preview", ".vps-tools", ".playwright-cli", "node_modules", "output", "__pycache__"}
SITEMAP_NS = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.html_attrs: dict[str, str] = {}
        self.title_parts: list[str] = []
        self.h1_parts: list[list[str]] = []
        self.description: list[str] = []
        self.canonicals: list[str] = []
        self.alternates: list[tuple[str, str]] = []
        self.links: list[tuple[str, str, str]] = []
        self.images: list[dict[str, str]] = []
        self.anchors: set[str] = set()
        self.meta: dict[str, list[str]] = defaultdict(list)
        self.json_ld: list[str] = []
        self.has_refresh = False
        self._capture: list[str] | None = None
        self._script_type = ""
        self._json_parts: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        values = {key.lower(): value or "" for key, value in attrs}
        if values.get("id"):
            self.anchors.add(values["id"])
        if tag == "a" and values.get("name"):
            self.anchors.add(values["name"])
        if tag == "html":
            self.html_attrs = values
        elif tag == "title":
            self._capture = self.title_parts
        elif tag == "h1":
            parts: list[str] = []
            self.h1_parts.append(parts)
            self._capture = parts
        elif tag == "meta":
            key = values.get("name", "").lower() or values.get("property", "").lower()
            if key:
                self.meta[key].append(values.get("content", ""))
            if values.get("http-equiv", "").lower() == "refresh":
                self.has_refresh = True
            if key == "description":
                self.description.append(values.get("content", ""))
        elif tag == "link":
            rel = {item.lower() for item in values.get("rel", "").split()}
            if "canonical" in rel:
                self.canonicals.append(values.get("href", ""))
            if "alternate" in rel and values.get("hreflang"):
                self.alternates.append((values["hreflang"].lower(), values.get("href", "")))
            if "stylesheet" in rel and values.get("href"):
                self.links.append(("asset", values["href"], "stylesheet"))
        elif tag == "a" and values.get("href"):
            self.links.append(("page", values["href"], "anchor"))
        elif tag in {"img", "script", "source", "video", "audio", "iframe"}:
            for attr in ("src", "poster"):
                if values.get(attr):
                    self.links.append(("asset", values[attr], f"{tag}[{attr}]"))
            if tag == "img":
                self.images.append(values)
            if tag == "script":
                self._script_type = values.get("type", "").lower()
                self._json_parts = []

    def handle_endtag(self, tag: str) -> None:
        if tag in {"title", "h1"}:
            self._capture = None
        if tag == "script":
            if self._script_type == "application/ld+json":
                self.json_ld.append("".join(self._json_parts))
            self._script_type = ""
            self._json_parts = []

    def handle_data(self, data: str) -> None:
        if self._capture is not None:
            self._capture.append(data)
        if self._script_type == "application/ld+json":
            self._json_parts.append(data)


def issue(items: list[dict[str, str]], severity: str, code: str, page: str, detail: str) -> None:
    items.append({"severity": severity, "code": code, "page": page, "detail": detail})


def page_route(relative: str) -> str:
    if relative == "index.html":
        return "/"
    if relative.endswith("/index.html"):
        return "/" + relative[: -len("index.html")]
    return "/" + relative


def route_file(path: str, release_files: set[str] | None = None) -> Path | None:
    decoded = unquote(path)
    if not decoded.startswith("/"):
        return None
    candidate = (ROOT / decoded.lstrip("/")).resolve()
    try:
        candidate.relative_to(ROOT.resolve())
    except ValueError:
        return None
    def included(file: Path) -> bool:
        if release_files is None:
            return True
        return file.relative_to(ROOT.resolve()).as_posix() in release_files

    if candidate.is_file() and included(candidate):
        return candidate if candidate.suffix.lower() == ".html" else candidate
    index_file = candidate / "index.html"
    if candidate.is_dir() and index_file.is_file() and included(index_file):
        return index_file
    return None


def locale_for(route: str, declared: str) -> str:
    first = route.strip("/").split("/", 1)[0]
    if first in {"en", "ar", "zh"}:
        return first
    return declared.split("-", 1)[0].lower() or "fa"


def nginx_redirect_exists(config: str, route: str, destination: str) -> bool:
    pattern = rf"location\s*=\s*{re.escape(route)}\s*\{{[^}}]*return\s+301\s+\"?{re.escape(destination)}\"?\s*;"
    return re.search(pattern, config, re.IGNORECASE | re.DOTALL) is not None


def main() -> int:
    cli = argparse.ArgumentParser(description="Read-only technical SEO audit for the Lena Bahri static site.")
    cli.add_argument("--max-items", type=int, default=100, help="Maximum findings printed per severity group.")
    cli.add_argument("--json", action="store_true", help="Emit findings as JSON.")
    cli.add_argument("--release-manifest", type=Path, help="Optional newline-delimited file list from the staged public release.")
    args = cli.parse_args()

    findings: list[dict[str, str]] = []
    release_files: set[str] | None = None
    if args.release_manifest:
        try:
            release_files = set()
            for raw_path in args.release_manifest.read_text(encoding="utf-8").splitlines():
                release_path = raw_path.strip().replace("\\", "/").removeprefix("./").removeprefix("public/")
                if not release_path:
                    continue
                if release_path.startswith("/") or ".." in Path(release_path).parts:
                    issue(findings, "error", "release-manifest-invalid", str(args.release_manifest), f"unsafe release path: {raw_path}")
                else:
                    release_files.add(release_path)
            for release_path in sorted(release_files):
                candidate = (ROOT / release_path).resolve()
                try:
                    candidate.relative_to(ROOT.resolve())
                except ValueError:
                    issue(findings, "error", "release-manifest-invalid", str(args.release_manifest), f"release path escapes project root: {release_path}")
                    continue
                if not candidate.is_file():
                    issue(findings, "error", "release-file-missing", release_path, "manifest entry does not exist as a file")
        except (OSError, UnicodeError) as error:
            issue(findings, "error", "release-manifest-read", str(args.release_manifest), str(error))
    pages: dict[str, tuple[PageParser, str]] = {}
    routes: dict[str, str] = {}
    internal_inbound: Counter[str] = Counter()
    pending_fragments: list[tuple[str, str, str, str]] = []
    titles: dict[tuple[str, str], list[str]] = defaultdict(list)
    descriptions: dict[tuple[str, str], list[str]] = defaultdict(list)
    nginx_path = ROOT / "cloudflare" / "booking-api" / "ops" / "nginx-lenabahri.conf"
    nginx_text = nginx_path.read_text(encoding="utf-8", errors="replace") if nginx_path.exists() else ""
    legacy_redirects = {
        "/about-me": "https://lenabahri.ir/about.html",
        "/about-me/": "https://lenabahri.ir/about.html",
        "/contact-me": "https://lenabahri.ir/#contact",
        "/contact-me/": "https://lenabahri.ir/#contact",
    }
    for route, destination in legacy_redirects.items():
        if not nginx_redirect_exists(nginx_text, route, destination):
            issue(findings, "warning", "legacy-redirect-missing", nginx_path.relative_to(ROOT).as_posix(), f"expected 301 from {route} to {destination}")

    if release_files is None:
        html_files = [
            file for file in ROOT.rglob("*.html")
            if not any(part in SKIP_DIRS for part in file.relative_to(ROOT).parts)
        ]
    else:
        html_files = [ROOT / path for path in sorted(release_files) if Path(path).suffix.lower() == ".html"]
    for file in sorted(html_files):
        relative = file.relative_to(ROOT).as_posix()
        route = page_route(relative)
        parser = PageParser()
        try:
            parser.feed(file.read_text(encoding="utf-8"))
        except (OSError, UnicodeError) as error:
            issue(findings, "error", "html-read", relative, str(error))
            continue
        pages[relative] = (parser, route)
        routes[route] = relative
        title = " ".join("".join(parser.title_parts).split())
        description = " ".join(parser.description[0].split()) if parser.description else ""
        language = parser.html_attrs.get("lang", "")
        locale = locale_for(route, language)
        robots = " ".join(parser.meta.get("robots", [])).lower()
        is_noindex = "noindex" in robots

        if not language:
            issue(findings, "error", "missing-lang", relative, "html lang is missing")
        if not title:
            issue(findings, "error", "missing-title", relative, "title is missing or empty")
        elif len(parser.meta.get("title", [])):
            issue(findings, "warning", "title-meta", relative, "title should use the title element, not a meta title")
        if not is_noindex and not parser.has_refresh and (len(parser.meta.get("description", [])) != 1 or not description):
            issue(findings, "error", "description-count", relative, f"expected one non-empty meta description; found {len(parser.meta.get('description', []))}")
        if not is_noindex and not parser.has_refresh and (len(parser.canonicals) != 1 or not parser.canonicals[0]):
            issue(findings, "error", "canonical-count", relative, f"expected one canonical; found {len(parser.canonicals)}")
        elif parser.canonicals:
            canonical = urlsplit(parser.canonicals[0])
            if canonical.scheme != "https" or canonical.netloc.lower() != "lenabahri.ir":
                issue(findings, "error", "canonical-host", relative, f"canonical must use https://lenabahri.ir; got {parser.canonicals[0]}")
            elif not is_noindex and not parser.has_refresh and canonical.path != route:
                issue(findings, "error", "canonical-not-self", relative, f"canonical path {canonical.path!r} differs from page route {route!r}")
            if route and route not in {"/"} and route.endswith("//"):
                issue(findings, "warning", "canonical-double-slash", relative, f"canonical has repeated trailing slash: {route}")
        if parser.has_refresh and not (route in {"/contact-me", "/contact-me/"} and nginx_redirect_exists(nginx_text, route, "https://lenabahri.ir/#contact")):
            issue(findings, "warning", "client-side-redirect", relative, "meta refresh is a fallback redirect; prefer a server-side redirect when deployment access permits")
        if not is_noindex and not parser.has_refresh and len(parser.h1_parts) != 1:
            issue(findings, "warning", "h1-count", relative, f"expected one primary h1; found {len(parser.h1_parts)}")
        if not is_noindex and not parser.meta.get("viewport"):
            issue(findings, "warning", "missing-viewport", relative, "viewport meta is missing")
        if not is_noindex and not parser.has_refresh and (not parser.meta.get("og:title") or not parser.meta.get("og:description") or not parser.meta.get("og:url") or not parser.meta.get("og:image")):
            issue(findings, "warning", "open-graph", relative, "one or more core Open Graph tags are missing")
        if not is_noindex and not parser.has_refresh and not parser.meta.get("twitter:card"):
            issue(findings, "info", "twitter-card", relative, "twitter:card is missing")
        for image in parser.images:
            if "alt" not in image:
                issue(findings, "warning", "image-alt-missing", relative, f"image has no alt attribute: {image.get('src', '(src missing)')}")
        for raw in parser.json_ld:
            try:
                json.loads(raw)
            except json.JSONDecodeError as error:
                issue(findings, "error", "json-ld-invalid", relative, f"JSON-LD parse error at character {error.pos}")
        for code, target, kind in parser.links:
            resolved = urlsplit(urljoin(SITE + route, target))
            if resolved.scheme not in {"http", "https"} or resolved.netloc.lower() not in {"lenabahri.ir", "www.lenabahri.ir"}:
                continue
            if resolved.path.startswith("/api/"):
                continue
            local = route_file(resolved.path or "/", release_files)
            if local is None:
                issue(findings, "error" if kind == "anchor" else "warning", "internal-target-missing", relative, f"{kind} points to missing local target {resolved.path}")
            elif kind == "anchor" and (ROOT / unquote(resolved.path).lstrip("/")).is_dir() and resolved.path != "/" and not resolved.path.endswith("/"):
                issue(findings, "warning", "internal-slash-redirect", relative, f"directory link likely redirects to trailing slash: {resolved.path}")
            elif kind == "anchor" and resolved.fragment and local.suffix.lower() == ".html":
                target_relative = local.relative_to(ROOT).as_posix()
                pending_fragments.append((relative, target_relative, unquote(resolved.fragment), resolved.path or route))
            if kind == "anchor" and local is not None:
                target_relative = local.relative_to(ROOT).as_posix()
                target_route = page_route(target_relative) if local.suffix.lower() == ".html" else None
                if target_route is not None and target_route != route:
                    internal_inbound[target_route] += 1
        if title:
            titles[(locale, title.casefold())].append(relative)
        if description:
            descriptions[(locale, description.casefold())].append(relative)

    for source_relative, target_relative, fragment, target_path in pending_fragments:
        target_parser = pages.get(target_relative, (None, ""))[0]
        if target_parser is not None and not target_parser.has_refresh and fragment not in target_parser.anchors:
            issue(findings, "warning", "internal-fragment-missing", source_relative, f"anchor points to missing fragment #{fragment} on {target_path}")

    for (locale, value), files in titles.items():
        if len(files) > 1:
            issue(findings, "warning", "duplicate-title", ", ".join(files[:4]), f"duplicate title in {locale}: {value[:100]}")
    for (locale, value), files in descriptions.items():
        if len(files) > 1:
            issue(findings, "warning", "duplicate-description", ", ".join(files[:4]), f"duplicate description in {locale}: {value[:100]}")

    for relative, (parser, route) in pages.items():
        robots = " ".join(parser.meta.get("robots", [])).lower()
        if "noindex" in robots or parser.has_refresh:
            continue
        if route != "/" and not internal_inbound[route]:
            issue(findings, "warning", "page-without-internal-inlinks", relative, f"indexable route {route} has no inbound crawlable internal links")
        seen_langs: set[str] = set()
        for language, target in parser.alternates:
            if language in seen_langs:
                issue(findings, "warning", "hreflang-duplicate", relative, f"duplicate hreflang {language}")
            seen_langs.add(language)
            split = urlsplit(target)
            if split.scheme != "https" or split.netloc.lower() != "lenabahri.ir":
                issue(findings, "warning", "hreflang-host", relative, f"hreflang target must use canonical site host: {target}")
                continue
            target_file = route_file(split.path, release_files)
            if target_file is None:
                issue(findings, "warning", "hreflang-target-missing", relative, f"hreflang target does not resolve locally: {target}")
                continue
            target_relative = target_file.relative_to(ROOT).as_posix()
            target_parser = pages.get(target_relative, (None, ""))[0]
            if target_parser is None or not any(urlsplit(value).path == route for _, value in target_parser.alternates):
                issue(findings, "warning", "hreflang-not-reciprocal", relative, f"target {target} does not link back to route {route}")
        base_route = route
        first = route.strip("/").split("/", 1)[0]
        if first in {"en", "ar", "zh"}:
            base_route = route[len(first) + 1 :]
            base_route = base_route or "/"
        expected = {"fa": base_route, "x-default": base_route}
        for code, prefix in (("en", "en"), ("ar", "ar"), ("zh-cn", "zh")):
            candidate_route = f"/{prefix}{base_route}" if base_route != "/" else f"/{prefix}/"
            if route_file(candidate_route, release_files) is not None:
                expected[code] = candidate_route
        actual = dict(parser.alternates)
        for code, target_path in expected.items():
            if actual.get(code) is None or urlsplit(actual[code]).path != target_path:
                issue(findings, "warning", "hreflang-missing-or-wrong", relative, f"expected hreflang {code} to resolve to {target_path}")

    sitemap = ROOT / "sitemap.xml"
    sitemap_urls: set[str] = set()
    if not sitemap.exists():
        issue(findings, "error", "sitemap-missing", "sitemap.xml", "XML sitemap is missing")
    else:
        try:
            xml_root = ET.parse(sitemap).getroot()
            for node in xml_root.findall("s:url", SITEMAP_NS):
                loc = (node.findtext("s:loc", namespaces=SITEMAP_NS) or "").strip()
                if not loc:
                    issue(findings, "error", "sitemap-empty-loc", "sitemap.xml", "url entry has no loc")
                    continue
                if loc in sitemap_urls:
                    issue(findings, "error", "sitemap-duplicate", "sitemap.xml", loc)
                sitemap_urls.add(loc)
                split = urlsplit(loc)
                if split.scheme != "https" or split.netloc.lower() != "lenabahri.ir":
                    issue(findings, "error", "sitemap-host", "sitemap.xml", f"non-canonical sitemap host or scheme: {loc}")
                    continue
                local = route_file(split.path or "/", release_files)
                if local is None:
                    issue(findings, "error", "sitemap-target-missing", "sitemap.xml", f"URL does not resolve to a local HTML page: {loc}")
                elif local.suffix.lower() != ".html":
                    issue(findings, "warning", "sitemap-non-html", "sitemap.xml", f"URL resolves to a non-HTML file: {loc}")
                elif split.path != "/" and not split.path.endswith("/") and local.name == "index.html":
                    issue(findings, "error", "sitemap-slash-redirect", "sitemap.xml", f"directory page URL lacks final slash: {loc}")
                page_relative = local.relative_to(ROOT).as_posix() if local.is_relative_to(ROOT) else ""
                if page_relative in pages:
                    page_parser = pages[page_relative][0]
                    if page_parser.meta.get("robots") and any("noindex" in content.lower() for content in page_parser.meta["robots"]):
                        issue(findings, "warning", "sitemap-noindex", page_relative, f"noindex page is in sitemap: {loc}")
                for node_lastmod in [node.find("s:lastmod", SITEMAP_NS)]:
                    if node_lastmod is not None and node_lastmod.text:
                        try:
                            parsed_date = date.fromisoformat(node_lastmod.text.strip()[:10])
                            if parsed_date > date.today():
                                issue(findings, "warning", "sitemap-future-lastmod", "sitemap.xml", f"future lastmod {node_lastmod.text} for {loc}")
                        except ValueError:
                            issue(findings, "warning", "sitemap-invalid-lastmod", "sitemap.xml", f"invalid lastmod {node_lastmod.text!r} for {loc}")
        except ET.ParseError as error:
            issue(findings, "error", "sitemap-invalid-xml", "sitemap.xml", str(error))

    extra_registry = ROOT / "data" / "beauty-news-extra.json"
    if extra_registry.exists():
        try:
            extra_data = json.loads(extra_registry.read_text(encoding="utf-8"))
            held_slugs = {article.get("slug") for article in extra_data.get("articles", []) if article.get("published") is False}
            held_slugs.update(slug for slug, published in extra_data.get("publicationOverrides", {}).items() if published is False)
            articles_by_slug = {article.get("slug"): article for article in extra_data.get("articles", []) if article.get("slug")}
            if release_files is not None and "data/beauty-news-extra.json" in release_files:
                issue(findings, "error", "held-draft-registry-in-release", "data/beauty-news-extra.json", "editorial source registry can expose unpublished draft text; omit it from the public release")
            for slug in filter(None, held_slugs):
                routes = [f"/khabar/beauty/{slug}/"] + [f"/{locale}/khabar/beauty/{slug}/" for locale in ("en", "ar", "zh")]
                release_routes = [f"khabar/beauty/{slug}/index.html"] + [f"{locale}/khabar/beauty/{slug}/index.html" for locale in ("en", "ar", "zh")]
                if release_files is not None:
                    for release_route in release_routes:
                        if release_route in release_files:
                            issue(findings, "error", "held-article-in-release", release_route, "held news article exists in the staged public release")
                    image_path = str(articles_by_slug.get(slug, {}).get("image", "")).split("?", 1)[0].lstrip("/")
                    if image_path and image_path in release_files:
                        issue(findings, "error", "held-article-image-in-release", image_path, "image belonging to a held article exists in the staged public release")
                    text_suffixes = {".html", ".js", ".json", ".md", ".txt", ".xml", ".webmanifest"}
                    for release_path in sorted(release_files):
                        if slug not in release_path and Path(release_path).suffix.lower() not in text_suffixes:
                            continue
                        candidate = ROOT / release_path
                        if candidate.is_file():
                            try:
                                if slug in candidate.read_text(encoding="utf-8"):
                                    issue(findings, "error", "held-draft-reference-in-release", release_path, f"public release contains a reference to held article {slug}")
                            except UnicodeError:
                                pass
                for route in routes:
                    if SITE + route in sitemap_urls:
                        issue(findings, "error", "held-article-in-sitemap", "sitemap.xml", f"held news article must not be advertised: {SITE + route}")
                    if route_file(route) is not None:
                        issue(findings, "error", "held-article-page-present", route, "held news article still has a generated public HTML page")
        except (OSError, json.JSONDecodeError) as error:
            issue(findings, "error", "news-registry-invalid", "data/beauty-news-extra.json", str(error))

    for relative, (parser, route) in pages.items():
        robots = " ".join(parser.meta.get("robots", [])).lower()
        if "noindex" not in robots and len(parser.canonicals) == 1 and parser.canonicals[0] == SITE + route:
            if SITE + route not in sitemap_urls:
                issue(findings, "warning", "indexable-not-in-sitemap", relative, f"self-canonical indexable page missing from sitemap: {SITE + route}")

    robots_file = ROOT / "robots.txt"
    if not robots_file.exists():
        issue(findings, "warning", "robots-missing", "robots.txt", "robots.txt is missing")
    elif "sitemap:" not in robots_file.read_text(encoding="utf-8", errors="replace").lower():
        issue(findings, "warning", "robots-sitemap", "robots.txt", "no sitemap directive found")

    counts = Counter(item["severity"] for item in findings)
    if args.json:
        severity_counts = {level: counts.get(level, 0) for level in ("error", "warning", "info")}
        print(json.dumps({"root": str(ROOT), "html_pages": len(pages), "sitemap_urls": len(sitemap_urls), "counts": severity_counts, "findings": findings}, ensure_ascii=True, indent=2))
    else:
        print(f"Pages: {len(pages)} HTML | Sitemap: {len(sitemap_urls)} URLs")
        print("Findings: " + ", ".join(f"{level}={counts.get(level, 0)}" for level in ("error", "warning", "info")))
        for severity in ("error", "warning", "info"):
            items = [item for item in findings if item["severity"] == severity]
            print(f"\n[{severity.upper()}] {len(items)}")
            for item in items[: max(0, args.max_items)]:
                print(f"{item['code']} | {item['page']} | {item['detail']}")
            if len(items) > args.max_items:
                print(f"... {len(items) - args.max_items} more")
    return 1 if counts.get("error", 0) else 0


if __name__ == "__main__":
    sys.exit(main())
