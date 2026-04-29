/**
 * Blog Post Validation Script
 *
 * Runs ContentValidator on all generated blog posts in content/blogs/
 * and reports validation results for task 16.2.
 *
 * Usage: npx ts-node scripts/validate-blog-posts.ts
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { ContentValidator } from "../lib/content-validator";
import type { BlogPost } from "../lib/types/seo-blog";

// ─── Configuration ────────────────────────────────────────────────────────────

const BLOGS_DIR = path.join(process.cwd(), "content", "blogs");

/** Posts that existed before the SEO Blog Expansion spec */
const PRE_EXISTING_POSTS = new Set([
  "cricket-betting-tips-india-2026.md",
  "ipl-betting-predictions-2026.md",
  "habet-app-download-guide.md",
]);

/** Primary keyword for each new post (used for keyword-density check) */
const PRIMARY_KEYWORDS: Record<string, string> = {
  "is-habet-app-real-or-fake-legitimacy-verification-2026.md":
    "habet app real or fake",
  "habet-betting-app-download-guide-android-ios-2026.md": "habet app download",
  "habet-vs-other-betting-apps-complete-comparison-2026.md":
    "habet betting app india",
  "how-to-withdraw-money-from-habet-step-by-step-guide-2026.md":
    "habet withdrawal",
  "habet-cricket-betting-markets-explained-complete-guide-2026.md":
    "habet cricket app",
  "habet-ipl-betting-bonus-and-promotions-2026.md": "habet ipl bonus",
  "habet-app-login-account-management-guide-2026.md": "habet app login",
  "habet-ipl-betting-tips-beginners-guide-india-2026.md":
    "ipl betting tips 2026",
  "habet-betting-app-real-or-fake-complete-guide-2026.md":
    "habet betting app real or fake",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadPost(filename: string): BlogPost {
  const raw = fs.readFileSync(path.join(BLOGS_DIR, filename), "utf-8");
  const { data, content } = matter(raw);
  return {
    frontmatter: data as BlogPost["frontmatter"],
    content,
  };
}

function countWords(content: string): number {
  const clean = content
    .replace(/^#+\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~`]/g, "")
    .replace(/\n+/g, " ")
    .trim();
  if (!clean) return 0;
  return clean.split(/\s+/).filter((w) => w.length > 0).length;
}

function countInternalLinks(content: string): number {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let count = 0;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const url = match[2];
    if (url.startsWith("/") && !url.startsWith("//")) count++;
  }
  return count;
}

function countHeadings(content: string) {
  return {
    h1: (content.match(/^# .+$/gm) || []).length,
    h2: (content.match(/^## .+$/gm) || []).length,
    h3: (content.match(/^### .+$/gm) || []).length,
  };
}

function countKeyword(content: string, keyword: string): number {
  const clean = content
    .replace(/^#+\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~`]/g, "")
    .replace(/\n+/g, " ")
    .trim()
    .toLowerCase();
  const escaped = keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "gi");
  return (clean.match(regex) || []).length;
}

function hasFAQ(content: string): boolean {
  return /^##\s+FAQ\s*$/im.test(content);
}

function hasDisclaimer(content: string): boolean {
  return /responsible gambling/i.test(content);
}

function hasDataPoints(content: string): boolean {
  // Look for statistics, percentages, or specific numbers
  return /\d+%|\d+\s*(crore|lakh|thousand|million)|\d+\s*matches|\d+\s*users/i.test(
    content
  );
}

function hasTOC(content: string): boolean {
  return (
    /^##?\s+(Table of Contents|Contents|TOC)/im.test(content) ||
    /^[-*+]\s+\[.+\]\(#.+\)/m.test(content)
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const validator = new ContentValidator();

  const allFiles = fs
    .readdirSync(BLOGS_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

  const newPostFiles = allFiles.filter((f) => !PRE_EXISTING_POSTS.has(f));

  console.log("=".repeat(80));
  console.log("BLOG POST VALIDATION REPORT — Task 16.2");
  console.log("=".repeat(80));
  console.log(`\nTotal posts in content/blogs/: ${allFiles.length}`);
  console.log(`Pre-existing posts (skipped):  ${PRE_EXISTING_POSTS.size}`);
  console.log(`New posts to validate:         ${newPostFiles.length}`);
  console.log("\n" + "=".repeat(80));

  const summary: {
    file: string;
    passed: boolean;
    wordCount: number;
    internalLinks: number;
    keywordDensity: string;
    headings: { h1: number; h2: number; h3: number };
    hasFAQ: boolean;
    hasDisclaimer: boolean;
    hasDataPoints: boolean;
    hasTOC: boolean;
    errors: string[];
    warnings: string[];
  }[] = [];

  for (const filename of newPostFiles) {
    console.log(`\n${"─".repeat(80)}`);
    console.log(`FILE: ${filename}`);
    console.log("─".repeat(80));

    const post = loadPost(filename);
    const primaryKeyword =
      PRIMARY_KEYWORDS[filename] ||
      (post.frontmatter.keywords?.[0] ?? "habet");

    // ── Metrics ──────────────────────────────────────────────────────────────
    const wordCount = countWords(post.content);
    const internalLinks = countInternalLinks(post.content);
    const headings = countHeadings(post.content);
    const keywordOccurrences = countKeyword(post.content, primaryKeyword);
    const keywordDensity =
      wordCount > 0 ? (keywordOccurrences / wordCount) * 100 : 0;
    const faqPresent = hasFAQ(post.content);
    const disclaimerPresent = hasDisclaimer(post.content);
    const dataPointsPresent = hasDataPoints(post.content);
    const tocPresent = hasTOC(post.content);

    // ── Run ContentValidator ──────────────────────────────────────────────────
    const wcResult = validator.validateWordCount(post);
    const kdResult = validator.validateKeywordDensity(post, primaryKeyword);
    const ilResult = validator.validateInternalLinks(post);
    const hsResult = validator.validateHeadingStructure(post);
    const faqResult = validator.validateFAQSection(post);
    const fmResult = validator.validateFrontmatter(post);

    const allErrors = [
      ...wcResult.errors,
      ...kdResult.errors,
      ...ilResult.errors,
      ...hsResult.errors,
      ...faqResult.errors,
      ...fmResult.errors,
    ];
    const allWarnings = [
      ...wcResult.warnings,
      ...kdResult.warnings,
      ...ilResult.warnings,
      ...hsResult.warnings,
      ...faqResult.warnings,
      ...fmResult.warnings,
    ];

    // EEAT checks (not in ContentValidator, manual)
    if (!disclaimerPresent) {
      allErrors.push("Missing responsible gambling disclaimer (EEAT)");
    }
    if (!dataPointsPresent) {
      allErrors.push("No data points / statistics found (EEAT)");
    }

    const passed = allErrors.length === 0;

    // ── Print results ─────────────────────────────────────────────────────────
    console.log(`\nTitle:    ${post.frontmatter.title}`);
    console.log(`Keyword:  "${primaryKeyword}"`);
    console.log(`\nMetrics:`);
    console.log(
      `  Word count:       ${wordCount}  ${wordCount >= 2500 && wordCount <= 4000 ? "✅" : "❌"} (target: 2500–4000)`
    );
    console.log(
      `  Internal links:   ${internalLinks}  ${internalLinks >= 20 && internalLinks <= 25 ? "✅" : "❌"} (target: 20–25)`
    );
    console.log(
      `  Keyword density:  ${keywordDensity.toFixed(2)}%  ${keywordDensity >= 0.8 && keywordDensity <= 1.2 ? "✅" : "❌"} (target: 0.8–1.2%)`
    );
    console.log(
      `  H1 count:         ${headings.h1}  ${headings.h1 === 1 ? "✅" : "❌"} (target: 1)`
    );
    console.log(
      `  H2 count:         ${headings.h2}  ${headings.h2 >= 5 && headings.h2 <= 8 ? "✅" : "❌"} (target: 5–8)`
    );
    console.log(
      `  H3 count:         ${headings.h3}  ${headings.h3 >= 10 && headings.h3 <= 15 ? "✅" : "❌"} (target: 10–15)`
    );
    console.log(`\nEEAT Elements:`);
    console.log(`  FAQ section:      ${faqPresent ? "✅" : "❌"}`);
    console.log(`  Disclaimer:       ${disclaimerPresent ? "✅" : "❌"}`);
    console.log(`  Data points:      ${dataPointsPresent ? "✅" : "❌"}`);
    console.log(`  TOC:              ${tocPresent ? "✅" : "❌"}`);

    if (allErrors.length > 0) {
      console.log(`\n❌ ERRORS (${allErrors.length}):`);
      allErrors.forEach((e) => console.log(`   • ${e}`));
    }
    if (allWarnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${allWarnings.length}):`);
      allWarnings.forEach((w) => console.log(`   • ${w}`));
    }
    if (allErrors.length === 0) {
      console.log(`\n✅ PASSED — all quality standards met`);
    }

    summary.push({
      file: filename,
      passed,
      wordCount,
      internalLinks,
      keywordDensity: keywordDensity.toFixed(2) + "%",
      headings,
      hasFAQ: faqPresent,
      hasDisclaimer: disclaimerPresent,
      hasDataPoints: dataPointsPresent,
      hasTOC: tocPresent,
      errors: allErrors,
      warnings: allWarnings,
    });
  }

  // ── Summary table ───────────────────────────────────────────────────────────
  console.log("\n\n" + "=".repeat(80));
  console.log("SUMMARY TABLE");
  console.log("=".repeat(80));
  console.log(
    `${"File".padEnd(60)} ${"Words".padStart(6)} ${"Links".padStart(6)} ${"KD%".padStart(6)} ${"H1".padStart(3)} ${"H2".padStart(3)} ${"H3".padStart(3)} ${"Status".padStart(8)}`
  );
  console.log("─".repeat(100));

  let passCount = 0;
  for (const r of summary) {
    const status = r.passed ? "✅ PASS" : "❌ FAIL";
    if (r.passed) passCount++;
    console.log(
      `${r.file.padEnd(60)} ${String(r.wordCount).padStart(6)} ${String(r.internalLinks).padStart(6)} ${r.keywordDensity.padStart(6)} ${String(r.headings.h1).padStart(3)} ${String(r.headings.h2).padStart(3)} ${String(r.headings.h3).padStart(3)} ${status.padStart(8)}`
    );
  }

  console.log("─".repeat(100));
  console.log(
    `\nResult: ${passCount}/${summary.length} posts passed all quality standards`
  );

  const failedPosts = summary.filter((r) => !r.passed);
  if (failedPosts.length > 0) {
    console.log(`\n${"=".repeat(80)}`);
    console.log("FAILURE SUMMARY");
    console.log("=".repeat(80));
    for (const r of failedPosts) {
      console.log(`\n${r.file}:`);
      r.errors.forEach((e) => console.log(`  ❌ ${e}`));
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("END OF REPORT");
  console.log("=".repeat(80) + "\n");

  // Exit with non-zero code if any posts failed
  process.exit(failedPosts.length > 0 ? 1 : 0);
}

main();
