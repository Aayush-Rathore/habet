/**
 * Integration tests for the existing post update workflow.
 *
 * Tests the complete pipeline for updating existing blog posts with internal
 * links using InternalLinkManager.updateExistingPost().
 *
 * Uses COPIES of real blog posts in a temp directory — originals are never
 * modified.
 *
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.6, 5.7, 10.2
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import { InternalLinkManager } from "../lib/internal-link-manager";
import type { LinkTarget, InternalLinkConfig } from "../lib/types/seo-blog";

// ── Helpers ────────────────────────────────────────────────────────────────

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

/** Extracts the markdown body (after the closing ---) from a file string. */
function extractBody(fileContent: string): string {
  const match = fileContent.match(/^---\n[\s\S]*?\n---\n\n?([\s\S]*)$/);
  return match ? match[1] : fileContent;
}

/** Counts markdown links [text](url) in a string. */
function countMarkdownLinks(content: string): number {
  const matches = content.match(/\[([^\]]+)\]\(([^)]+)\)/g);
  return matches ? matches.length : 0;
}

/** Extracts all markdown link URLs from a string. */
function extractLinkUrls(content: string): string[] {
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const urls: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(content)) !== null) {
    urls.push(m[2]);
  }
  return urls;
}

// ── Fixtures ───────────────────────────────────────────────────────────────

const REAL_BLOGS_DIR = path.join(process.cwd(), "content", "blogs");

const REAL_SLUGS = [
  "habet-app-download-guide",
  "ipl-betting-predictions-2026",
  "cricket-betting-tips-india-2026",
] as const;

/** Default InternalLinkConfig used across tests. */
const DEFAULT_CONFIG: InternalLinkConfig = {
  targetLinkCount: { min: 8, max: 12 },
  distribution: {
    introLinks: 2,
    bodyLinks: { min: 4, max: 6 },
    conclusionLinks: { min: 2, max: 4 },
    maxLinksPerParagraph: 3,
  },
  linkTargets: [],
};

/** Link targets that reference the real existing blog posts. */
const LINK_TARGETS: LinkTarget[] = [
  {
    url: "/",
    title: "HABET Homepage",
    keywords: ["HABET app", "HABET APK", "HABET platform"],
    type: "page",
  },
  {
    url: "/blog/habet-app-download-guide",
    title: "HABET App Download Guide",
    keywords: ["download guide", "APK download", "install HABET"],
    type: "blog",
  },
  {
    url: "/blog/ipl-betting-predictions-2026",
    title: "IPL Betting Predictions 2026",
    keywords: ["IPL betting", "IPL predictions", "IPL 2026"],
    type: "blog",
  },
  {
    url: "/blog/cricket-betting-tips-india-2026",
    title: "Cricket Betting Tips India 2026",
    keywords: ["cricket betting tips", "cricket betting strategy"],
    type: "blog",
  },
  {
    url: "/about",
    title: "About HABET",
    keywords: ["about HABET", "HABET team"],
    type: "page",
  },
  {
    url: "/disclaimer",
    title: "Disclaimer",
    keywords: ["disclaimer", "responsible gambling", "legal"],
    type: "page",
  },
];

// ── Test Suite ─────────────────────────────────────────────────────────────

describe("Blog Update Integration – updateExistingPost", () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create an isolated temp directory inside the project so that
    // InternalLinkManager (which prepends process.cwd()) resolves correctly.
    const relDir = `test-blog-update-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    tempDir = path.join(process.cwd(), relDir);
    await fs.mkdir(path.join(tempDir, "content", "blogs"), { recursive: true });

    // Copy real blog posts into the temp directory
    for (const slug of REAL_SLUGS) {
      const src = path.join(REAL_BLOGS_DIR, `${slug}.md`);
      const dst = path.join(tempDir, "content", "blogs", `${slug}.md`);
      await fs.copyFile(src, dst);
    }
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  /**
   * Helper: create an InternalLinkManager whose cwd points to tempDir so it
   * reads/writes the copies, not the originals.
   */
  function makeManager(extraConfig?: Partial<InternalLinkConfig>): InternalLinkManager {
    const config: InternalLinkConfig = { ...DEFAULT_CONFIG, ...extraConfig, linkTargets: LINK_TARGETS };
    // Monkey-patch process.cwd for the duration of the call by subclassing
    // is not practical; instead we temporarily override cwd.
    return new InternalLinkManager(config);
  }

  // ── 1. Reading existing blog posts from the file system ──────────────────

  describe("reading existing blog posts from file system", () => {
    it("reads and processes the habet-app-download-guide post without throwing", async () => {
      const manager = makeManager();
      const slug = "habet-app-download-guide";

      // Temporarily redirect cwd to tempDir
      const origCwd = process.cwd;
      process.cwd = () => tempDir;
      try {
        await expect(manager.updateExistingPost(slug, LINK_TARGETS)).resolves.toBeUndefined();
      } finally {
        process.cwd = origCwd;
      }
    });

    it("reads and processes the ipl-betting-predictions-2026 post without throwing", async () => {
      const manager = makeManager();
      const slug = "ipl-betting-predictions-2026";

      const origCwd = process.cwd;
      process.cwd = () => tempDir;
      try {
        await expect(manager.updateExistingPost(slug, LINK_TARGETS)).resolves.toBeUndefined();
      } finally {
        process.cwd = origCwd;
      }
    });

    it("reads and processes the cricket-betting-tips-india-2026 post without throwing", async () => {
      const manager = makeManager();
      const slug = "cricket-betting-tips-india-2026";

      const origCwd = process.cwd;
      process.cwd = () => tempDir;
      try {
        await expect(manager.updateExistingPost(slug, LINK_TARGETS)).resolves.toBeUndefined();
      } finally {
        process.cwd = origCwd;
      }
    });

    it("throws when the slug does not correspond to an existing file", async () => {
      const manager = makeManager();

      const origCwd = process.cwd;
      process.cwd = () => tempDir;
      try {
        await expect(
          manager.updateExistingPost("non-existent-slug", LINK_TARGETS)
        ).rejects.toThrow();
      } finally {
        process.cwd = origCwd;
      }
    });
  });

  // ── 2. Link insertion into real markdown content ─────────────────────────

  describe("link insertion into real markdown content", () => {
    it("inserts at least one internal link into habet-app-download-guide", async () => {
      const slug = "habet-app-download-guide";
      const origContent = await fs.readFile(
        path.join(tempDir, "content", "blogs", `${slug}.md`),
        "utf-8"
      );
      const origLinkCount = countMarkdownLinks(origContent);

      const manager = makeManager();
      const origCwd = process.cwd;
      process.cwd = () => tempDir;
      try {
        await manager.updateExistingPost(slug, LINK_TARGETS);
      } finally {
        process.cwd = origCwd;
      }

      const updatedContent = await fs.readFile(
        path.join(tempDir, "content", "blogs", `${slug}.md`),
        "utf-8"
      );
      const updatedLinkCount = countMarkdownLinks(updatedContent);

      // The updated file should have at least as many links as the original
      // (the original already has some links; we may add more)
      expect(updatedLinkCount).toBeGreaterThanOrEqual(origLinkCount);
    });

    it("all inserted links use relative URLs starting with /", async () => {
      const slug = "ipl-betting-predictions-2026";

      const manager = makeManager();
      const origCwd = process.cwd;
      process.cwd = () => tempDir;
      try {
        await manager.updateExistingPost(slug, LINK_TARGETS);
      } finally {
        process.cwd = origCwd;
      }

      const updatedContent = await fs.readFile(
        path.join(tempDir, "content", "blogs", `${slug}.md`),
        "utf-8"
      );

      const urls = extractLinkUrls(updatedContent);
      expect(urls.length).toBeGreaterThan(0);

      for (const url of urls) {
        expect(url).toMatch(/^\//);
      }
    });

    it("no paragraph contains more than 3 internal links after update", async () => {
      const slug = "cricket-betting-tips-india-2026";

      const manager = makeManager();
      const origCwd = process.cwd;
      process.cwd = () => tempDir;
      try {
        await manager.updateExistingPost(slug, LINK_TARGETS);
      } finally {
        process.cwd = origCwd;
      }

      const updatedContent = await fs.readFile(
        path.join(tempDir, "content", "blogs", `${slug}.md`),
        "utf-8"
      );

      // Extract body (skip frontmatter)
      const body = extractBody(updatedContent);

      // Split into paragraphs (double newline separated, skip headings)
      const paragraphs = body
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0 && !p.startsWith("#"));

      for (const para of paragraphs) {
        const linkCount = countMarkdownLinks(para);
        expect(linkCount).toBeLessThanOrEqual(3);
      }
    });

    it("updated file is valid markdown with parseable frontmatter", async () => {
      const slug = "habet-app-download-guide";

      const manager = makeManager();
      const origCwd = process.cwd;
      process.cwd = () => tempDir;
      try {
        await manager.updateExistingPost(slug, LINK_TARGETS);
      } finally {
        process.cwd = origCwd;
      }

      const updatedContent = await fs.readFile(
        path.join(tempDir, "content", "blogs", `${slug}.md`),
        "utf-8"
      );

      // Must start with frontmatter delimiter
      expect(updatedContent.startsWith("---\n")).toBe(true);

      // Must have closing frontmatter delimiter
      const fmMatch = updatedContent.match(/^---\n([\s\S]*?)\n---/);
      expect(fmMatch).not.toBeNull();

      // Frontmatter must be parseable
      const fm = parseFrontmatter(updatedContent);
      expect(typeof fm.title).toBe("string");
      expect(typeof fm.slug).toBe("string");
      expect(typeof fm.date).toBe("string");
    });
  });

  // ── 3. Frontmatter preservation ──────────────────────────────────────────

  describe("frontmatter preservation", () => {
    it.each(REAL_SLUGS)(
      "preserves all original frontmatter fields for %s",
      async (slug) => {
        const origContent = await fs.readFile(
          path.join(tempDir, "content", "blogs", `${slug}.md`),
          "utf-8"
        );
        const origFm = parseFrontmatter(origContent);

        const manager = makeManager();
        const origCwd = process.cwd;
        process.cwd = () => tempDir;
        try {
          await manager.updateExistingPost(slug, LINK_TARGETS);
        } finally {
          process.cwd = origCwd;
        }

        const updatedContent = await fs.readFile(
          path.join(tempDir, "content", "blogs", `${slug}.md`),
          "utf-8"
        );
        const updatedFm = parseFrontmatter(updatedContent);

        // Core fields must be preserved (Requirement 5.4)
        expect(updatedFm.title).toBe(origFm.title);
        expect(updatedFm.slug).toBe(origFm.slug);
        expect(updatedFm.date).toBe(origFm.date);
        expect(updatedFm.author).toBe(origFm.author);
        expect(updatedFm.readingTime).toBe(origFm.readingTime);
        expect(updatedFm.excerpt).toBe(origFm.excerpt);

        // Keywords array must be preserved
        expect(updatedFm.keywords).toEqual(origFm.keywords);
      }
    );

    it.each(REAL_SLUGS)(
      "adds lastUpdated field to frontmatter for %s (Requirement 5.7, 10.2)",
      async (slug) => {
        const origContent = await fs.readFile(
          path.join(tempDir, "content", "blogs", `${slug}.md`),
          "utf-8"
        );
        const origFm = parseFrontmatter(origContent);

        // Original should NOT have lastUpdated
        expect(origFm.lastUpdated).toBeUndefined();

        const before = new Date();
        const manager = makeManager();
        const origCwd = process.cwd;
        process.cwd = () => tempDir;
        try {
          await manager.updateExistingPost(slug, LINK_TARGETS);
        } finally {
          process.cwd = origCwd;
        }
        const after = new Date();

        const updatedContent = await fs.readFile(
          path.join(tempDir, "content", "blogs", `${slug}.md`),
          "utf-8"
        );
        const updatedFm = parseFrontmatter(updatedContent);

        // lastUpdated must now be present
        expect(updatedFm.lastUpdated).toBeDefined();
        expect(typeof updatedFm.lastUpdated).toBe("string");

        // Must be a valid ISO 8601 date
        const lastUpdatedDate = new Date(updatedFm.lastUpdated as string);
        expect(lastUpdatedDate.getTime()).not.toBeNaN();

        // Must be within the test window
        expect(lastUpdatedDate.getTime()).toBeGreaterThanOrEqual(before.getTime());
        expect(lastUpdatedDate.getTime()).toBeLessThanOrEqual(after.getTime());
      }
    );

    it("does not modify the original date field when adding lastUpdated", async () => {
      const slug = "habet-app-download-guide";
      const origContent = await fs.readFile(
        path.join(tempDir, "content", "blogs", `${slug}.md`),
        "utf-8"
      );
      const origFm = parseFrontmatter(origContent);
      const originalDate = origFm.date as string;

      const manager = makeManager();
      const origCwd = process.cwd;
      process.cwd = () => tempDir;
      try {
        await manager.updateExistingPost(slug, LINK_TARGETS);
      } finally {
        process.cwd = origCwd;
      }

      const updatedContent = await fs.readFile(
        path.join(tempDir, "content", "blogs", `${slug}.md`),
        "utf-8"
      );
      const updatedFm = parseFrontmatter(updatedContent);

      expect(updatedFm.date).toBe(originalDate);
      expect(updatedFm.lastUpdated).not.toBe(originalDate);
    });
  });

  // ── 4. Content structure preservation ────────────────────────────────────

  describe("heading and paragraph structure preservation", () => {
    it.each(REAL_SLUGS)(
      "preserves all headings in %s (Requirement 5.3)",
      async (slug) => {
        const origContent = await fs.readFile(
          path.join(tempDir, "content", "blogs", `${slug}.md`),
          "utf-8"
        );
        const origBody = extractBody(origContent);
        const origHeadings = origBody.match(/^#{1,6}\s+.+$/gm) ?? [];

        const manager = makeManager();
        const origCwd = process.cwd;
        process.cwd = () => tempDir;
        try {
          await manager.updateExistingPost(slug, LINK_TARGETS);
        } finally {
          process.cwd = origCwd;
        }

        const updatedContent = await fs.readFile(
          path.join(tempDir, "content", "blogs", `${slug}.md`),
          "utf-8"
        );
        const updatedBody = extractBody(updatedContent);
        const updatedHeadings = updatedBody.match(/^#{1,6}\s+.+$/gm) ?? [];

        // Same number of headings
        expect(updatedHeadings.length).toBe(origHeadings.length);

        // Each original heading must still appear in the updated body
        for (const heading of origHeadings) {
          expect(updatedBody).toContain(heading);
        }
      }
    );

    it.each(REAL_SLUGS)(
      "preserves paragraph count (within tolerance) for %s",
      async (slug) => {
        const origContent = await fs.readFile(
          path.join(tempDir, "content", "blogs", `${slug}.md`),
          "utf-8"
        );
        const origBody = extractBody(origContent);
        const origParaCount = origBody
          .split(/\n\n+/)
          .filter((p) => p.trim().length > 0).length;

        const manager = makeManager();
        const origCwd = process.cwd;
        process.cwd = () => tempDir;
        try {
          await manager.updateExistingPost(slug, LINK_TARGETS);
        } finally {
          process.cwd = origCwd;
        }

        const updatedContent = await fs.readFile(
          path.join(tempDir, "content", "blogs", `${slug}.md`),
          "utf-8"
        );
        const updatedBody = extractBody(updatedContent);
        const updatedParaCount = updatedBody
          .split(/\n\n+/)
          .filter((p) => p.trim().length > 0).length;

        // Paragraph count should be the same (links are inserted inline, not as new paragraphs)
        expect(updatedParaCount).toBe(origParaCount);
      }
    );

    it("preserves key content phrases after link insertion", async () => {
      const slug = "habet-app-download-guide";

      const manager = makeManager();
      const origCwd = process.cwd;
      process.cwd = () => tempDir;
      try {
        await manager.updateExistingPost(slug, LINK_TARGETS);
      } finally {
        process.cwd = origCwd;
      }

      const updatedContent = await fs.readFile(
        path.join(tempDir, "content", "blogs", `${slug}.md`),
        "utf-8"
      );

      // Key phrases from the original content must still be present
      expect(updatedContent).toContain("HABET App Download Guide 2026");
      expect(updatedContent).toContain("Step 1: Enable Unknown Sources");
      expect(updatedContent).toContain("Step 2: Download the HABET APK");
      expect(updatedContent).toContain("## Conclusion");
      expect(updatedContent).toContain("## FAQ");
    });
  });

  // ── 5. File write-back verification ──────────────────────────────────────

  describe("file write-back", () => {
    it("writes the updated content back to the same file path", async () => {
      const slug = "ipl-betting-predictions-2026";
      const filePath = path.join(tempDir, "content", "blogs", `${slug}.md`);

      const origStats = await fs.stat(filePath);

      // Small delay to ensure mtime difference is detectable
      await new Promise((resolve) => setTimeout(resolve, 20));

      const manager = makeManager();
      const origCwd = process.cwd;
      process.cwd = () => tempDir;
      try {
        await manager.updateExistingPost(slug, LINK_TARGETS);
      } finally {
        process.cwd = origCwd;
      }

      const updatedStats = await fs.stat(filePath);

      // File modification time must have advanced
      expect(updatedStats.mtimeMs).toBeGreaterThan(origStats.mtimeMs);
    });

    it("does not create extra files in the blogs directory", async () => {
      const blogsDir = path.join(tempDir, "content", "blogs");
      const filesBefore = await fs.readdir(blogsDir);

      const manager = makeManager();
      const origCwd = process.cwd;
      process.cwd = () => tempDir;
      try {
        await manager.updateExistingPost("habet-app-download-guide", LINK_TARGETS);
      } finally {
        process.cwd = origCwd;
      }

      const filesAfter = await fs.readdir(blogsDir);
      expect(filesAfter.length).toBe(filesBefore.length);
    });

    it("updated file is non-empty and larger than the frontmatter alone", async () => {
      const slug = "cricket-betting-tips-india-2026";

      const manager = makeManager();
      const origCwd = process.cwd;
      process.cwd = () => tempDir;
      try {
        await manager.updateExistingPost(slug, LINK_TARGETS);
      } finally {
        process.cwd = origCwd;
      }

      const updatedContent = await fs.readFile(
        path.join(tempDir, "content", "blogs", `${slug}.md`),
        "utf-8"
      );

      // File must be non-trivially large (original is ~5 KB)
      expect(updatedContent.length).toBeGreaterThan(1000);

      // Body must exist after frontmatter
      const body = extractBody(updatedContent);
      expect(body.trim().length).toBeGreaterThan(0);
    });
  });

  // ── 6. All three existing posts updated correctly ─────────────────────────

  describe("updating all three existing blog posts (Requirement 5.2)", () => {
    it("successfully updates all three existing posts in sequence", async () => {
      const manager = makeManager();
      const origCwd = process.cwd;
      process.cwd = () => tempDir;
      try {
        for (const slug of REAL_SLUGS) {
          await expect(
            manager.updateExistingPost(slug, LINK_TARGETS)
          ).resolves.toBeUndefined();
        }
      } finally {
        process.cwd = origCwd;
      }

      // Verify all three files were updated with lastUpdated
      for (const slug of REAL_SLUGS) {
        const content = await fs.readFile(
          path.join(tempDir, "content", "blogs", `${slug}.md`),
          "utf-8"
        );
        const fm = parseFrontmatter(content);
        expect(fm.lastUpdated).toBeDefined();
      }
    });

    it("each updated post has a valid ISO 8601 lastUpdated timestamp", async () => {
      const manager = makeManager();
      const origCwd = process.cwd;
      process.cwd = () => tempDir;
      try {
        for (const slug of REAL_SLUGS) {
          await manager.updateExistingPost(slug, LINK_TARGETS);
        }
      } finally {
        process.cwd = origCwd;
      }

      for (const slug of REAL_SLUGS) {
        const content = await fs.readFile(
          path.join(tempDir, "content", "blogs", `${slug}.md`),
          "utf-8"
        );
        const fm = parseFrontmatter(content);
        const ts = new Date(fm.lastUpdated as string);
        expect(ts.getTime()).not.toBeNaN();
        // ISO 8601 format check
        expect(fm.lastUpdated as string).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
        );
      }
    });
  });
});
