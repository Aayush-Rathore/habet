/**
 * Unit Tests for SEO Optimizer
 * 
 * Tests the SEO optimizer with real GSC data to verify functionality.
 */

import { describe, it, expect } from "vitest";
import { SEOOptimizer } from "./seo-optimizer";
import type { BlogPost } from "./types/seo-blog";
import * as path from "path";

describe("SEO Optimizer Unit Tests", () => {
  const optimizer = new SEOOptimizer();

  describe("analyzeGSCData", () => {
    it("should parse and filter GSC data correctly", async () => {
      const csvPath = path.join(__dirname, "../test/fixtures/gsc-queries.csv");
      const results = await optimizer.analyzeGSCData(csvPath);

      // Should only include keywords with 10+ impressions and 0 clicks
      expect(results.length).toBeGreaterThan(0);

      for (const result of results) {
        expect(result.searchVolume).toBeGreaterThanOrEqual(10);
      }

      // Should be sorted by priority
      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].priority).toBeGreaterThanOrEqual(
          results[i + 1].priority
        );
      }

      // Verify specific keywords from fixture
      const keywords = results.map((r) => r.keyword);
      expect(keywords).toContain("habet app real or fake");
      expect(keywords).toContain("habet betting app real or fake");
    });
  });

  describe("classifySearchIntent", () => {
    it("should classify transactional keywords", () => {
      expect(optimizer.classifySearchIntent("habet app download")).toBe(
        "transactional"
      );
      expect(optimizer.classifySearchIntent("habet apk")).toBe("transactional");
      expect(optimizer.classifySearchIntent("habet withdrawal")).toBe(
        "transactional"
      );
      expect(optimizer.classifySearchIntent("habet bonus")).toBe(
        "transactional"
      );
    });

    it("should classify informational keywords", () => {
      expect(optimizer.classifySearchIntent("habet app real or fake")).toBe(
        "informational"
      );
      expect(optimizer.classifySearchIntent("cricket betting tips")).toBe(
        "informational"
      );
      expect(optimizer.classifySearchIntent("how to bet on cricket")).toBe(
        "informational"
      );
    });

    it("should classify navigational keywords", () => {
      expect(optimizer.classifySearchIntent("habet")).toBe("navigational");
      expect(optimizer.classifySearchIntent("ha bet")).toBe("navigational");
      expect(optimizer.classifySearchIntent("habet app")).toBe("navigational");
    });
  });

  describe("generateTopicRecommendations", () => {
    it("should generate topic recommendations from keywords", async () => {
      const csvPath = path.join(__dirname, "../test/fixtures/gsc-queries.csv");
      const keywords = await optimizer.analyzeGSCData(csvPath);
      const recommendations = optimizer.generateTopicRecommendations(
        keywords,
        5
      );

      expect(recommendations.length).toBeLessThanOrEqual(5);
      expect(recommendations.length).toBeGreaterThan(0);

      for (const rec of recommendations) {
        expect(rec.primaryKeyword).toBeTruthy();
        expect(rec.topic).toBeTruthy();
        expect(rec.searchIntent).toBeTruthy();
        expect(rec.targetAudience).toBe("Indian cricket betting enthusiasts");
        expect(rec.contentAngle).toBeTruthy();
        expect(rec.secondaryKeywords).toBeInstanceOf(Array);
      }
    });
  });

  describe("validateKeywordCannibalization", () => {
    it("should detect cannibalization with existing posts", () => {
      const existingPosts: BlogPost[] = [
        {
          frontmatter: {
            title: "HABET App Download Guide",
            slug: "habet-app-download-guide",
            date: "2026-01-20T10:00:00Z",
            excerpt: "Download HABET app",
            keywords: ["habet app download", "habet apk"],
            author: "HABET Sports Team",
            readingTime: "5 min read",
          },
          content: "Content",
        },
      ];

      // Should detect cannibalization
      expect(
        optimizer.validateKeywordCannibalization(
          "habet app download",
          existingPosts
        )
      ).toBe(false);

      // Should not detect cannibalization for new keyword
      expect(
        optimizer.validateKeywordCannibalization(
          "habet cricket betting",
          existingPosts
        )
      ).toBe(true);

      // Should not detect cannibalization for secondary keyword
      expect(
        optimizer.validateKeywordCannibalization("habet apk", existingPosts)
      ).toBe(true);
    });
  });
});
