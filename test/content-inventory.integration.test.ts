/**
 * Integration tests for ContentInventoryTracker
 *
 * Tests the full content inventory workflow including:
 * - Inventory file creation and updates on disk
 * - JSON serialization/deserialization (write then read back)
 * - Summary report generation with real post data
 * - Keyword mapping export
 * - Keyword conflict detection
 *
 * Uses a temp directory to avoid polluting content/inventory.json.
 *
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { ContentInventoryTracker } from "../lib/content-inventory";
import type { ContentInventoryEntry, ContentInventoryDatabase } from "../lib/types/seo-blog";

// ── Helpers ────────────────────────────────────────────────────────────────

/** Creates a minimal valid ContentInventoryEntry for testing. */
function makeEntry(overrides: Partial<ContentInventoryEntry> & { slug: string; primaryKeyword: string }): ContentInventoryEntry {
  return {
    id: `id-${overrides.slug}`,
    title: `Title for ${overrides.slug}`,
    secondaryKeywords: [],
    wordCount: 2500,
    internalLinkCount: 20,
    createdAt: new Date().toISOString(),
    schemaType: "Article",
    ...overrides,
  };
}

/** Reads and parses the inventory JSON file directly from disk. */
async function readInventoryFile(filePath: string): Promise<ContentInventoryDatabase> {
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as ContentInventoryDatabase;
}

// ── Test Suite ─────────────────────────────────────────────────────────────

describe("ContentInventoryTracker – integration", () => {
  let tempDir: string;
  let inventoryPath: string;
  let tracker: ContentInventoryTracker;

  beforeEach(async () => {
    // Create an isolated temp directory for each test
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "content-inventory-test-"));
    inventoryPath = path.join(tempDir, "inventory.json");
    tracker = new ContentInventoryTracker(inventoryPath);
  });

  afterEach(async () => {
    // Clean up temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  // ── 1. Inventory file creation ───────────────────────────────────────────

  describe("inventory file creation", () => {
    it("creates the inventory JSON file on first logPost call", async () => {
      // File should not exist yet
      await expect(fs.access(inventoryPath)).rejects.toThrow();

      await tracker.logPost(makeEntry({ slug: "first-post", primaryKeyword: "first keyword" }));

      // File should now exist
      await expect(fs.access(inventoryPath)).resolves.toBeUndefined();
    });

    it("creates parent directories if they do not exist", async () => {
      const nestedPath = path.join(tempDir, "nested", "deep", "inventory.json");
      const nestedTracker = new ContentInventoryTracker(nestedPath);

      await nestedTracker.logPost(makeEntry({ slug: "nested-post", primaryKeyword: "nested keyword" }));

      await expect(fs.access(nestedPath)).resolves.toBeUndefined();
    });

    it("writes valid JSON to the inventory file", async () => {
      await tracker.logPost(makeEntry({ slug: "json-test", primaryKeyword: "json keyword" }));

      const db = await readInventoryFile(inventoryPath);
      expect(db).toBeDefined();
      expect(Array.isArray(db.posts)).toBe(true);
      expect(typeof db.keywordMap).toBe("object");
      expect(typeof db.metadata).toBe("object");
    });

    it("initialises metadata with version 1.0.0 and correct totalPosts", async () => {
      await tracker.logPost(makeEntry({ slug: "meta-test", primaryKeyword: "meta keyword" }));

      const db = await readInventoryFile(inventoryPath);
      expect(db.metadata.version).toBe("1.0.0");
      expect(db.metadata.totalPosts).toBe(1);
      expect(typeof db.metadata.lastGenerated).toBe("string");
      expect(new Date(db.metadata.lastGenerated).getTime()).not.toBeNaN();
    });
  });

  // ── 2. JSON serialization / deserialization ──────────────────────────────

  describe("JSON serialization and deserialization", () => {
    it("round-trips a single post: write then read back", async () => {
      const entry = makeEntry({
        slug: "round-trip-post",
        primaryKeyword: "round trip keyword",
        title: "How to Round Trip: A Complete Guide",
        secondaryKeywords: ["secondary-a", "secondary-b"],
        wordCount: 3000,
        internalLinkCount: 22,
        schemaType: "Article", // will be overridden to HowTo by assignSchemaType
      });

      await tracker.logPost(entry);

      // Read directly from disk (bypasses in-memory cache)
      const db = await readInventoryFile(inventoryPath);
      const saved = db.posts[0];

      expect(saved.slug).toBe(entry.slug);
      expect(saved.title).toBe(entry.title);
      expect(saved.primaryKeyword).toBe(entry.primaryKeyword);
      expect(saved.secondaryKeywords).toEqual(entry.secondaryKeywords);
      expect(saved.wordCount).toBe(entry.wordCount);
      expect(saved.internalLinkCount).toBe(entry.internalLinkCount);
      expect(saved.schemaType).toBe("HowTo"); // assigned by assignSchemaType based on title
      expect(saved.createdAt).toBe(entry.createdAt);
    });

    it("round-trips multiple posts preserving all fields", async () => {
      const entries = [
        makeEntry({ slug: "post-alpha", primaryKeyword: "alpha keyword", wordCount: 2600, internalLinkCount: 21 }),
        makeEntry({ slug: "post-beta", primaryKeyword: "beta keyword", wordCount: 3200, internalLinkCount: 23 }),
        makeEntry({ slug: "post-gamma", primaryKeyword: "gamma keyword", wordCount: 3800, internalLinkCount: 25 }),
      ];

      for (const e of entries) {
        await tracker.logPost(e);
      }

      const db = await readInventoryFile(inventoryPath);
      expect(db.posts).toHaveLength(3);

      for (const entry of entries) {
        const saved = db.posts.find(p => p.slug === entry.slug);
        expect(saved).toBeDefined();
        expect(saved!.primaryKeyword).toBe(entry.primaryKeyword);
        expect(saved!.wordCount).toBe(entry.wordCount);
        expect(saved!.internalLinkCount).toBe(entry.internalLinkCount);
      }
    });

    it("persists keyword map correctly in JSON", async () => {
      await tracker.logPost(makeEntry({ slug: "kw-post-1", primaryKeyword: "keyword one" }));
      await tracker.logPost(makeEntry({ slug: "kw-post-2", primaryKeyword: "keyword two" }));

      const db = await readInventoryFile(inventoryPath);
      expect(db.keywordMap["keyword one"]).toBe("kw-post-1");
      expect(db.keywordMap["keyword two"]).toBe("kw-post-2");
    });

    it("a fresh tracker instance reads persisted data from disk", async () => {
      // Write with first tracker instance
      await tracker.logPost(makeEntry({ slug: "persist-post", primaryKeyword: "persist keyword", wordCount: 2750 }));

      // Create a brand-new tracker pointing to the same file
      const freshTracker = new ContentInventoryTracker(inventoryPath);
      const summary = await freshTracker.generateSummary();

      expect(summary.totalPosts).toBe(1);
      expect(summary.totalWordCount).toBe(2750);
    });

    it("updatePost persists changes to disk", async () => {
      await tracker.logPost(makeEntry({ slug: "update-persist", primaryKeyword: "update keyword", wordCount: 2500 }));

      await tracker.updatePost("update-persist", { wordCount: 3500 });

      // Read directly from disk
      const db = await readInventoryFile(inventoryPath);
      const saved = db.posts.find(p => p.slug === "update-persist");
      expect(saved!.wordCount).toBe(3500);
      expect(saved!.lastUpdated).toBeDefined();
      expect(new Date(saved!.lastUpdated!).getTime()).not.toBeNaN();
    });
  });

  // ── 3. logPost workflow ──────────────────────────────────────────────────

  describe("logPost workflow", () => {
    it("logs a post and increments totalPosts in metadata", async () => {
      await tracker.logPost(makeEntry({ slug: "log-1", primaryKeyword: "log kw 1" }));
      await tracker.logPost(makeEntry({ slug: "log-2", primaryKeyword: "log kw 2" }));

      const db = await readInventoryFile(inventoryPath);
      expect(db.metadata.totalPosts).toBe(2);
    });

    it("assigns schemaType HowTo for guide/how-to titles", async () => {
      await tracker.logPost(makeEntry({
        slug: "how-to-guide",
        primaryKeyword: "how to download habet",
        title: "How to Download HABET App Guide",
        schemaType: "Article", // will be overridden
      }));

      const db = await readInventoryFile(inventoryPath);
      expect(db.posts[0].schemaType).toBe("HowTo");
    });

    it("assigns schemaType FAQPage for FAQ titles", async () => {
      await tracker.logPost(makeEntry({
        slug: "faq-post",
        primaryKeyword: "habet faq",
        title: "HABET FAQ: Common Questions Answered",
        schemaType: "Article", // will be overridden
      }));

      const db = await readInventoryFile(inventoryPath);
      expect(db.posts[0].schemaType).toBe("FAQPage");
    });

    it("assigns schemaType Article for generic titles", async () => {
      await tracker.logPost(makeEntry({
        slug: "generic-post",
        primaryKeyword: "habet review",
        title: "HABET App Review 2026",
        schemaType: "HowTo", // will be overridden
      }));

      const db = await readInventoryFile(inventoryPath);
      expect(db.posts[0].schemaType).toBe("Article");
    });

    it("rejects duplicate slugs", async () => {
      await tracker.logPost(makeEntry({ slug: "dup-slug", primaryKeyword: "dup kw 1" }));
      await expect(
        tracker.logPost(makeEntry({ slug: "dup-slug", primaryKeyword: "dup kw 2" }))
      ).rejects.toThrow('Post with slug "dup-slug" already exists');
    });

    it("rejects duplicate primary keywords (Req 9.6 – no keyword cannibalization)", async () => {
      await tracker.logPost(makeEntry({ slug: "cannibal-1", primaryKeyword: "shared keyword" }));
      await expect(
        tracker.logPost(makeEntry({ slug: "cannibal-2", primaryKeyword: "shared keyword" }))
      ).rejects.toThrow('Primary keyword "shared keyword" already assigned');
    });

    it("stores GSC metrics fields when provided (Req 9.5)", async () => {
      const entry = makeEntry({ slug: "gsc-post", primaryKeyword: "gsc keyword" });
      entry.gscMetrics = { clicks: 42, impressions: 1000, ctr: 0.042, position: 5.3 };

      await tracker.logPost(entry);

      const db = await readInventoryFile(inventoryPath);
      expect(db.posts[0].gscMetrics).toEqual({ clicks: 42, impressions: 1000, ctr: 0.042, position: 5.3 });
    });
  });

  // ── 4. updatePost workflow ───────────────────────────────────────────────

  describe("updatePost workflow", () => {
    it("updates word count and internal link count", async () => {
      await tracker.logPost(makeEntry({ slug: "upd-post", primaryKeyword: "upd keyword", wordCount: 2500, internalLinkCount: 20 }));
      await tracker.updatePost("upd-post", { wordCount: 3200, internalLinkCount: 24 });

      const summary = await tracker.generateSummary();
      expect(summary.totalWordCount).toBe(3200);
      expect(summary.totalInternalLinks).toBe(24);
    });

    it("sets lastUpdated timestamp on update", async () => {
      const before = Date.now();
      await tracker.logPost(makeEntry({ slug: "ts-post", primaryKeyword: "ts keyword" }));
      await tracker.updatePost("ts-post", { wordCount: 3000 });
      const after = Date.now();

      const db = await readInventoryFile(inventoryPath);
      const saved = db.posts[0];
      expect(saved.lastUpdated).toBeDefined();
      const updatedAt = new Date(saved.lastUpdated!).getTime();
      expect(updatedAt).toBeGreaterThanOrEqual(before);
      expect(updatedAt).toBeLessThanOrEqual(after);
    });

    it("updates keyword map when primary keyword changes", async () => {
      await tracker.logPost(makeEntry({ slug: "kw-change", primaryKeyword: "old keyword" }));
      await tracker.updatePost("kw-change", { primaryKeyword: "new keyword" });

      const mapping = await tracker.exportKeywordMapping();
      expect(mapping.has("old keyword")).toBe(false);
      expect(mapping.get("new keyword")).toBe("kw-change");
    });

    it("rejects keyword update that conflicts with another post", async () => {
      await tracker.logPost(makeEntry({ slug: "post-x", primaryKeyword: "keyword x" }));
      await tracker.logPost(makeEntry({ slug: "post-y", primaryKeyword: "keyword y" }));

      await expect(
        tracker.updatePost("post-y", { primaryKeyword: "keyword x" })
      ).rejects.toThrow('Primary keyword "keyword x" already assigned');
    });

    it("throws when updating a non-existent post", async () => {
      await expect(
        tracker.updatePost("ghost-post", { wordCount: 3000 })
      ).rejects.toThrow('Post with slug "ghost-post" not found');
    });
  });

  // ── 5. generateSummary with real post data ───────────────────────────────

  describe("generateSummary with real post data", () => {
    it("returns zero stats for an empty inventory", async () => {
      const summary = await tracker.generateSummary();
      expect(summary.totalPosts).toBe(0);
      expect(summary.totalWordCount).toBe(0);
      expect(summary.totalInternalLinks).toBe(0);
      expect(summary.averageWordCount).toBe(0);
      expect(summary.averageLinksPerPost).toBe(0);
      expect(summary.keywordCoverage.size).toBe(0);
    });

    it("calculates correct totals and averages for multiple posts (Req 9.3)", async () => {
      const posts = [
        makeEntry({ slug: "s1", primaryKeyword: "kw1", wordCount: 2500, internalLinkCount: 20 }),
        makeEntry({ slug: "s2", primaryKeyword: "kw2", wordCount: 3000, internalLinkCount: 22 }),
        makeEntry({ slug: "s3", primaryKeyword: "kw3", wordCount: 3500, internalLinkCount: 25 }),
        makeEntry({ slug: "s4", primaryKeyword: "kw4", wordCount: 4000, internalLinkCount: 24 }),
      ];

      for (const p of posts) await tracker.logPost(p);

      const summary = await tracker.generateSummary();

      expect(summary.totalPosts).toBe(4);
      expect(summary.totalWordCount).toBe(13000);
      expect(summary.totalInternalLinks).toBe(91);
      expect(summary.averageWordCount).toBe(3250);
      expect(summary.averageLinksPerPost).toBe(22.75);
    });

    it("includes all keywords in keywordCoverage map (Req 9.4)", async () => {
      await tracker.logPost(makeEntry({ slug: "cov-1", primaryKeyword: "coverage kw 1" }));
      await tracker.logPost(makeEntry({ slug: "cov-2", primaryKeyword: "coverage kw 2" }));
      await tracker.logPost(makeEntry({ slug: "cov-3", primaryKeyword: "coverage kw 3" }));

      const summary = await tracker.generateSummary();

      expect(summary.keywordCoverage.size).toBe(3);
      expect(summary.keywordCoverage.get("coverage kw 1")).toBe("cov-1");
      expect(summary.keywordCoverage.get("coverage kw 2")).toBe("cov-2");
      expect(summary.keywordCoverage.get("coverage kw 3")).toBe("cov-3");
    });

    it("reflects updates in subsequent summary calls", async () => {
      await tracker.logPost(makeEntry({ slug: "live-update", primaryKeyword: "live kw", wordCount: 2500 }));

      const before = await tracker.generateSummary();
      expect(before.totalWordCount).toBe(2500);

      await tracker.updatePost("live-update", { wordCount: 3800 });

      const after = await tracker.generateSummary();
      expect(after.totalWordCount).toBe(3800);
      expect(after.averageWordCount).toBe(3800);
    });

    it("summary matches data from a fresh tracker reading the same file", async () => {
      const posts = [
        makeEntry({ slug: "fresh-1", primaryKeyword: "fresh kw 1", wordCount: 2700, internalLinkCount: 21 }),
        makeEntry({ slug: "fresh-2", primaryKeyword: "fresh kw 2", wordCount: 3100, internalLinkCount: 23 }),
      ];
      for (const p of posts) await tracker.logPost(p);

      const freshTracker = new ContentInventoryTracker(inventoryPath);
      const summary = await freshTracker.generateSummary();

      expect(summary.totalPosts).toBe(2);
      expect(summary.totalWordCount).toBe(5800);
      expect(summary.totalInternalLinks).toBe(44);
      expect(summary.averageWordCount).toBe(2900);
      expect(summary.averageLinksPerPost).toBe(22);
    });
  });

  // ── 6. exportKeywordMapping ──────────────────────────────────────────────

  describe("exportKeywordMapping (Req 9.4)", () => {
    it("returns an empty Map for an empty inventory", async () => {
      const mapping = await tracker.exportKeywordMapping();
      expect(mapping).toBeInstanceOf(Map);
      expect(mapping.size).toBe(0);
    });

    it("returns all keyword-to-slug mappings", async () => {
      await tracker.logPost(makeEntry({ slug: "map-a", primaryKeyword: "map keyword a" }));
      await tracker.logPost(makeEntry({ slug: "map-b", primaryKeyword: "map keyword b" }));

      const mapping = await tracker.exportKeywordMapping();
      expect(mapping.size).toBe(2);
      expect(mapping.get("map keyword a")).toBe("map-a");
      expect(mapping.get("map keyword b")).toBe("map-b");
    });

    it("reflects keyword changes after updatePost", async () => {
      await tracker.logPost(makeEntry({ slug: "remap-post", primaryKeyword: "old kw" }));
      await tracker.updatePost("remap-post", { primaryKeyword: "new kw" });

      const mapping = await tracker.exportKeywordMapping();
      expect(mapping.has("old kw")).toBe(false);
      expect(mapping.get("new kw")).toBe("remap-post");
    });
  });

  // ── 7. checkKeywordConflict ──────────────────────────────────────────────

  describe("checkKeywordConflict (Req 9.6)", () => {
    it("returns null when no conflict exists", async () => {
      const result = await tracker.checkKeywordConflict("brand new keyword");
      expect(result).toBeNull();
    });

    it("returns the conflicting slug when keyword is already assigned", async () => {
      await tracker.logPost(makeEntry({ slug: "conflict-owner", primaryKeyword: "taken keyword" }));

      const result = await tracker.checkKeywordConflict("taken keyword");
      expect(result).toBe("conflict-owner");
    });

    it("returns null after the owning post's keyword is changed", async () => {
      await tracker.logPost(makeEntry({ slug: "kw-owner", primaryKeyword: "reassigned kw" }));
      await tracker.updatePost("kw-owner", { primaryKeyword: "different kw" });

      const result = await tracker.checkKeywordConflict("reassigned kw");
      expect(result).toBeNull();
    });
  });

  // ── 8. Schema type assignment (Req 9.7) ──────────────────────────────────

  describe("schema type assignment (Req 9.7)", () => {
    const cases: Array<{ title: string; expected: "HowTo" | "FAQPage" | "Article" }> = [
      { title: "How to Bet on Cricket with HABET", expected: "HowTo" },
      { title: "HABET App Download Step-by-Step Guide", expected: "HowTo" },
      { title: "HABET FAQ: Everything You Need to Know", expected: "FAQPage" },
      { title: "Common Questions About HABET Betting", expected: "FAQPage" },
      { title: "HABET App Review 2026", expected: "Article" },
      { title: "HABET vs Competitors: A Comparison", expected: "Article" },
    ];

    for (const { title, expected } of cases) {
      it(`assigns ${expected} for title: "${title}"`, async () => {
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        await tracker.logPost(makeEntry({ slug, primaryKeyword: `kw-${slug}`, title }));

        const db = await readInventoryFile(inventoryPath);
        expect(db.posts[0].schemaType).toBe(expected);

        // Reset tracker for next iteration
        tracker = new ContentInventoryTracker(path.join(tempDir, `inv-${slug}.json`));
      });
    }
  });

  // ── 9. Full workflow: create → update → summarise ────────────────────────

  describe("full content inventory workflow", () => {
    it("complete workflow: log posts, update one, verify summary and keyword map", async () => {
      // Step 1: Log 3 posts (simulating blog generation)
      const post1 = makeEntry({ slug: "workflow-post-1", primaryKeyword: "workflow kw 1", wordCount: 2600, internalLinkCount: 20 });
      const post2 = makeEntry({ slug: "workflow-post-2", primaryKeyword: "workflow kw 2", wordCount: 3000, internalLinkCount: 22 });
      const post3 = makeEntry({ slug: "workflow-post-3", primaryKeyword: "workflow kw 3", wordCount: 3400, internalLinkCount: 24 });

      await tracker.logPost(post1);
      await tracker.logPost(post2);
      await tracker.logPost(post3);

      // Step 2: Verify file was created with correct structure
      const dbAfterLog = await readInventoryFile(inventoryPath);
      expect(dbAfterLog.posts).toHaveLength(3);
      expect(dbAfterLog.metadata.totalPosts).toBe(3);

      // Step 3: Update one post (simulating a content refresh)
      await tracker.updatePost("workflow-post-2", { wordCount: 3500, internalLinkCount: 25 });

      // Step 4: Generate summary report
      const summary = await tracker.generateSummary();
      expect(summary.totalPosts).toBe(3);
      expect(summary.totalWordCount).toBe(2600 + 3500 + 3400); // 9500
      expect(summary.totalInternalLinks).toBe(20 + 25 + 24); // 69
      expect(summary.averageWordCount).toBeCloseTo(9500 / 3, 5);
      expect(summary.averageLinksPerPost).toBeCloseTo(69 / 3, 5);

      // Step 5: Verify keyword coverage
      expect(summary.keywordCoverage.size).toBe(3);
      expect(summary.keywordCoverage.get("workflow kw 1")).toBe("workflow-post-1");
      expect(summary.keywordCoverage.get("workflow kw 2")).toBe("workflow-post-2");
      expect(summary.keywordCoverage.get("workflow kw 3")).toBe("workflow-post-3");

      // Step 6: Verify keyword conflict detection
      expect(await tracker.checkKeywordConflict("workflow kw 1")).toBe("workflow-post-1");
      expect(await tracker.checkKeywordConflict("brand new keyword")).toBeNull();

      // Step 7: Verify export keyword mapping
      const mapping = await tracker.exportKeywordMapping();
      expect(mapping.size).toBe(3);

      // Step 8: Verify persisted state with a fresh tracker
      const freshTracker = new ContentInventoryTracker(inventoryPath);
      const freshSummary = await freshTracker.generateSummary();
      expect(freshSummary.totalPosts).toBe(3);
      expect(freshSummary.totalWordCount).toBe(9500);
    });
  });
});
