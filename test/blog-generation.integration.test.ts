/**
 * Integration tests for the blog generation workflow.
 *
 * Tests the complete pipeline from topic → Gemini AI → file creation,
 * using a temp directory to avoid polluting content/blogs/.
 *
 * The Gemini AI service is mocked so no real API calls are made.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs/promises";
import path from "path";

// ── Mock Gemini AI before any imports that pull it in ──────────────────────
vi.mock("../lib/gemini", () => ({
  generateBlogPost: vi.fn(),
}));

// ── Mock ContentInventoryTracker to avoid persistent state across test runs ─
vi.mock("../lib/content-inventory", () => ({
  ContentInventoryTracker: class MockContentInventoryTracker {
    async logPost() { return undefined; }
    async updatePost() { return undefined; }
    async generateSummary() { return {}; }
    async exportKeywordMapping() { return new Map(); }
    async checkKeywordConflict() { return null; }
  },
}));

import { generateBlogPost as mockGenerateBlogPost } from "../lib/gemini";
import { BlogGenerator } from "../lib/blog-generator";
import { ContentValidator } from "../lib/content-validator";
import type { BlogGeneratorConfig, BlogGenerationRequest } from "../lib/types/seo-blog";

// ── Content builder ────────────────────────────────────────────────────────

/**
 * Builds a structurally valid blog post body (no frontmatter) that satisfies
 * all ContentValidator rules:
 *   - 2500-4000 words
 *   - 1 H1, 5-8 H2, 10-15 H3
 *   - FAQ section with 4-6 Q&A pairs
 *   - Conclusion section
 *   - Exactly 22 internal links (within 20-25 range)
 *   - Lists, bold text, blockquotes for mobile readability
 *
 * The anchor text is intentionally generic (e.g. "this page", "here") so the
 * InternalLinkManager does not find additional keyword matches and insert more
 * links on top of the pre-inserted ones.
 *
 * IMPORTANT: Prose text deliberately avoids words that match InternalLinkManager
 * link-target keywords ("HABET", "sports betting", "about", "disclaimer", "legal",
 * "terms", "company", "cricket", "ipl", "download") to prevent the manager from
 * inserting extra links beyond the 22 pre-inserted ones.
 */
function buildValidBlogContent(primaryKeyword: string): string {
  // 6 H2 sections × 2 H3 each = 12 H3 total (within 10-15 range).
  // Prose is sized to land in the 2500-4000 word window.

  // 22 pre-inserted internal links with generic anchor text so the link
  // manager won't find keyword matches and add duplicates.
  const links = [
    "[this page](/)",
    "[our guide](/blog/habet-app-download-guide)",
    "[these tips](/blog/cricket-betting-tips-india-2026)",
    "[our predictions](/blog/ipl-betting-predictions-2026)",
    "[the homepage](/)",
    "[our about page](/about)",
    "[our disclaimer](/disclaimer)",
    "[the download page](/)",
    "[this guide](/blog/cricket-betting-tips-india-2026)",
    "[these predictions](/blog/ipl-betting-predictions-2026)",
    "[the app page](/)",
    "[responsible gambling info](/disclaimer)",
    "[the download guide](/blog/habet-app-download-guide)",
    "[these wagering tips](/blog/cricket-betting-tips-india-2026)",
    "[the markets page](/)",
    "[our team page](/about)",
    "[this review](/blog/habet-app-download-guide)",
    "[the 2026 predictions](/blog/ipl-betting-predictions-2026)",
    "[the platform page](/)",
    "[our terms page](/disclaimer)",
    "[the main site](/)",
    "[our full guide](/blog/habet-app-download-guide)",
  ];

  // Sentence-level prose block (~50 words each) — uses neutral language to
  // avoid triggering the InternalLinkManager's keyword matching.
  // Deliberately avoids: HABET, sports betting, about, disclaimer, legal, terms,
  // company, cricket, ipl, download, apk, install, android, withdrawal, bonus,
  // promo, review, prediction, tip, guide, market, odds, RTP, win rate.
  const prose =
    "The wagering platform provides excellent features for Indian fans in 2026. " +
    "With competitive payouts ranging from 1.8x to 2.5x and a 97.3% return on live events, " +
    "it stands out among online platforms. " +
    "Statistics show a 54% success rate in home fixtures across 847 T20I fixtures analyzed. " +
    "Always wager responsibly and within your financial means. Never pursue losses.";

  const block = (n: number) => Array(n).fill(prose).join(" ");

  let body = "";
  let linkIdx = 0;
  const nextLink = () => links[linkIdx++];

  // H1 — headings are excluded from paragraph processing by InternalLinkManager
  body += `# ${primaryKeyword} Complete Guide 2026\n\n`;

  // Introduction (2 links) — use "this platform" instead of primaryKeyword in
  // prose to avoid keyword matching by the InternalLinkManager.
  body += `This platform is one of the most searched topics among Indian wagering enthusiasts. `;
  body += `This guide covers everything you need to know for 2026. `;
  body += `Visit ${nextLink()} to get started today. `;
  body += `Always wager responsibly and within your financial means. Never pursue losses.\n\n`;
  body += `${block(1)} Check out ${nextLink()} for more details.\n\n`;

  // 6 H2 sections, each with 2 H3 sub-sections
  // Links per H2: 1 in H2 intro + 1 per H3 = 3 links per H2 × 6 = 18 links
  const h2Titles = [
    "Getting Started",
    "Key Features and Fixtures",
    "Wagering Strategies",
    "Bonuses and Promotions",
    "Payment Methods",
    "Customer Support",
  ];

  for (const h2 of h2Titles) {
    body += `## ${h2}\n\n`;
    body += `${block(1)} Learn more at ${nextLink()}.\n\n`;

    // List for mobile readability
    body += `- **Step 1:** Analyze team form over the last 5 fixtures\n`;
    body += `- **Step 2:** Check pitch conditions and weather forecast\n`;
    body += `- **Step 3:** Review head-to-head statistics carefully\n`;
    body += `- **Step 4:** Set your wagering limits before you start\n\n`;

    // Blockquote
    body += `> **Important:** Never pursue losses. Set wagering limits before you start.\n\n`;

    // 2 H3 sub-sections per H2 (1 link each)
    const h3Titles = [`${h2} Overview`, `${h2} Pro Tips`];
    for (const h3 of h3Titles) {
      body += `### ${h3}\n\n`;
      body += `${block(2)} For more information visit ${nextLink()}.\n\n`;

      // Numbered list — use "this platform" to avoid keyword matching
      body += `1. Research this platform thoroughly before depositing any funds\n`;
      body += `2. Start with small wagers to understand the interface\n`;
      body += `3. Use the live wagering feature for in-play fixtures\n`;
      body += `4. Track your wagers and review performance weekly\n\n`;
    }
  }

  // FAQ section (4 Q&A pairs) — no additional links, use neutral language
  body += `## FAQ\n\n`;
  body += `**Q: Is this platform safe and secure?**\n`;
  body += `**A:** Yes, the platform uses 256-bit SSL encryption. Over 10,000 active users trust it daily.\n\n`;
  body += `**Q: How long do payouts take on the platform?**\n`;
  body += `**A:** UPI payouts are processed within 24 hours. Bank transfers take 2-3 business days.\n\n`;
  body += `**Q: What is the minimum deposit amount?**\n`;
  body += `**A:** The minimum deposit is ₹100. Ensure online wagering is permitted in your jurisdiction.\n\n`;
  body += `**Q: Is online wagering permitted in India?**\n`;
  body += `**A:** Only wager if you are 18+ years old. The platform operates under international licenses.\n\n`;

  // Conclusion (2 links — total = 2 + 18 + 2 = 22)
  body += `## Conclusion\n\n`;
  body += `In conclusion, this platform offers a comprehensive wagering experience for Indian users in 2026. `;
  body += `With competitive payouts, fast processing, and excellent 24/7 customer support, it stands out. `;
  body += `See ${nextLink()} for 50+ fixture wagering events and live streaming for T20 matches. `;
  body += `${block(1)} Always wager responsibly. Visit ${nextLink()} for more information.\n\n`;

  return body;
}

// ── Frontmatter parser ─────────────────────────────────────────────────────

/** Parses YAML frontmatter from a markdown file string. */
function parseFrontmatter(fileContent: string): Record<string, unknown> {
  const match = fileContent.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const yaml = match[1];
  const result: Record<string, unknown> = {};
  const lines = yaml.split("\n");
  let currentKey = "";
  let inArray = false;

  for (const line of lines) {
    if (line.trim().startsWith("- ")) {
      if (inArray && currentKey) {
        const arr = result[currentKey] as string[];
        arr.push(line.trim().slice(2).trim());
      }
    } else if (line.includes(":")) {
      const colonIdx = line.indexOf(":");
      const key = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      currentKey = key;
      if (val === "") {
        inArray = true;
        result[key] = [];
      } else {
        inArray = false;
        result[key] = val.replace(/^["']|["']$/g, "");
      }
    }
  }

  return result;
}

// ── Test Suite ─────────────────────────────────────────────────────────────

describe("Blog Generation Integration", () => {
  let tempDir: string;
  let config: BlogGeneratorConfig;
  let generator: BlogGenerator;

  beforeEach(async () => {
    // Create an isolated temp directory inside the project so that
    // BlogGenerator.writeMarkdownFile (which prepends process.cwd()) resolves
    // to the correct absolute path.
    const relDir = `test-output-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    tempDir = path.join(process.cwd(), relDir);
    await fs.mkdir(tempDir, { recursive: true });

    config = {
      minWordCount: 2500,
      maxWordCount: 4000,
      targetKeywordDensity: { min: 0.008, max: 0.012 },
      author: "HABET Sports Team",
      outputDir: relDir, // relative path — BlogGenerator prepends process.cwd()
    };

    generator = new BlogGenerator(config);

    // Reset mock between tests
    vi.mocked(mockGenerateBlogPost).mockReset();
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  // ── 1. Complete workflow: topic → file creation ──────────────────────────

  describe("complete blog generation workflow", () => {
    it("creates a markdown file when Gemini returns valid content", async () => {
      const primaryKeyword = "habet app download";
      vi.mocked(mockGenerateBlogPost).mockResolvedValue(
        buildValidBlogContent(primaryKeyword)
      );

      const request: BlogGenerationRequest = {
        topic: "HABET App Download Guide 2026",
        primaryKeyword,
        secondaryKeywords: ["habet apk", "habet install", "habet android"],
        searchIntent: "informational",
      };

      const result = await generator.generateBlogPost(request);

      // Log errors for easier debugging if this fails
      if (!result.success) {
        console.error("Validation errors:", result.validationErrors);
      }

      expect(result.success).toBe(true);
      expect(result.slug).toBeTruthy();
      expect(result.title).toBeTruthy();
      expect(result.wordCount).toBeGreaterThan(0);

      // A file should exist on disk
      const files = await fs.readdir(tempDir);
      const mdFiles = files.filter((f) => f.endsWith(".md"));
      expect(mdFiles.length).toBe(1);
      expect(mdFiles[0]).toBe(`${result.slug}.md`);
    });

    it("calls Gemini with the topic and all keywords", async () => {
      vi.mocked(mockGenerateBlogPost).mockResolvedValue(
        buildValidBlogContent("habet cricket")
      );

      const request: BlogGenerationRequest = {
        topic: "HABET Cricket Betting Guide",
        primaryKeyword: "habet cricket",
        secondaryKeywords: ["cricket betting", "ipl betting"],
        searchIntent: "informational",
      };

      await generator.generateBlogPost(request);

      expect(mockGenerateBlogPost).toHaveBeenCalledOnce();
      const [calledTopic, calledKeywords] = vi.mocked(mockGenerateBlogPost).mock.calls[0];
      expect(calledTopic).toBe(request.topic);
      expect(calledKeywords).toContain(request.primaryKeyword);
      for (const kw of request.secondaryKeywords) {
        expect(calledKeywords).toContain(kw);
      }
    });
  });

  // ── 2. File system: valid markdown output ────────────────────────────────

  describe("file system operations", () => {
    it("writes a file with valid YAML frontmatter", async () => {
      const primaryKeyword = "habet betting app";
      vi.mocked(mockGenerateBlogPost).mockResolvedValue(
        buildValidBlogContent(primaryKeyword)
      );

      const request: BlogGenerationRequest = {
        topic: "HABET Betting App Review 2026",
        primaryKeyword,
        secondaryKeywords: ["habet review", "betting app india"],
        searchIntent: "informational",
      };

      const result = await generator.generateBlogPost(request);
      if (!result.success) console.error(result.validationErrors);
      expect(result.success).toBe(true);

      const filePath = path.join(tempDir, `${result.slug}.md`);
      const fileContent = await fs.readFile(filePath, "utf-8");

      // File must start with frontmatter delimiter
      expect(fileContent.startsWith("---\n")).toBe(true);

      const fm = parseFrontmatter(fileContent);

      expect(typeof fm.title).toBe("string");
      expect((fm.title as string).length).toBeGreaterThan(0);

      expect(typeof fm.slug).toBe("string");
      expect(fm.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/); // kebab-case

      expect(typeof fm.date).toBe("string");
      expect(new Date(fm.date as string).getTime()).not.toBeNaN();

      expect(typeof fm.excerpt).toBe("string");
      expect((fm.excerpt as string).length).toBeGreaterThan(0);

      expect(Array.isArray(fm.keywords)).toBe(true);
      expect((fm.keywords as string[]).length).toBeGreaterThanOrEqual(1);

      expect(fm.author).toBe("HABET Sports Team");
      expect(typeof fm.readingTime).toBe("string");
    });

    it("writes a file with valid markdown content structure", async () => {
      const primaryKeyword = "habet sports betting";
      vi.mocked(mockGenerateBlogPost).mockResolvedValue(
        buildValidBlogContent(primaryKeyword)
      );

      const request: BlogGenerationRequest = {
        topic: "HABET Sports Betting Guide",
        primaryKeyword,
        secondaryKeywords: ["sports betting india", "habet odds"],
        searchIntent: "informational",
      };

      const result = await generator.generateBlogPost(request);
      if (!result.success) console.error(result.validationErrors);
      expect(result.success).toBe(true);

      const filePath = path.join(tempDir, `${result.slug}.md`);
      const fileContent = await fs.readFile(filePath, "utf-8");

      // Extract body (after closing ---)
      const bodyMatch = fileContent.match(/^---\n[\s\S]*?\n---\n\n([\s\S]*)$/);
      expect(bodyMatch).not.toBeNull();
      const body = bodyMatch![1];

      // Must have exactly one H1
      const h1Matches = body.match(/^# .+$/gm) || [];
      expect(h1Matches.length).toBe(1);

      // Must have at least 5 H2 headings
      const h2Matches = body.match(/^## .+$/gm) || [];
      expect(h2Matches.length).toBeGreaterThanOrEqual(5);

      // Must have at least 10 H3 headings
      const h3Matches = body.match(/^### .+$/gm) || [];
      expect(h3Matches.length).toBeGreaterThanOrEqual(10);

      // Must have a FAQ section
      expect(body).toMatch(/^## FAQ/im);

      // Must have a Conclusion section
      expect(body).toMatch(/^## Conclusion/im);
    });

    it("uses the slug as the filename", async () => {
      vi.mocked(mockGenerateBlogPost).mockResolvedValue(
        buildValidBlogContent("habet apk")
      );

      const result = await generator.generateBlogPost({
        topic: "HABET APK Download 2026",
        primaryKeyword: "habet apk",
        secondaryKeywords: ["habet download"],
        searchIntent: "transactional",
      });

      if (!result.success) console.error(result.validationErrors);
      expect(result.success).toBe(true);

      const expectedFile = path.join(tempDir, `${result.slug}.md`);
      await expect(fs.access(expectedFile)).resolves.toBeUndefined();
    });
  });

  // ── 3. Error handling ────────────────────────────────────────────────────

  describe("error handling", () => {
    it(
      "returns success=false when Gemini throws an error",
      async () => {
        vi.mocked(mockGenerateBlogPost).mockRejectedValue(
          new Error("Gemini API quota exceeded")
        );

        const result = await generator.generateBlogPost({
          topic: "HABET App Guide",
          primaryKeyword: "habet app",
          secondaryKeywords: [],
          searchIntent: "informational",
        });

        expect(result.success).toBe(false);
        expect(result.validationErrors.length).toBeGreaterThan(0);
        // No file should be written
        const files = await fs.readdir(tempDir);
        expect(files.filter((f) => f.endsWith(".md")).length).toBe(0);
      },
      20_000 // allow for retry backoff
    );

    it("returns success=false when Gemini returns empty content", async () => {
      vi.mocked(mockGenerateBlogPost).mockResolvedValue("");

      const result = await generator.generateBlogPost({
        topic: "HABET App Guide",
        primaryKeyword: "habet app",
        secondaryKeywords: [],
        searchIntent: "informational",
      });

      expect(result.success).toBe(false);
      expect(result.validationErrors.length).toBeGreaterThan(0);
    });

    it("returns success=false when Gemini returns content without an H1 title", async () => {
      vi.mocked(mockGenerateBlogPost).mockResolvedValue(
        "This is some content without any heading.\n\nMore content here."
      );

      const result = await generator.generateBlogPost({
        topic: "HABET App Guide",
        primaryKeyword: "habet app",
        secondaryKeywords: [],
        searchIntent: "informational",
      });

      expect(result.success).toBe(false);
      expect(result.validationErrors).toContain(
        "Failed to extract title from generated content"
      );
    });

    it("returns success=false when content is too short (below 2500 words)", async () => {
      vi.mocked(mockGenerateBlogPost).mockResolvedValue(
        "# HABET App Guide\n\nThis is a very short post."
      );

      const result = await generator.generateBlogPost({
        topic: "HABET App Guide",
        primaryKeyword: "habet app",
        secondaryKeywords: [],
        searchIntent: "informational",
      });

      expect(result.success).toBe(false);
      const hasWordCountError = result.validationErrors.some((e) =>
        e.toLowerCase().includes("word count")
      );
      expect(hasWordCountError).toBe(true);
    });

    it(
      "does not write a file when generation fails",
      async () => {
        vi.mocked(mockGenerateBlogPost).mockRejectedValue(
          new Error("Network error")
        );

        await generator.generateBlogPost({
          topic: "HABET App Guide",
          primaryKeyword: "habet app",
          secondaryKeywords: [],
          searchIntent: "informational",
        });

        const files = await fs.readdir(tempDir);
        expect(files.filter((f) => f.endsWith(".md")).length).toBe(0);
      },
      20_000
    );
  });

  // ── 4. Frontmatter and content structure validation ──────────────────────

  describe("generated file content validation", () => {
    it("generated file passes ContentValidator frontmatter checks", async () => {
      const primaryKeyword = "habet ipl betting";
      vi.mocked(mockGenerateBlogPost).mockResolvedValue(
        buildValidBlogContent(primaryKeyword)
      );

      const result = await generator.generateBlogPost({
        topic: "HABET IPL Betting Guide 2026",
        primaryKeyword,
        secondaryKeywords: ["ipl 2026 betting", "cricket betting tips"],
        searchIntent: "informational",
      });

      if (!result.success) console.error(result.validationErrors);
      expect(result.success).toBe(true);

      const filePath = path.join(tempDir, `${result.slug}.md`);
      const fileContent = await fs.readFile(filePath, "utf-8");

      const fmMatch = fileContent.match(/^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/);
      expect(fmMatch).not.toBeNull();

      const fm = parseFrontmatter(fileContent);
      const body = fmMatch![2];

      const validator = new ContentValidator();
      const blogPost = {
        frontmatter: {
          title: fm.title as string,
          slug: fm.slug as string,
          date: fm.date as string,
          excerpt: fm.excerpt as string,
          keywords: fm.keywords as string[],
          author: fm.author as string,
          readingTime: fm.readingTime as string,
        },
        content: body,
      };

      const frontmatterResult = validator.validateFrontmatter(blogPost);
      expect(frontmatterResult.passed).toBe(true);
      expect(frontmatterResult.errors).toHaveLength(0);
    });

    it("generated file has a valid ISO 8601 date in frontmatter", async () => {
      vi.mocked(mockGenerateBlogPost).mockResolvedValue(
        buildValidBlogContent("habet withdrawal")
      );

      const result = await generator.generateBlogPost({
        topic: "How to Withdraw from HABET",
        primaryKeyword: "habet withdrawal",
        secondaryKeywords: ["habet payout"],
        searchIntent: "transactional",
      });

      if (!result.success) console.error(result.validationErrors);
      expect(result.success).toBe(true);

      const filePath = path.join(tempDir, `${result.slug}.md`);
      const fileContent = await fs.readFile(filePath, "utf-8");
      const fm = parseFrontmatter(fileContent);

      const date = new Date(fm.date as string);
      expect(date.getTime()).not.toBeNaN();
      // Date should be recent (within last minute)
      expect(Date.now() - date.getTime()).toBeLessThan(60_000);
    });

    it("generated file slug matches the filename", async () => {
      vi.mocked(mockGenerateBlogPost).mockResolvedValue(
        buildValidBlogContent("habet bonus")
      );

      const result = await generator.generateBlogPost({
        topic: "HABET Bonus and Promotions 2026",
        primaryKeyword: "habet bonus",
        secondaryKeywords: ["habet promo code"],
        searchIntent: "transactional",
      });

      if (!result.success) console.error(result.validationErrors);
      expect(result.success).toBe(true);

      const filePath = path.join(tempDir, `${result.slug}.md`);
      const fileContent = await fs.readFile(filePath, "utf-8");
      const fm = parseFrontmatter(fileContent);

      // Slug in frontmatter must match the filename (without .md)
      expect(fm.slug).toBe(result.slug);
    });

    it("generated file has readingTime consistent with word count", async () => {
      vi.mocked(mockGenerateBlogPost).mockResolvedValue(
        buildValidBlogContent("habet cricket tips")
      );

      const result = await generator.generateBlogPost({
        topic: "HABET Cricket Tips 2026",
        primaryKeyword: "habet cricket tips",
        secondaryKeywords: ["cricket betting strategy"],
        searchIntent: "informational",
      });

      if (!result.success) console.error(result.validationErrors);
      expect(result.success).toBe(true);

      const filePath = path.join(tempDir, `${result.slug}.md`);
      const fileContent = await fs.readFile(filePath, "utf-8");
      const fm = parseFrontmatter(fileContent);

      // readingTime should be "N min read"
      expect(fm.readingTime).toMatch(/^\d+ min read$/);

      // Extract the minute value and verify it's reasonable for the word count
      const minutes = parseInt((fm.readingTime as string).split(" ")[0], 10);
      const expectedMinutes = Math.ceil(result.wordCount / 200);
      expect(minutes).toBe(expectedMinutes);
    });
  });

  // ── 5. Batch generation ──────────────────────────────────────────────────

  describe("batch blog generation", () => {
    it("generates multiple posts and creates a file for each", async () => {
      vi.mocked(mockGenerateBlogPost)
        .mockResolvedValueOnce(buildValidBlogContent("habet app real or fake"))
        .mockResolvedValueOnce(buildValidBlogContent("habet vs other apps"));

      const requests: BlogGenerationRequest[] = [
        {
          topic: "Is HABET App Real or Fake? 2026",
          primaryKeyword: "habet app real or fake",
          secondaryKeywords: ["habet legit", "habet scam"],
          searchIntent: "informational",
        },
        {
          topic: "HABET vs Other Betting Apps Comparison",
          primaryKeyword: "habet vs other apps",
          secondaryKeywords: ["best betting app india"],
          searchIntent: "informational",
        },
      ];

      const results = await generator.generateMultiplePosts(requests);

      expect(results).toHaveLength(2);

      const successfulResults = results.filter((r) => r.success);
      if (successfulResults.length < 2) {
        console.error("Failures:", results.map((r) => r.validationErrors));
      }
      expect(successfulResults.length).toBe(2);

      const files = await fs.readdir(tempDir);
      const mdFiles = files.filter((f) => f.endsWith(".md"));
      expect(mdFiles.length).toBe(2);
    }, 15_000);

    it(
      "continues generating remaining posts when one fails",
      async () => {
        vi.mocked(mockGenerateBlogPost)
          .mockRejectedValueOnce(new Error("API error on first call"))
          .mockRejectedValueOnce(new Error("API error on retry 1"))
          .mockRejectedValueOnce(new Error("API error on retry 2"))
          .mockResolvedValueOnce(buildValidBlogContent("habet cricket markets"));

        const requests: BlogGenerationRequest[] = [
          {
            topic: "HABET App Guide",
            primaryKeyword: "habet app guide",
            secondaryKeywords: [],
            searchIntent: "informational",
          },
          {
            topic: "HABET Cricket Markets Explained",
            primaryKeyword: "habet cricket markets",
            secondaryKeywords: ["cricket betting markets"],
            searchIntent: "informational",
          },
        ];

        const results = await generator.generateMultiplePosts(requests);

        expect(results).toHaveLength(2);
        expect(results[0].success).toBe(false);
        if (!results[1].success) console.error(results[1].validationErrors);
        expect(results[1].success).toBe(true);

        // Only the second post should have a file
        const files = await fs.readdir(tempDir);
        const mdFiles = files.filter((f) => f.endsWith(".md"));
        expect(mdFiles.length).toBe(1);
      },
      30_000
    );
  });
});
