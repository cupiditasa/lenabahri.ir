---
name: lena-bahri-newsroom-self-review
description: "Review Lena Bahri newsroom results against real editorial, technical, and audience evidence; identify one narrow correction and verify it. Use for daily reports and recurring defects, not for discovering or publishing news."
metadata:
  short-description: "Evidence-based newsroom self-review"
---

# Lena Bahri newsroom self-review

Use this skill with `.agents/skills/lena-bahri-newsroom/SKILL.md` when preparing a daily newsroom report or correcting a demonstrated recurring defect.

## Evidence to review

- Read the previous complete local calendar day's newsroom logs, article statuses, source records, and build/locale audit results.
- Review likes, reactions, comments, shares, clicks, reach, and impressions only when real platform data is available. Record the platform, language, format, time window, and sample size.
- Compare only similar posts and time windows. Treat engagement as audience feedback, never as evidence that a claim is true.
- Separate observed facts from explanations. A single post or small sample can suggest a question, but cannot establish a general audience preference or causal effect.

## Find and correct defects

- Check for repeatable problems in sourcing, fact accuracy, translation, editing, SEO metadata, image labeling/branding, locale routing, and technical generation.
- Prioritize factual, attribution, accessibility, and release-gate failures over engagement improvements.
- When evidence supports an issue, record the observation, source evidence, likely cause, confidence, smallest reversible correction, and the result of the relevant existing audit.
- Make a narrow correction only when it stays within the newsroom skill's standards. Recheck every affected language and generated page when content or routes change.
- Never relax the two-independent-source rule, fabricate analytics, hide uncertainty, add misleading headlines, or trade accuracy and accessibility for engagement.
- If evidence is insufficient, make no behavioral change. Record what is missing and the next comparable observation that would help.
- A demonstrated repeatable defect may justify a focused update to this skill or the newsroom skill. Keep the edit small, preserve prior constraints, and record the change and its verification in the dated log.

## Daily report

After editorial and technical checks finish, return a concise Persian report for the previous complete local day. Include verified output and publication status, real performance measures or their absence, blockers, today's plan, and one evidence-based learning with confidence and a next check. If any required check fails, report the affected work as held and state the concrete reason.

Save the dated review in `.agents/skills/lena-bahri-newsroom/logs/` using the local date and a name such as `YYYY-MM-DD-self-review.md`. Do not include credentials or private account data. This skill does not authorize publishing, sending messages, changing task schedules, or claiming an unverified improvement.
