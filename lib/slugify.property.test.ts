/**
 * Property-Based Tests for Slug Generation and Uniqueness
 * 
 * Feature: seo-blog-expansion
 * Property 2: Slug Generation and Uniqueness
 * 
 * **Validates: Requirements 1.4, 7.2**
 * 
 * For any blog post title and set of existing slugs, the slug generator SHALL
 * produce a valid kebab-case slug that is unique within the existing set, and
 * the validator SHALL correctly identify duplicate slugs.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { slugify, generateUniqueSlug } from "./slugify";
import { ContentValidator } from "./content-validator";
import type { BlogPost } from "./types/seo-blog";

const PBT_CONFIG = { numRuns: 20, timeout: 5000 };

// ── Arbitraries ───────────────────────────────────────────────────────────────

/**
 * Generates random titles with various character types:
 * - ASCII letters and numbers
 * - Special characters (punctuation, symbols)
 * - Unicode characters (including Hindi/Devanagari)
 * - Mixed case
 */
const titleArbitrary = fc.oneof(
  // Simple ASCII titles
  fc.string({ minLength: 1, maxLength: 100 }),
  // Titles with special characters
  fc
    .array(
      fc.oneof(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.constantFrom("!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "-", "_", "=", "+")
      ),
      { minLength: 1, maxLength: 10 }
    )
    .map((parts) => parts.join(" ")),
  // Titles with Unicode/Hindi characters
  fc
    .array(
      fc.oneof(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.constantFrom("करें", "डाउनलोड", "ऐप", "बेटिंग")
      ),
      { minLength: 1, maxLength: 10 }
    )
    .map((parts) => parts.join(" ")),
  // Mixed case titles
  fc.string({ minLength: 1, maxLength: 100 }).map((s) => {
    return s
      .split("")
      .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
      .join("");
  })
);

/**
 * Generates an array of existing slugs (valid kebab-case strings)
 */
const existingSlugsArbitrary = fc.array(
  fc.stringMatching(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  { minLength: 0, maxLength: 50 }
);

// ── Helper Functions ──────────────────────────────────────────────────────────

/**
 * Validates that a slug follows kebab-case format:
 * - Only lowercase letters, numbers, and hyphens
 * - No leading or trailing hyphens
 * - No consecutive hyphens
 */
function isValidKebabCase(slug: string): boolean {
  if (slug.length === 0) return true; // Empty slug is technically valid (edge case)
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

/**
 * Creates a minimal BlogPost for testing
 */
function createTestBlogPost(slug: string): BlogPost {
  return {
    frontmatter: {
      title: "Test Post",
      slug,
      date: "2026-01-20T10:00:00Z",
      excerpt: "Test excerpt",
      keywords: ["test"],
      author: "Test Author",
      readingTime: "5 min read",
    },
    content: "Test content",
  };
}

// ── Property Tests ────────────────────────────────────────────────────────────

describe("Property 2: Slug Generation and Uniqueness", () => {
  const validator = new ContentValidator();

  describe("slugify produces valid kebab-case slugs", () => {
    it("always produces valid kebab-case format for any title", () => {
      fc.assert(
        fc.property(titleArbitrary, (title) => {
          const slug = slugify(title);
          return isValidKebabCase(slug);
        }),
        PBT_CONFIG
      );
    });

    it("produces lowercase-only slugs", () => {
      fc.assert(
        fc.property(titleArbitrary, (title) => {
          const slug = slugify(title);
          return slug === slug.toLowerCase();
        }),
        PBT_CONFIG
      );
    });

    it("removes all special characters except hyphens", () => {
      fc.assert(
        fc.property(titleArbitrary, (title) => {
          const slug = slugify(title);
          // Should only contain a-z, 0-9, and hyphens
          return /^[a-z0-9-]*$/.test(slug);
        }),
        PBT_CONFIG
      );
    });

    it("removes Unicode/non-ASCII characters", () => {
      fc.assert(
        fc.property(titleArbitrary, (title) => {
          const slug = slugify(title);
          // Should only contain ASCII characters
          return /^[\x00-\x7F]*$/.test(slug);
        }),
        PBT_CONFIG
      );
    });

    it("has no leading or trailing hyphens", () => {
      fc.assert(
        fc.property(titleArbitrary, (title) => {
          const slug = slugify(title);
          if (slug.length === 0) return true;
          return !slug.startsWith("-") && !slug.endsWith("-");
        }),
        PBT_CONFIG
      );
    });

    it("has no consecutive hyphens", () => {
      fc.assert(
        fc.property(titleArbitrary, (title) => {
          const slug = slugify(title);
          return !slug.includes("--");
        }),
        PBT_CONFIG
      );
    });
  });

  describe("generateUniqueSlug produces unique slugs", () => {
    it("always returns a slug not in existingSlugs", () => {
      fc.assert(
        fc.property(titleArbitrary, existingSlugsArbitrary, (title, existingSlugs) => {
          const result = generateUniqueSlug(title, existingSlugs);
          return !existingSlugs.includes(result);
        }),
        PBT_CONFIG
      );
    });

    it("returns base slug when no collision exists", () => {
      fc.assert(
        fc.property(titleArbitrary, existingSlugsArbitrary, (title, existingSlugs) => {
          const baseSlug = slugify(title);
          
          // Only test when base slug doesn't collide
          if (existingSlugs.includes(baseSlug)) {
            return true; // Skip this case
          }

          const result = generateUniqueSlug(title, existingSlugs);
          return result === baseSlug;
        }),
        PBT_CONFIG
      );
    });

    it("appends suffix when collision exists", () => {
      fc.assert(
        fc.property(titleArbitrary, existingSlugsArbitrary, (title, existingSlugs) => {
          const baseSlug = slugify(title);
          
          // Only test when base slug collides
          if (!existingSlugs.includes(baseSlug) || baseSlug === "") {
            return true; // Skip this case
          }

          const result = generateUniqueSlug(title, existingSlugs);
          
          // Result should start with base slug and have a suffix
          return result.startsWith(baseSlug + "-") && result.length > baseSlug.length + 1;
        }),
        PBT_CONFIG
      );
    });

    it("produces valid kebab-case slug even with suffix", () => {
      fc.assert(
        fc.property(titleArbitrary, existingSlugsArbitrary, (title, existingSlugs) => {
          const result = generateUniqueSlug(title, existingSlugs);
          return isValidKebabCase(result);
        }),
        PBT_CONFIG
      );
    });

    it("handles empty existingSlugs array", () => {
      fc.assert(
        fc.property(titleArbitrary, (title) => {
          const result = generateUniqueSlug(title, []);
          const expected = slugify(title);
          return result === expected;
        }),
        PBT_CONFIG
      );
    });

    it("handles titles that produce empty slugs", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(""),
            fc.constant("!!!"),
            fc.constant("@@@"),
            fc.constant("करें डाउनलोड") // Only Hindi characters
          ),
          existingSlugsArbitrary,
          (title, existingSlugs) => {
            const result = generateUniqueSlug(title, existingSlugs);
            // Should still not be in existing slugs
            return !existingSlugs.includes(result);
          }
        ),
        PBT_CONFIG
      );
    });
  });

  describe("ContentValidator correctly identifies duplicate slugs", () => {
    it("detects duplicate slugs in existing posts", () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-z0-9]+(-[a-z0-9]+)*$/),
          fc.array(
            fc.stringMatching(/^[a-z0-9]+(-[a-z0-9]+)*$/),
            { minLength: 1, maxLength: 20 }
          ),
          (duplicateSlug, otherSlugs) => {
            // Create a new post with a slug that exists in existing posts
            const newPost = createTestBlogPost(duplicateSlug);
            const existingPosts = [
              createTestBlogPost(duplicateSlug), // Duplicate!
              ...otherSlugs.map(createTestBlogPost),
            ];

            const result = validator.validateUniqueness(newPost, existingPosts);

            // Should fail validation due to duplicate slug
            return (
              result.passed === false &&
              result.errors.some((err) => err.includes("Duplicate slug"))
            );
          }
        ),
        PBT_CONFIG
      );
    });

    it("passes validation when slug is unique", () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-z0-9]+(-[a-z0-9]+)*$/),
          fc.array(
            fc.stringMatching(/^[a-z0-9]+(-[a-z0-9]+)*$/),
            { minLength: 0, maxLength: 20 }
          ),
          (newSlug, existingSlugs) => {
            // Ensure newSlug is not in existingSlugs
            if (existingSlugs.includes(newSlug)) {
              return true; // Skip this case
            }

            const newPost = createTestBlogPost(newSlug);
            const existingPosts = existingSlugs.map(createTestBlogPost);

            const result = validator.validateUniqueness(newPost, existingPosts);

            // Should pass validation (no duplicate slug error)
            const hasDuplicateSlugError = result.errors.some((err) =>
              err.includes("Duplicate slug")
            );
            return !hasDuplicateSlugError;
          }
        ),
        PBT_CONFIG
      );
    });

    it("validates slug format correctly", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Valid kebab-case slugs
            fc.stringMatching(/^[a-z0-9]+(-[a-z0-9]+)*$/),
            // Invalid slugs (uppercase, special chars, etc.)
            fc.oneof(
              fc.constant("Invalid-Slug"), // Uppercase
              fc.constant("invalid_slug"), // Underscore
              fc.constant("invalid slug"), // Space
              fc.constant("invalid--slug"), // Double hyphen
              fc.constant("-invalid-slug"), // Leading hyphen
              fc.constant("invalid-slug-") // Trailing hyphen
            )
          ),
          (slug) => {
            const result = validator.validateSlugFormat(slug);
            const isValid = isValidKebabCase(slug);

            return result.passed === isValid;
          }
        ),
        PBT_CONFIG
      );
    });
  });

  describe("Integration: slug generation + validation", () => {
    it("generated slugs always pass format validation", () => {
      fc.assert(
        fc.property(titleArbitrary, (title) => {
          const slug = slugify(title);
          const result = validator.validateSlugFormat(slug);

          // Generated slugs should always pass format validation
          return result.passed === true || slug === ""; // Empty slug is edge case
        }),
        PBT_CONFIG
      );
    });

    it("unique slugs always pass uniqueness validation", () => {
      fc.assert(
        fc.property(titleArbitrary, existingSlugsArbitrary, (title, existingSlugs) => {
          const uniqueSlug = generateUniqueSlug(title, existingSlugs);
          const newPost = createTestBlogPost(uniqueSlug);
          const existingPosts = existingSlugs.map(createTestBlogPost);

          const result = validator.validateUniqueness(newPost, existingPosts);

          // Should not have duplicate slug error
          const hasDuplicateSlugError = result.errors.some((err) =>
            err.includes("Duplicate slug")
          );
          return !hasDuplicateSlugError;
        }),
        PBT_CONFIG
      );
    });

    it("workflow: title -> slug -> validation succeeds", () => {
      fc.assert(
        fc.property(
          fc.array(titleArbitrary, { minLength: 1, maxLength: 10 }),
          (titles) => {
            const existingSlugs: string[] = [];
            const posts: BlogPost[] = [];

            // Generate slugs for each title sequentially
            for (const title of titles) {
              const slug = generateUniqueSlug(title, existingSlugs);
              
              // Skip empty slugs (edge case from titles with only special chars)
              if (slug === "") {
                continue;
              }
              
              existingSlugs.push(slug);
              posts.push(createTestBlogPost(slug));
            }

            // If no valid posts were created, test passes trivially
            if (posts.length === 0) {
              return true;
            }

            // Validate each post against all previous posts
            for (let i = 0; i < posts.length; i++) {
              const post = posts[i];
              const previousPosts = posts.slice(0, i);
              const result = validator.validateUniqueness(post, previousPosts);

              // Should pass uniqueness validation
              const hasDuplicateSlugError = result.errors.some((err) =>
                err.includes("Duplicate slug")
              );
              if (hasDuplicateSlugError) {
                return false;
              }
            }

            return true;
          }
        ),
        PBT_CONFIG
      );
    });
  });

  describe("Edge cases", () => {
    it("handles very long titles", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 200, maxLength: 500 }),
          (longTitle) => {
            const slug = slugify(longTitle);
            return isValidKebabCase(slug);
          }
        ),
        PBT_CONFIG
      );
    });

    it("handles titles with only special characters", () => {
      fc.assert(
        fc.property(
          fc.string().filter((s) => /^[^a-zA-Z0-9]+$/.test(s) && s.length > 0),
          (specialTitle) => {
            const slug = slugify(specialTitle);
            return isValidKebabCase(slug);
          }
        ),
        PBT_CONFIG
      );
    });

    it("handles titles with mixed scripts (Latin + Devanagari)", () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.constantFrom("करें", "डाउनलोड", "ऐप", "बेटिंग")
          ),
          ([latin, hindi]) => {
            const title = `${latin} ${hindi}`;
            const slug = slugify(title);
            return isValidKebabCase(slug);
          }
        ),
        PBT_CONFIG
      );
    });

    it("handles large sets of existing slugs efficiently", () => {
      fc.assert(
        fc.property(
          titleArbitrary,
          fc.array(
            fc.stringMatching(/^[a-z0-9]+(-[a-z0-9]+)*$/),
            { minLength: 100, maxLength: 200 }
          ),
          (title, largeSlugsArray) => {
            const result = generateUniqueSlug(title, largeSlugsArray);
            return !largeSlugsArray.includes(result) && isValidKebabCase(result);
          }
        ),
        { numRuns: 10 } // Fewer runs for performance
      );
    });
  });
});
