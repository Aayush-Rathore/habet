/**
 * Unit tests for ContentInventoryTracker
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import { ContentInventoryTracker } from "./content-inventory";
import type { ContentInventoryEntry } from "./types/seo-blog";

describe("ContentInventoryTracker", () => {
  const testInventoryPath = "test-inventory.json";
  let tracker: ContentInventoryTracker;

  beforeEach(() => {
    tracker = new ContentInventoryTracker(testInventoryPath);
  });

  afterEach(async () => {
    // Clean up test file
    try {
      await fs.unlink(testInventoryPath);
    } catch {
      // Ignore if file doesn't exist
    }
  });

  describe("logPost", () => {
    it("should log a new post to the inventory", async () => {
      const entry: ContentInventoryEntry = {
        id: "test-id-1",
        slug: "test-post",
        title: "Test Post",
        primaryKeyword: "test keyword",
        secondaryKeywords: ["keyword1", "keyword2"],
        wordCount: 2500,
        internalLinkCount: 20,
        createdAt: new Date().toISOString(),
        schemaType: "Article",
      };

      await tracker.logPost(entry);

      const summary = await tracker.generateSummary();
      expect(summary.totalPosts).toBe(1);
      expect(summary.totalWordCount).toBe(2500);
      expect(summary.totalInternalLinks).toBe(20);
    });

    it("should assign schema type based on title", async () => {
      const entry: ContentInventoryEntry = {
        id: "test-id-2",
        slug: "how-to-guide",
        title: "How to Download HABET App",
        primaryKeyword: "habet download",
        secondaryKeywords: ["guide", "tutorial"],
        wordCount: 3000,
        internalLinkCount: 22,
        createdAt: new Date().toISOString(),
        schemaType: "Article", // Will be overridden
      };

      await tracker.logPost(entry);

      const mapping = await tracker.exportKeywordMapping();
      expect(mapping.get("habet download")).toBe("how-to-guide");
    });

    it("should reject duplicate slugs", async () => {
      const entry1: ContentInventoryEntry = {
        id: "test-id-3",
        slug: "duplicate-slug",
        title: "First Post",
        primaryKeyword: "keyword1",
        secondaryKeywords: [],
        wordCount: 2500,
        internalLinkCount: 20,
        createdAt: new Date().toISOString(),
        schemaType: "Article",
      };

      const entry2: ContentInventoryEntry = {
        id: "test-id-4",
        slug: "duplicate-slug",
        title: "Second Post",
        primaryKeyword: "keyword2",
        secondaryKeywords: [],
        wordCount: 2500,
        internalLinkCount: 20,
        createdAt: new Date().toISOString(),
        schemaType: "Article",
      };

      await tracker.logPost(entry1);
      await expect(tracker.logPost(entry2)).rejects.toThrow(
        'Post with slug "duplicate-slug" already exists'
      );
    });

    it("should reject duplicate primary keywords", async () => {
      const entry1: ContentInventoryEntry = {
        id: "test-id-5",
        slug: "post-1",
        title: "First Post",
        primaryKeyword: "duplicate keyword",
        secondaryKeywords: [],
        wordCount: 2500,
        internalLinkCount: 20,
        createdAt: new Date().toISOString(),
        schemaType: "Article",
      };

      const entry2: ContentInventoryEntry = {
        id: "test-id-6",
        slug: "post-2",
        title: "Second Post",
        primaryKeyword: "duplicate keyword",
        secondaryKeywords: [],
        wordCount: 2500,
        internalLinkCount: 20,
        createdAt: new Date().toISOString(),
        schemaType: "Article",
      };

      await tracker.logPost(entry1);
      await expect(tracker.logPost(entry2)).rejects.toThrow(
        'Primary keyword "duplicate keyword" already assigned'
      );
    });
  });

  describe("updatePost", () => {
    it("should update an existing post", async () => {
      const entry: ContentInventoryEntry = {
        id: "test-id-7",
        slug: "update-test",
        title: "Original Title",
        primaryKeyword: "original keyword",
        secondaryKeywords: [],
        wordCount: 2500,
        internalLinkCount: 20,
        createdAt: new Date().toISOString(),
        schemaType: "Article",
      };

      await tracker.logPost(entry);
      await tracker.updatePost("update-test", {
        wordCount: 3000,
        internalLinkCount: 25,
      });

      const summary = await tracker.generateSummary();
      expect(summary.totalWordCount).toBe(3000);
      expect(summary.totalInternalLinks).toBe(25);
    });

    it("should reject updates to non-existent posts", async () => {
      await expect(
        tracker.updatePost("non-existent", { wordCount: 3000 })
      ).rejects.toThrow('Post with slug "non-existent" not found');
    });
  });

  describe("checkKeywordConflict", () => {
    it("should return null for non-conflicting keywords", async () => {
      const conflict = await tracker.checkKeywordConflict("new keyword");
      expect(conflict).toBeNull();
    });

    it("should return slug for conflicting keywords", async () => {
      const entry: ContentInventoryEntry = {
        id: "test-id-8",
        slug: "conflict-test",
        title: "Conflict Test",
        primaryKeyword: "conflict keyword",
        secondaryKeywords: [],
        wordCount: 2500,
        internalLinkCount: 20,
        createdAt: new Date().toISOString(),
        schemaType: "Article",
      };

      await tracker.logPost(entry);

      const conflict = await tracker.checkKeywordConflict("conflict keyword");
      expect(conflict).toBe("conflict-test");
    });
  });

  describe("generateSummary", () => {
    it("should calculate correct averages", async () => {
      const entries: ContentInventoryEntry[] = [
        {
          id: "test-id-9",
          slug: "post-1",
          title: "Post 1",
          primaryKeyword: "keyword1",
          secondaryKeywords: [],
          wordCount: 2500,
          internalLinkCount: 20,
          createdAt: new Date().toISOString(),
          schemaType: "Article",
        },
        {
          id: "test-id-10",
          slug: "post-2",
          title: "Post 2",
          primaryKeyword: "keyword2",
          secondaryKeywords: [],
          wordCount: 3500,
          internalLinkCount: 25,
          createdAt: new Date().toISOString(),
          schemaType: "Article",
        },
      ];

      for (const entry of entries) {
        await tracker.logPost(entry);
      }

      const summary = await tracker.generateSummary();
      expect(summary.totalPosts).toBe(2);
      expect(summary.totalWordCount).toBe(6000);
      expect(summary.totalInternalLinks).toBe(45);
      expect(summary.averageWordCount).toBe(3000);
      expect(summary.averageLinksPerPost).toBe(22.5);
    });

    it("should handle empty inventory", async () => {
      const summary = await tracker.generateSummary();
      expect(summary.totalPosts).toBe(0);
      expect(summary.averageWordCount).toBe(0);
      expect(summary.averageLinksPerPost).toBe(0);
    });
  });

  describe("exportKeywordMapping", () => {
    it("should export all keyword mappings", async () => {
      const entries: ContentInventoryEntry[] = [
        {
          id: "test-id-11",
          slug: "post-a",
          title: "Post A",
          primaryKeyword: "keyword-a",
          secondaryKeywords: [],
          wordCount: 2500,
          internalLinkCount: 20,
          createdAt: new Date().toISOString(),
          schemaType: "Article",
        },
        {
          id: "test-id-12",
          slug: "post-b",
          title: "Post B",
          primaryKeyword: "keyword-b",
          secondaryKeywords: [],
          wordCount: 2500,
          internalLinkCount: 20,
          createdAt: new Date().toISOString(),
          schemaType: "Article",
        },
      ];

      for (const entry of entries) {
        await tracker.logPost(entry);
      }

      const mapping = await tracker.exportKeywordMapping();
      expect(mapping.size).toBe(2);
      expect(mapping.get("keyword-a")).toBe("post-a");
      expect(mapping.get("keyword-b")).toBe("post-b");
    });
  });
});
