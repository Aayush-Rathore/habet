/**
 * Property-Based Tests for FAQ Section and Metadata Validation
 *
 * Property 10: FAQ Section Validation
 * Property 20: Title Uniqueness Validation
 * Property 21: Excerpt Validation
 * Property 22: Reading Time Calculation
 *
 * Validates: Requirements 3.5, 7.1, 7.4, 7.5
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { ContentValidator } from "./content-validator";
import { calculateReadingTime } from "./blog";
import type { BlogPost } from "./types/seo-blog";

const PBT_CONFIG = {
  numRuns: 20,
  timeout: 5000,
  verbose: true,
};

// ── Arbitraries ───────────────────────────────────────────────────────────────

/** Generate a safe word (alphanumeric only) */
const safeWord = fc
  .string({ minLength: 1, maxLength: 20 })
  .filter((s) => /^[a-zA-Z0-9]+$/.test(s));

/** Generate markdown content with a specific word count */
const markdownWithWordCount = (targetWords: number) => {
  return fc
    .array(safeWord, { minLength: targetWords, maxLength: targetWords })
    .map((words) => words.join(" "));
};

/** Generate a valid FAQ section with N question-answer pairs */
function generateFAQSection(numQA: number): string {
  const lines = ["## FAQ", ""];
  for (let i = 0; i < numQA; i++) {
    lines.push(`### Question ${i + 1}?`);
    lines.push("");
    lines.push(`Answer ${i + 1} with some details.`);
    lines.push("");
  }
  return lines.join("\n");
}

/** Generate a blog post with FAQ section */
function blogPostWithFAQ(numQA: number): BlogPost {
  return {
    frontmatter: {
      title: "Test Post with FAQ",
      slug: "test-post-faq",
      date: "2026-01-01T00:00:00Z",
      excerpt: "Test excerpt with keyword habet for testing purposes exactly 155 chars",
      keywords: ["test", "habet"],
      author: "HABET Sports Team",
      readingTime: "5 min read",
    },
    content: `# Test Post

Some introduction content here.

${generateFAQSection(numQA)}

## Conclusion

Some conclusion content here.`,
  };
}

/** Generate a blog post title */
const blogTitleArbitrary = fc
  .string({ minLength: 10, maxLength: 100 })
  .filter((s) => s.trim().length >= 10);

/** Generate an excerpt with specific length */
const excerptArbitrary = (minLen: number, maxLen: number) => {
  return fc
    .string({ minLength: minLen, maxLength: maxLen })
    .filter((s) => s.trim().length >= minLen && s.trim().length <= maxLen);
};

/** Generate a keyword */
const keywordArbitrary = fc
  .string({ minLength: 3, maxLength: 15 })
  .filter((s) => /^[a-zA-Z]+$/.test(s));

// ── Property 10: FAQ Section Validation ───────────────────────────────────────

describe("Property 10: FAQ Section Validation", () => {
  const validator = new ContentValidator();

  it("should correctly identify valid FAQ sections with 4-6 Q&A pairs", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 4, max: 6 }),
        (numQA) => {
          const post = blogPostWithFAQ(numQA);
          const result = validator.validateFAQSection(post);

          // Should pass validation
          expect(result.passed).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      PBT_CONFIG
    );
  });

  it("should reject FAQ sections with too few Q&A pairs (< 4)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 3 }),
        (numQA) => {
          const post = blogPostWithFAQ(numQA);
          const result = validator.validateFAQSection(post);

          // Should fail validation
          expect(result.passed).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }
      ),
      PBT_CONFIG
    );
  });

  it("should reject FAQ sections with too many Q&A pairs (> 6)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 7, max: 10 }),
        (numQA) => {
          const post = blogPostWithFAQ(numQA);
          const result = validator.validateFAQSection(post);

          // Should fail validation
          expect(result.passed).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }
      ),
      PBT_CONFIG
    );
  });

  it("should reject posts without FAQ section", () => {
    fc.assert(
      fc.property(
        markdownWithWordCount(100),
        (content) => {
          const post: BlogPost = {
            frontmatter: {
              title: "Test Post",
              slug: "test-post",
              date: "2026-01-01T00:00:00Z",
              excerpt: "Test excerpt",
              keywords: ["test"],
              author: "HABET Sports Team",
              readingTime: "5 min read",
            },
            content,
          };

          const result = validator.validateFAQSection(post);

          // Should fail validation (no FAQ section)
          expect(result.passed).toBe(false);
          expect(result.errors.some((e) => e.includes("FAQ"))).toBe(true);
        }
      ),
      PBT_CONFIG
    );
  });
});

// ── Property 20: Title Uniqueness Validation ──────────────────────────────────

describe("Property 20: Title Uniqueness Validation", () => {
  const validator = new ContentValidator();

  it("should correctly identify unique titles", () => {
    fc.assert(
      fc.property(
        fc.array(blogTitleArbitrary, { minLength: 1, maxLength: 10 }),
        blogTitleArbitrary,
        (existingTitles, newTitle) => {
          // Ensure new title is different from all existing titles
          fc.pre(!existingTitles.includes(newTitle));

          const existingPosts: BlogPost[] = existingTitles.map((title, i) => ({
            frontmatter: {
              title,
              slug: `post-${i}`,
              date: "2026-01-01T00:00:00Z",
              excerpt: "Test excerpt",
              keywords: ["test"],
              author: "HABET Sports Team",
              readingTime: "5 min read",
            },
            content: "Test content",
          }));

          const newPost: BlogPost = {
            frontmatter: {
              title: newTitle,
              slug: "new-post",
              date: "2026-01-01T00:00:00Z",
              excerpt: "Test excerpt",
              keywords: ["test"],
              author: "HABET Sports Team",
              readingTime: "5 min read",
            },
            content: "Test content",
          };

          const result = validator.validateUniqueness(newPost, existingPosts);

          // Should pass validation (unique title)
          expect(result.passed).toBe(true);
          expect(result.errors.some((e) => e.includes("title"))).toBe(false);
        }
      ),
      PBT_CONFIG
    );
  });

  it("should reject duplicate titles", () => {
    fc.assert(
      fc.property(
        fc.array(blogTitleArbitrary, { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 0, max: 9 }),
        (titles, duplicateIndex) => {
          fc.pre(duplicateIndex < titles.length);

          const existingPosts: BlogPost[] = titles.map((title, i) => ({
            frontmatter: {
              title,
              slug: `post-${i}`,
              date: "2026-01-01T00:00:00Z",
              excerpt: "Test excerpt",
              keywords: ["test"],
              author: "HABET Sports Team",
              readingTime: "5 min read",
            },
            content: "Test content",
          }));

          // Create new post with duplicate title
          const newPost: BlogPost = {
            frontmatter: {
              title: titles[duplicateIndex],
              slug: "new-post",
              date: "2026-01-01T00:00:00Z",
              excerpt: "Test excerpt",
              keywords: ["test"],
              author: "HABET Sports Team",
              readingTime: "5 min read",
            },
            content: "Test content",
          };

          const result = validator.validateUniqueness(newPost, existingPosts);

          // Should fail validation (duplicate title)
          expect(result.passed).toBe(false);
          expect(result.errors.some((e) => e.toLowerCase().includes("title"))).toBe(true);
        }
      ),
      PBT_CONFIG
    );
  });
});

// ── Property 21: Excerpt Validation ───────────────────────────────────────────

describe("Property 21: Excerpt Validation", () => {
  const validator = new ContentValidator();

  it("should accept excerpts with correct length (150-160 chars) and keyword", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 150, max: 160 }),
        keywordArbitrary,
        (targetLength, keyword) => {
          // Create excerpt with keyword and target length
          const keywordPart = keyword;
          const remainingLength = targetLength - keywordPart.length - 1; // -1 for space
          
          fc.pre(remainingLength > 0);

          const filler = "a".repeat(remainingLength);
          const excerpt = `${keywordPart} ${filler}`.substring(0, targetLength);

          const post: BlogPost = {
            frontmatter: {
              title: "Test Post",
              slug: "test-post",
              date: "2026-01-01T00:00:00Z",
              excerpt,
              keywords: [keyword, "test"],
              author: "HABET Sports Team",
              readingTime: "5 min read",
            },
            content: "Test content",
          };

          const result = validator.validateExcerpt(post, keyword);

          // Should pass validation
          expect(result.passed).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      PBT_CONFIG
    );
  });

  it("should reject excerpts that are too short (< 150 chars)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 149 }),
        keywordArbitrary,
        (length, keyword) => {
          const excerpt = `${keyword} ${"a".repeat(Math.max(0, length - keyword.length - 1))}`;

          const post: BlogPost = {
            frontmatter: {
              title: "Test Post",
              slug: "test-post",
              date: "2026-01-01T00:00:00Z",
              excerpt: excerpt.substring(0, length),
              keywords: [keyword, "test"],
              author: "HABET Sports Team",
              readingTime: "5 min read",
            },
            content: "Test content",
          };

          const result = validator.validateExcerpt(post, keyword);

          // Should fail validation (too short)
          expect(result.passed).toBe(false);
          expect(result.errors.some((e) => e.includes("150"))).toBe(true);
        }
      ),
      PBT_CONFIG
    );
  });

  it("should reject excerpts that are too long (> 160 chars)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 161, max: 200 }),
        keywordArbitrary,
        (length, keyword) => {
          const excerpt = `${keyword} ${"a".repeat(length - keyword.length - 1)}`;

          const post: BlogPost = {
            frontmatter: {
              title: "Test Post",
              slug: "test-post",
              date: "2026-01-01T00:00:00Z",
              excerpt,
              keywords: [keyword, "test"],
              author: "HABET Sports Team",
              readingTime: "5 min read",
            },
            content: "Test content",
          };

          const result = validator.validateExcerpt(post, keyword);

          // Should fail validation (too long)
          expect(result.passed).toBe(false);
          expect(result.errors.some((e) => e.includes("160"))).toBe(true);
        }
      ),
      PBT_CONFIG
    );
  });

  it("should reject excerpts missing the primary keyword", () => {
    fc.assert(
      fc.property(
        keywordArbitrary,
        keywordArbitrary,
        (keyword1, keyword2) => {
          // Ensure keywords are different (case-insensitive) and keyword1 is not a substring of keyword2
          fc.pre(
            keyword1.toLowerCase() !== keyword2.toLowerCase() &&
            !keyword2.toLowerCase().includes(keyword1.toLowerCase()) &&
            !keyword1.toLowerCase().includes(keyword2.toLowerCase())
          );

          // Create excerpt with keyword2 but not keyword1
          const excerpt = `${keyword2} ${"a".repeat(150 - keyword2.length - 1)}`;

          const post: BlogPost = {
            frontmatter: {
              title: "Test Post",
              slug: "test-post",
              date: "2026-01-01T00:00:00Z",
              excerpt: excerpt.substring(0, 155),
              keywords: [keyword1, "test"],
              author: "HABET Sports Team",
              readingTime: "5 min read",
            },
            content: "Test content",
          };

          const result = validator.validateExcerpt(post, keyword1);

          // Should fail validation (missing keyword)
          expect(result.passed).toBe(false);
          expect(result.errors.some((e) => e.toLowerCase().includes("keyword"))).toBe(true);
        }
      ),
      PBT_CONFIG
    );
  });
});

// ── Property 22: Reading Time Calculation ─────────────────────────────────────

describe("Property 22: Reading Time Calculation", () => {
  it("should calculate reading time correctly at 200 words per minute", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        (wordCount) => {
          // Generate content with exact word count
          const content = Array(wordCount).fill("word").join(" ");
          
          const readingTime = calculateReadingTime(content);
          
          // Calculate expected reading time (rounded up)
          const expectedMinutes = Math.ceil(wordCount / 200);
          const expectedReadingTime = `${expectedMinutes} min read`;
          
          // Should match expected format and value
          expect(readingTime).toBe(expectedReadingTime);
        }
      ),
      PBT_CONFIG
    );
  });

  it("should always round up to the nearest minute", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 200 }),
        (extraWords) => {
          // Create content with 200 words + extra words
          const baseWords = 200;
          const totalWords = baseWords + extraWords;
          const content = Array(totalWords).fill("word").join(" ");
          
          const readingTime = calculateReadingTime(content);
          
          // Should always round up
          const expectedMinutes = Math.ceil(totalWords / 200);
          expect(readingTime).toBe(`${expectedMinutes} min read`);
          
          // Verify it's actually rounded up (not down)
          if (extraWords > 0) {
            expect(expectedMinutes).toBe(2);
          } else {
            expect(expectedMinutes).toBe(1);
          }
        }
      ),
      PBT_CONFIG
    );
  });

  it("should handle edge cases (empty, very short, very long content)", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(0), // Empty
          fc.integer({ min: 1, max: 10 }), // Very short
          fc.integer({ min: 5000, max: 10000 }) // Very long
        ),
        (wordCount) => {
          const content = wordCount === 0 ? "" : Array(wordCount).fill("word").join(" ");
          
          const readingTime = calculateReadingTime(content);
          
          // Should always return valid format
          expect(readingTime).toMatch(/^\d+ min read$/);
          
          // Extract minutes
          const minutes = parseInt(readingTime.split(" ")[0]);
          
          // Should be positive (implementation returns 1 for empty string)
          expect(minutes).toBeGreaterThan(0);
          
          // For non-empty content, should match expected calculation
          if (wordCount > 0) {
            const expectedMinutes = Math.ceil(wordCount / 200);
            expect(minutes).toBe(expectedMinutes);
          }
        }
      ),
      PBT_CONFIG
    );
  });

  it("should produce consistent results for the same input", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 5000 }),
        (wordCount) => {
          const content = Array(wordCount).fill("word").join(" ");
          
          // Calculate multiple times
          const result1 = calculateReadingTime(content);
          const result2 = calculateReadingTime(content);
          const result3 = calculateReadingTime(content);
          
          // Should be consistent
          expect(result1).toBe(result2);
          expect(result2).toBe(result3);
        }
      ),
      PBT_CONFIG
    );
  });
});
