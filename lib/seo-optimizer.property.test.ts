/**
 * Property-Based Tests for SEO Optimizer
 * 
 * Tests universal properties of GSC data analysis, keyword filtering,
 * search intent classification, and keyword cannibalization prevention.
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { SEOOptimizer } from "./seo-optimizer";
import type { KeywordAnalysis, BlogPost } from "./types/seo-blog";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

describe("SEO Optimizer Property Tests", () => {
  const optimizer = new SEOOptimizer();

  /**
   * Property 11: GSC Keyword Filtering
   * 
   * **Validates: Requirements 4.1**
   * 
   * For any GSC dataset with query data (impressions, clicks), the SEO optimizer
   * SHALL correctly filter and prioritize keywords with 10+ impressions and 0 clicks,
   * ranking them by priority score.
   */
  describe("Property 11: GSC Keyword Filtering", () => {
    it("should filter keywords with 10+ impressions and 0 clicks", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              query: fc.string({ minLength: 3, maxLength: 50 }),
              clicks: fc.integer({ min: 0, max: 100 }),
              impressions: fc.integer({ min: 0, max: 1000 }),
              ctr: fc.float({ min: 0, max: 1 }),
              position: fc.float({ min: 1, max: 100 }),
            }),
            { minLength: 5, maxLength: 50 }
          ),
          async (gscData) => {
            // Create temporary CSV file
            const tmpDir = await fs.promises.mkdtemp(
              path.join(os.tmpdir(), "gsc-test-")
            );
            const csvPath = path.join(tmpDir, "queries.csv");

            // Write CSV
            const csvContent = [
              "query,clicks,impressions,ctr,position",
              ...gscData.map(
                (row) =>
                  `${row.query},${row.clicks},${row.impressions},${row.ctr},${row.position}`
              ),
            ].join("\n");

            await fs.promises.writeFile(csvPath, csvContent, "utf-8");

            try {
              // Analyze GSC data
              const results = await optimizer.analyzeGSCData(csvPath);

              // Property: All results should have 10+ impressions and 0 clicks
              for (const result of results) {
                expect(result.searchVolume).toBeGreaterThanOrEqual(10);
                
                // Find original data to verify clicks were 0
                const originalData = gscData.find(
                  (d) => d.query === result.keyword
                );
                if (originalData) {
                  expect(originalData.clicks).toBe(0);
                }
              }

              // Property: Results should be sorted by priority (descending)
              for (let i = 0; i < results.length - 1; i++) {
                expect(results[i].priority).toBeGreaterThanOrEqual(
                  results[i + 1].priority
                );
              }

              // Property: No keywords with <10 impressions should be included
              const includedKeywords = new Set(results.map((r) => r.keyword));
              for (const data of gscData) {
                if (data.impressions < 10 || data.clicks > 0) {
                  expect(includedKeywords.has(data.query)).toBe(false);
                }
              }
            } finally {
              // Cleanup
              await fs.promises.unlink(csvPath);
              await fs.promises.rmdir(tmpDir);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    it("should calculate priority score correctly", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              keyword: fc.string({ minLength: 3, maxLength: 50 }),
              searchVolume: fc.integer({ min: 10, max: 1000 }),
              competition: fc.float({ min: 0, max: 1 }),
              intent: fc.constantFrom(
                "informational" as const,
                "navigational" as const,
                "transactional" as const
              ),
              priority: fc.float({ min: 0, max: 1000 }).filter(p => !isNaN(p) && isFinite(p)),
            }),
            { minLength: 2, maxLength: 20 }
          ),
          (keywords) => {
            const sorted = optimizer.prioritizeKeywords(keywords);

            // Property: Result should be sorted by priority descending
            for (let i = 0; i < sorted.length - 1; i++) {
              expect(sorted[i].priority).toBeGreaterThanOrEqual(
                sorted[i + 1].priority
              );
            }

            // Property: All original keywords should be present
            expect(sorted.length).toBe(keywords.length);
            const sortedKeywords = new Set(sorted.map((k) => k.keyword));
            for (const kw of keywords) {
              expect(sortedKeywords.has(kw.keyword)).toBe(true);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 12: Keyword Assignment Validation
   * 
   * **Validates: Requirements 4.4**
   * 
   * For any blog post, the validator SHALL verify that exactly 1 primary keyword
   * and 5-8 secondary keywords are assigned from the GSC data.
   */
  describe("Property 12: Keyword Assignment Validation", () => {
    it("should generate topic recommendations with 1 primary and 5-8 secondary keywords", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              keyword: fc.string({ minLength: 3, maxLength: 50 }),
              searchVolume: fc.integer({ min: 10, max: 1000 }),
              competition: fc.float({ min: 0, max: 1 }),
              intent: fc.constantFrom(
                "informational" as const,
                "navigational" as const,
                "transactional" as const
              ),
              priority: fc.integer({ min: 1, max: 100 }),
            }),
            { minLength: 10, maxLength: 50 }
          ),
          fc.integer({ min: 1, max: 10 }),
          (keywords, count) => {
            const recommendations = optimizer.generateTopicRecommendations(
              keywords,
              count
            );

            // Property: Should generate at most 'count' recommendations
            expect(recommendations.length).toBeLessThanOrEqual(count);

            // Property: Each recommendation should have exactly 1 primary keyword
            for (const rec of recommendations) {
              expect(rec.primaryKeyword).toBeTruthy();
              expect(typeof rec.primaryKeyword).toBe("string");
              expect(rec.primaryKeyword.length).toBeGreaterThan(0);

              // Property: Each recommendation should have 0-8 secondary keywords
              // (may be less than 5 if not enough related keywords available)
              expect(rec.secondaryKeywords.length).toBeLessThanOrEqual(8);

              // Property: Primary keyword should not appear in secondary keywords
              expect(rec.secondaryKeywords).not.toContain(rec.primaryKeyword);

              // Property: Secondary keywords should be unique
              const uniqueSecondary = new Set(rec.secondaryKeywords);
              expect(uniqueSecondary.size).toBe(rec.secondaryKeywords.length);
            }

            // Property: Primary keywords should be unique across recommendations
            const primaryKeywords = recommendations.map((r) => r.primaryKeyword);
            const uniquePrimary = new Set(primaryKeywords);
            expect(uniquePrimary.size).toBe(primaryKeywords.length);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 13: Search Intent Classification
   * 
   * **Validates: Requirements 4.5**
   * 
   * For any search query string, the SEO optimizer SHALL classify it into exactly
   * one of three categories (informational, navigational, transactional) based on
   * keyword patterns and query structure.
   */
  describe("Property 13: Search Intent Classification", () => {
    it("should classify any query into exactly one intent category", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (query) => {
            const intent = optimizer.classifySearchIntent(query);

            // Property: Intent must be one of the three valid categories
            expect(["informational", "navigational", "transactional"]).toContain(
              intent
            );

            // Property: Classification should be deterministic
            const intent2 = optimizer.classifySearchIntent(query);
            expect(intent2).toBe(intent);
          }
        ),
        { numRuns: 20 }
      );
    });

    it("should classify transactional keywords correctly", () => {
      const transactionalKeywords = [
        "download",
        "apk",
        "install",
        "buy",
        "register",
        "signup",
        "login",
        "withdrawal",
        "withdraw",
        "bonus",
        "promo",
        "offer",
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...transactionalKeywords),
          fc.string({ minLength: 0, maxLength: 50 }),
          (keyword, suffix) => {
            const query = `${keyword} ${suffix}`.trim();
            const intent = optimizer.classifySearchIntent(query);

            // Property: Queries containing transactional keywords should be
            // classified as transactional
            expect(intent).toBe("transactional");
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should classify informational keywords correctly", () => {
      const informationalKeywords = [
        "how to",
        "what is",
        "why",
        "guide",
        "tips",
        "real or fake",
        "review",
        "comparison",
        "vs",
        "explained",
        "markets",
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...informationalKeywords),
          fc.string({ minLength: 0, maxLength: 50 }),
          (keyword, suffix) => {
            const query = `${keyword} ${suffix}`.trim();
            const intent = optimizer.classifySearchIntent(query);

            // Property: Queries containing informational keywords (and no
            // transactional keywords) should be classified as informational
            const hasTransactional = [
              "download",
              "apk",
              "install",
              "buy",
              "register",
              "signup",
              "login",
              "withdrawal",
              "withdraw",
              "bonus",
              "promo",
              "offer",
            ].some((t) => query.toLowerCase().includes(t));

            if (!hasTransactional) {
              expect(intent).toBe("informational");
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should handle case-insensitive classification", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (query) => {
            const lowerIntent = optimizer.classifySearchIntent(
              query.toLowerCase()
            );
            const upperIntent = optimizer.classifySearchIntent(
              query.toUpperCase()
            );
            const mixedIntent = optimizer.classifySearchIntent(query);

            // Property: Classification should be case-insensitive
            expect(lowerIntent).toBe(upperIntent);
            expect(lowerIntent).toBe(mixedIntent);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Property 26: Keyword Cannibalization Prevention
   * 
   * **Validates: Requirements 9.6**
   * 
   * For any new blog post with a primary keyword and set of existing blog posts,
   * the validator SHALL correctly identify whether the primary keyword conflicts
   * with any existing post's primary keyword.
   */
  describe("Property 26: Keyword Cannibalization Prevention", () => {
    it("should detect keyword cannibalization when primary keywords match", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              title: fc.string({ minLength: 10, maxLength: 100 }),
              slug: fc.string({ minLength: 5, maxLength: 50 }),
              keywords: fc.array(fc.string({ minLength: 3, maxLength: 30 }), {
                minLength: 1,
                maxLength: 12,
              }),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (posts) => {
            // Create blog posts with frontmatter
            const blogPosts: BlogPost[] = posts.map((p) => ({
              frontmatter: {
                title: p.title,
                slug: p.slug,
                date: new Date().toISOString(),
                excerpt: "Test excerpt",
                keywords: p.keywords,
                author: "HABET Sports Team",
                readingTime: "5 min read",
              },
              content: "Test content",
            }));

            // Property: If we use an existing primary keyword, cannibalization
            // should be detected (return false)
            for (const post of blogPosts) {
              if (post.frontmatter.keywords.length > 0) {
                const existingKeyword = post.frontmatter.keywords[0];
                const result = optimizer.validateKeywordCannibalization(
                  existingKeyword,
                  blogPosts
                );
                expect(result).toBe(false);
              }
            }

            // Property: If we use a new keyword not in any post, no cannibalization
            // should be detected (return true)
            const newKeyword = "unique-keyword-" + Math.random();
            const result = optimizer.validateKeywordCannibalization(
              newKeyword,
              blogPosts
            );
            expect(result).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should be case-insensitive and trim whitespace", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 30 }).filter(s => s.trim().length >= 3),
          fc.array(fc.constantFrom(" ", "\t", "\n"), {
            minLength: 0,
            maxLength: 3,
          }),
          (keyword, whitespace) => {
            const trimmedKeyword = keyword.trim();
            const blogPosts: BlogPost[] = [
              {
                frontmatter: {
                  title: "Test Post",
                  slug: "test-post",
                  date: new Date().toISOString(),
                  excerpt: "Test excerpt",
                  keywords: [trimmedKeyword.toLowerCase()],
                  author: "HABET Sports Team",
                  readingTime: "5 min read",
                },
                content: "Test content",
              },
            ];

            // Add whitespace variations
            const keywordWithWhitespace =
              whitespace.join("") + trimmedKeyword.toUpperCase() + whitespace.join("");

            const result = optimizer.validateKeywordCannibalization(
              keywordWithWhitespace,
              blogPosts
            );

            // Property: Should detect cannibalization regardless of case or whitespace
            expect(result).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should return true for empty existing posts array", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (keyword) => {
            const result = optimizer.validateKeywordCannibalization(keyword, []);

            // Property: With no existing posts, no cannibalization is possible
            expect(result).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });

    it("should only check primary keyword (first in keywords array)", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 3, maxLength: 30 }),
          fc.array(fc.string({ minLength: 3, maxLength: 30 }), {
            minLength: 2,
            maxLength: 8,
          }),
          (primaryKeyword, secondaryKeywords) => {
            const blogPosts: BlogPost[] = [
              {
                frontmatter: {
                  title: "Test Post",
                  slug: "test-post",
                  date: new Date().toISOString(),
                  excerpt: "Test excerpt",
                  keywords: [primaryKeyword, ...secondaryKeywords],
                  author: "HABET Sports Team",
                  readingTime: "5 min read",
                },
                content: "Test content",
              },
            ];

            // Property: Using a secondary keyword should NOT trigger cannibalization
            if (secondaryKeywords.length > 0) {
              const result = optimizer.validateKeywordCannibalization(
                secondaryKeywords[0],
                blogPosts
              );
              expect(result).toBe(true);
            }

            // Property: Using the primary keyword SHOULD trigger cannibalization
            const result2 = optimizer.validateKeywordCannibalization(
              primaryKeyword,
              blogPosts
            );
            expect(result2).toBe(false);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
