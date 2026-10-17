import test from "node:test";
import assert from "node:assert/strict";
import { serviceDefaults, validNewsArticle, validPortfolio, validServiceCatalog } from "../src/cms.js";

test("the default service catalog is complete and uses Toman values", () => {
  assert.equal(validServiceCatalog(serviceDefaults), true);
  assert.equal(serviceDefaults.find((service) => service.id === "scalp-micropigmentation").price.max, 20_000_000);
  assert.equal(serviceDefaults[0].price.currency, "TOMAN");
});

test("service validation rejects duplicate IDs and inverted price ranges", () => {
  const duplicate = structuredClone(serviceDefaults);
  duplicate[1].id = duplicate[0].id;
  assert.equal(validServiceCatalog(duplicate), false);
  const invalidRange = structuredClone(serviceDefaults);
  invalidRange[0].price.min = invalidRange[0].price.max + 1;
  assert.equal(validServiceCatalog(invalidRange), false);
});

test("portfolio validation accepts site media and rejects unsafe image paths", () => {
  const portfolio = {
    categories: [{ id: "all", label: "همه" }, { id: "brow", label: "ابرو" }],
    projects: [{ id: 1, category: "brow", title: "نمونه", description: "توضیح", image: "/assets/gallery/portfolio/work-01.jpg", detailImage: "/assets/gallery/portfolio/work-02.jpg" }],
    awards: [{ title: "مدرک", subtitle: "دوره", image: "/assets/gallery/awards/award-01.jpg" }],
    people: [{ name: "Artist", category: "دیدار", alt: "تصویر", image: "/assets/gallery/people/event-01.jpg", href: "/people/artist/" }]
  };
  assert.equal(validPortfolio(portfolio), true);
  portfolio.projects[0].image = "assets/gallery/portfolio/work-01.jpg";
  assert.equal(validPortfolio(portfolio), true);
  portfolio.projects[0].image = "/assets/gallery/../../private.jpg";
  assert.equal(validPortfolio(portfolio), false);
});

test("news validation requires a safe slug, source, image, and readable sections", () => {
  const article = {
    title: "گزارش زیبایی",
    description: "توضیح کوتاه و روشن",
    excerpt: "خلاصهٔ گزارش",
    lead: "مقدمهٔ گزارش دربارهٔ موضوع",
    sourceLabel: "منبع",
    sourceTitle: "عنوان گزارش منبع",
    sourceUrl: "https://example.com/story",
    image: "/assets/news/story.jpg",
    imageAlt: "تصویرسازی موضوعی",
    keywords: ["زیبایی"],
    sections: [{ heading: "نکتهٔ اصلی", paragraphs: ["توضیح کامل و قابل فهم."] }]
  };
  assert.equal(validNewsArticle("beauty-story", article), true);
  assert.equal(validNewsArticle("../unsafe", article), false);
  assert.equal(validNewsArticle("beauty-story", { ...article, sourceUrl: "javascript:alert(1)" }), false);
});
