/**
 * Blog Post Validation — Task 16.2
 *
 * Runs ContentValidator on all new blog posts generated in task 16.1
 * and reports quality-standard results.
 *
 * Run with: npx vitest run scripts/validate-blog-posts.test.ts
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { ContentValidator } from "../lib/content-validator";
import type { BlogPost } from "../lib/types/seo-blog";

// ─── Configuration ────────────────────────────────────────────────────────────

const BLOGS_DIR = path.join(process.cwd(), "content", "blogs");

/** Posts that existed before the SEO Blog Expansion spec — skip these */
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
  return /\d+%|\d+\s*(crore|lakh|thousand|million)|\d+\s*matches|\d+\s*users/i.test(
    content
  );
}

// ─── Discover new posts ───────────────────────────────────────────────────────

const allFiles = fs
  .readdirSync(BLOGS_DIR)
  .filter((f) => f.endsWith(".md"))
  .sort();

const newPostFiles = allFiles.filter((f) => !PRE_EXISTING_POSTS.has(f));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Task 16.2 — Generated blog post quality validation", () => {
  const validator = new ContentValidator();

  it("should have at least 5 new posts generated", () => {
    expect(newPostFiles.length).toBeGreaterThanOrEqual(5);
    console.log(`\nNew posts found (${newPostFiles.length}):`);
    newPostFiles.forEach((f) => console.log(`  • ${f}`));
  });

  for (const filename of newPostFiles) {
    describe(`${filename}`, () => {
      const post = loadPost(filename);
      const primaryKeyword =
        PRIMARY_KEYWORDS[filename] ||
        (post.frontmatter.keywords?.[0] ?? "habet");

      const wordCount = countWords(post.content);
      const internalLinks = countInternalLinks(post.content);
      const headings = countHeadings(post.content);
      const keywordOccurrences = countKeyword(post.content, primaryKeyword);
      const keywordDensity =
        wordCount > 0 ? (keywordOccurrences / wordCount) * 100 : 0;

      it("word count is between 2500 and 4000", () => {
        console.log(`  Word count: ${wordCount}`);
        expect(wordCount).toBeGreaterThanOrEqual(2500);
        expect(wordCount).toBeLessThanOrEqual(4000);
      });

      it("internal link count is between 20 and 25", () => {
        console.log(`  Internal links: ${internalLinks}`);
        expect(internalLinks).toBeGreaterThanOrEqual(20);
        expect(internalLinks).toBeLessThanOrEqual(25);
      });

      it(`keyword density for "${primaryKeyword}" is between 0.8% and 1.2%`, () => {
        console.log(
          `  Keyword density: ${keywordDensity.toFixed(2)}% (${keywordOccurrences} occurrences in ${wordCount} words)`
        );
        expect(keywordDensity).toBeGreaterThanOrEqual(0.8);
        expect(keywordDensity).toBeLessThanOrEqual(1.2);
      });

      it("heading structure: exactly 1 H1", () => {
        console.log(`  H1 count: ${headings.h1}`);
        expect(headings.h1).toBe(1);
      });

      it("heading structure: 5–8 H2 headings", () => {
        console.log(`  H2 count: ${headings.h2}`);
        expect(headings.h2).toBeGreaterThanOrEqual(5);
        expect(headings.h2).toBeLessThanOrEqual(8);
      });

      it("heading structure: 10–15 H3 headings", () => {
        console.log(`  H3 count: ${headings.h3}`);
        expect(headings.h3).toBeGreaterThanOrEqual(10);
        expect(headings.h3).toBeLessThanOrEqual(15);
      });

      it("EEAT: has FAQ section", () => {
        expect(hasFAQ(post.content)).toBe(true);
      });

      it("EEAT: has responsible gambling disclaimer", () => {
        expect(hasDisclaimer(post.content)).toBe(true);
      });

      it("EEAT: has data points / statistics", () => {
        expect(hasDataPoints(post.content)).toBe(true);
      });

      it("ContentValidator.validateWordCount passes", () => {
        const result = validator.validateWordCount(post);
        if (!result.passed) {
          console.log(`  Word count errors: ${result.errors.join(", ")}`);
        }
        expect(result.passed).toBe(true);
      });

      it("ContentValidator.validateInternalLinks passes", () => {
        const result = validator.validateInternalLinks(post);
        if (!result.passed) {
          console.log(`  Link errors: ${result.errors.join(", ")}`);
        }
        expect(result.passed).toBe(true);
      });

      it("ContentValidator.validateHeadingStructure passes", () => {
        const result = validator.validateHeadingStructure(post);
        if (!result.passed) {
          console.log(`  Heading errors: ${result.errors.join(", ")}`);
        }
        expect(result.passed).toBe(true);
      });

      it("ContentValidator.validateFAQSection passes", () => {
        const result = validator.validateFAQSection(post);
        if (!result.passed) {
          console.log(`  FAQ errors: ${result.errors.join(", ")}`);
        }
        expect(result.passed).toBe(true);
      });

      it("ContentValidator.validateFrontmatter passes", () => {
        const result = validator.validateFrontmatter(post);
        if (!result.passed) {
          console.log(`  Frontmatter errors: ${result.errors.join(", ")}`);
        }
        expect(result.passed).toBe(true);
      });
    });
  }
});
