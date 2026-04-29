/**
 * Property-Based Tests for Visual Element Validation
 *
 * Property 24: Visual Element Validation
 * Validates: Requirements 8.4, 8.5, 8.7
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { ContentValidator } from "./content-validator";
import type { BlogPost } from "./types/seo-blog";

const PBT_CONFIG = {
  numRuns: 20,
  timeout: 5000,
  verbose: true,
};

// ── Arbitraries ───────────────────────────────────────────────────────────────

/** Generate a safe word: non-empty, no whitespace, no markdown special chars */
const safeWord = fc
  .string({ minLength: 1, maxLength: 20 })
  .filter((s) => /^[a-zA-Z0-9]+$/.test(s));

/** Generate markdown content with specific word count */
const markdownWithWordCount = (targetWords: number) => {
  return fc
    .array(safeWord, { minLength: targetWords, maxLength: targetWords })
    .map((words) => words.join(" "));
};

/**
 * Generate markdown content with specific visual elements
 * @param wordCount - Total word count for the content
 * @param boldCount - Number of bold text instances
 * @param blockquoteCount - Number of blockquote blocks
 * @param includeTOC - Whether to include a table of contents
 */
function createContentWithVisualElements(
  wordCount: number,
  boldCount: number,
  blockquoteCount: number,
  includeTOC: boolean
): string {
  const parts: string[] = [];
  
  // Add TOC if required
  if (includeTOC) {
    parts.push("## Table of Contents");
    parts.push("- [Section 1](#section-1)");
    parts.push("- [Section 2](#section-2)");
    parts.push("");
  }
  
  // Calculate words to distribute
  const tocWords = includeTOC ? 5 : 0; // "Table of Contents" + list items
  const blockquoteWords = blockquoteCount * 10; // ~10 words per blockquote
  const boldWords = boldCount * 2; // ~2 words per bold instance
  const remainingWords = Math.max(0, wordCount - tocWords - blockquoteWords - boldWords);
  
  // Distribute content
  const wordsPerSection = Math.floor(remainingWords / (blockquoteCount + boldCount + 1));
  
  // Add main heading
  parts.push("# Main Title");
  parts.push("");
  
  // Add content with bold text and blockquotes distributed throughout
  let boldAdded = 0;
  let blockquoteAdded = 0;
  
  const totalSections = boldCount + blockquoteCount;
  for (let i = 0; i < totalSections; i++) {
    // Add some regular content
    const sectionWords = Array(wordsPerSection).fill("word").join(" ");
    parts.push(sectionWords);
    parts.push("");
    
    // Alternate between adding bold text and blockquotes
    if (i % 2 === 0 && boldAdded < boldCount) {
      parts.push(`This is **important text** that should be highlighted.`);
      parts.push("");
      boldAdded++;
    } else if (blockquoteAdded < blockquoteCount) {
      parts.push("> This is a blockquote with important information.");
      parts.push("");
      blockquoteAdded++;
    }
  }
  
  // Add remaining bold text if needed
  while (boldAdded < boldCount) {
    parts.push(`Another **bold statement** here.`);
    parts.push("");
    boldAdded++;
  }
  
  // Add remaining blockquotes if needed
  while (blockquoteAdded < blockquoteCount) {
    parts.push("> Another important quote or callout.");
    parts.push("");
    blockquoteAdded++;
  }
  
  // Add remaining words to reach target
  const currentContent = parts.join(" ");
  const currentWordCount = currentContent.split(/\s+/).filter(w => w.length > 0).length;
  if (currentWordCount < wordCount) {
    const additionalWords = Array(wordCount - currentWordCount).fill("word").join(" ");
    parts.push(additionalWords);
  }
  
  return parts.join("\n");
}

// ── Property 24: Visual Element Validation ───────────────────────────────────

describe("ContentValidator - Visual Element Validation (Property 24)", () => {
  const validator = new ContentValidator();

  /**
   * **Validates: Requirements 8.4, 8.5, 8.7**
   *
   * For any blog post content, the validator SHALL correctly count bold text
   * occurrences (5-10 required), blockquotes (1 per 1000 words required), and
   * verify TOC presence for posts exceeding 2000 words.
   */

  it("validates content with bold text count within acceptable range (5-10)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2500, max: 4000 }), // Word count
        fc.integer({ min: 5, max: 10 }), // Bold count in valid range
        (wordCount, boldCount) => {
          const blockquoteCount = Math.floor(wordCount / 1000); // 1 per 1000 words
          const includeTOC = wordCount > 2000;
          
          const content = createContentWithVisualElements(
            wordCount,
            boldCount,
            blockquoteCount,
            includeTOC
          );

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

          const result = validator.validateBoldTextCount(post);

          // Should pass for bold text count in valid range
          expect(result.passed).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      PBT_CONFIG
    );
  });

  it("rejects content with bold text count below minimum (< 5)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2500, max: 4000 }), // Word count
        fc.integer({ min: 0, max: 4 }), // Bold count below minimum
        (wordCount, boldCount) => {
          const blockquoteCount = Math.floor(wordCount / 1000);
          const includeTOC = wordCount > 2000;
          
          const content = createContentWithVisualElements(
            wordCount,
            boldCount,
            blockquoteCount,
            includeTOC
          );

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

          const result = validator.validateBoldTextCount(post);

          // Should fail for bold text count below minimum
          expect(result.passed).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.errors[0]).toContain("below minimum 5");
        }
      ),
      PBT_CONFIG
    );
  });

  it("rejects content with bold text count above maximum (> 10)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2500, max: 4000 }), // Word count
        fc.integer({ min: 11, max: 20 }), // Bold count above maximum
        (wordCount, boldCount) => {
          const blockquoteCount = Math.floor(wordCount / 1000);
          const includeTOC = wordCount > 2000;
          
          const content = createContentWithVisualElements(
            wordCount,
            boldCount,
            blockquoteCount,
            includeTOC
          );

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

          const result = validator.validateBoldTextCount(post);

          // Should fail for bold text count above maximum
          expect(result.passed).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.errors[0]).toContain("exceeds maximum 10");
        }
      ),
      PBT_CONFIG
    );
  });

  it("validates content with correct blockquote count (1 per 1000 words)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2500, max: 4000 }), // Word count
        (wordCount) => {
          const boldCount = 7; // Valid bold count
          const blockquoteCount = Math.floor(wordCount / 1000); // Correct: 1 per 1000 words
          const includeTOC = wordCount > 2000;
          
          const content = createContentWithVisualElements(
            wordCount,
            boldCount,
            blockquoteCount,
            includeTOC
          );

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

          const result = validator.validateBlockquoteCount(post);

          // Should pass for correct blockquote count
          expect(result.passed).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      PBT_CONFIG
    );
  });

  it("rejects content with insufficient blockquotes (< 1 per 1000 words)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3000, max: 4000 }), // Word count - use 3000+ to ensure we need at least 3 blockquotes
        (targetWordCount) => {
          const boldCount = 7; // Valid bold count
          
          // Create content with exact word count using simple approach
          const words = Array(targetWordCount).fill("word").join(" ");
          const content = `# Main Title

${words}

**Bold 1** text here.
**Bold 2** text here.
**Bold 3** text here.
**Bold 4** text here.
**Bold 5** text here.
**Bold 6** text here.
**Bold 7** text here.

> Blockquote 1

> Blockquote 2
`;

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

          const result = validator.validateBlockquoteCount(post);

          // Should fail for insufficient blockquotes (2 blockquotes for 3000+ words which needs 3+)
          expect(result.passed).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.errors[0]).toContain("below minimum");
          expect(result.errors[0]).toContain("1 per 1000 words");
        }
      ),
      PBT_CONFIG
    );
  });

  it("validates TOC presence for posts exceeding 2000 words", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2001, max: 4000 }), // Word count > 2000
        (wordCount) => {
          const boldCount = 7; // Valid bold count
          const blockquoteCount = Math.floor(wordCount / 1000);
          const includeTOC = true; // Include TOC
          
          const content = createContentWithVisualElements(
            wordCount,
            boldCount,
            blockquoteCount,
            includeTOC
          );

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

          const result = validator.validateTOCPresence(post);

          // Should pass when TOC is present for posts > 2000 words
          expect(result.passed).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      PBT_CONFIG
    );
  });

  it("rejects posts exceeding 2000 words without TOC", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2001, max: 4000 }), // Word count > 2000
        (wordCount) => {
          const boldCount = 7; // Valid bold count
          const blockquoteCount = Math.floor(wordCount / 1000);
          
          // Create content with exact word count using simple approach
          const words = Array(wordCount).fill("word").join(" ");
          const content = `# Main Title

${words}

**Bold 1** text here.
**Bold 2** text here.
**Bold 3** text here.
**Bold 4** text here.
**Bold 5** text here.
**Bold 6** text here.
**Bold 7** text here.

${Array(blockquoteCount).fill(0).map((_, i) => `> Blockquote ${i + 1}`).join("\n\n")}
`;

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

          const result = validator.validateTOCPresence(post);

          // Should fail when TOC is missing for posts > 2000 words
          expect(result.passed).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.errors[0]).toContain("exceeds 2000 words");
          expect(result.errors[0]).toContain("missing Table of Contents");
        }
      ),
      PBT_CONFIG
    );
  });

  it("does not require TOC for posts with 2000 words or less", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 2000 }), // Word count <= 2000
        (wordCount) => {
          const boldCount = 7; // Valid bold count
          const blockquoteCount = Math.floor(wordCount / 1000);
          const includeTOC = false; // No TOC
          
          const content = createContentWithVisualElements(
            wordCount,
            boldCount,
            blockquoteCount,
            includeTOC
          );

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

          const result = validator.validateTOCPresence(post);

          // Should pass even without TOC for posts <= 2000 words
          expect(result.passed).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      PBT_CONFIG
    );
  });

  it("correctly counts bold text with different markdown styles (**text** and __text__)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2500, max: 4000 }), // Word count
        fc.integer({ min: 5, max: 10 }), // Bold count
        (wordCount, boldCount) => {
          const parts: string[] = [];
          
          // Add main content
          parts.push("# Main Title");
          parts.push("");
          
          // Add bold text using both ** and __ styles
          for (let i = 0; i < boldCount; i++) {
            const style = i % 2 === 0 ? "**" : "__";
            parts.push(`This is ${style}bold text ${i + 1}${style} in the content.`);
            parts.push("");
          }
          
          // Fill remaining words
          const currentWords = parts.join(" ").split(/\s+/).filter(w => w.length > 0).length;
          if (currentWords < wordCount) {
            const additionalWords = Array(wordCount - currentWords).fill("word").join(" ");
            parts.push(additionalWords);
          }
          
          const content = parts.join("\n");

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

          const result = validator.validateBoldTextCount(post);

          // Should correctly count both ** and __ styles
          expect(result.passed).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      PBT_CONFIG
    );
  });

  it("correctly counts multi-line blockquotes as single blocks", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2500, max: 4000 }), // Word count
        (wordCount) => {
          const boldCount = 7; // Valid bold count
          const expectedBlockquotes = Math.floor(wordCount / 1000);
          
          const parts: string[] = [];
          
          // Add main content
          parts.push("# Main Title");
          parts.push("");
          
          // Add multi-line blockquotes (consecutive lines count as one block)
          for (let i = 0; i < expectedBlockquotes; i++) {
            parts.push("> This is line 1 of blockquote " + (i + 1));
            parts.push("> This is line 2 of blockquote " + (i + 1));
            parts.push("> This is line 3 of blockquote " + (i + 1));
            parts.push("");
          }
          
          // Add bold text
          for (let i = 0; i < boldCount; i++) {
            parts.push(`This is **bold text ${i + 1}** in the content.`);
            parts.push("");
          }
          
          // Fill remaining words
          const currentWords = parts.join(" ").split(/\s+/).filter(w => w.length > 0).length;
          if (currentWords < wordCount) {
            const additionalWords = Array(wordCount - currentWords).fill("word").join(" ");
            parts.push(additionalWords);
          }
          
          const content = parts.join("\n");

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

          const result = validator.validateBlockquoteCount(post);

          // Should correctly count multi-line blockquotes as single blocks
          expect(result.passed).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      PBT_CONFIG
    );
  });

  it("recognizes TOC with anchor links format", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2001, max: 4000 }), // Word count > 2000
        (wordCount) => {
          const parts: string[] = [];
          
          // Add TOC with anchor links (alternative format)
          parts.push("## Contents");
          parts.push("- [Introduction](#introduction)");
          parts.push("- [Main Section](#main-section)");
          parts.push("- [Conclusion](#conclusion)");
          parts.push("");
          
          // Add main content
          parts.push("# Main Title");
          parts.push("");
          
          // Add required visual elements
          const boldCount = 7;
          const blockquoteCount = Math.floor(wordCount / 1000);
          
          for (let i = 0; i < boldCount; i++) {
            parts.push(`This is **bold text ${i + 1}** in the content.`);
            parts.push("");
          }
          
          for (let i = 0; i < blockquoteCount; i++) {
            parts.push(`> Blockquote ${i + 1}`);
            parts.push("");
          }
          
          // Fill remaining words
          const currentWords = parts.join(" ").split(/\s+/).filter(w => w.length > 0).length;
          if (currentWords < wordCount) {
            const additionalWords = Array(wordCount - currentWords).fill("word").join(" ");
            parts.push(additionalWords);
          }
          
          const content = parts.join("\n");

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

          const result = validator.validateTOCPresence(post);

          // Should recognize TOC with anchor links
          expect(result.passed).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      PBT_CONFIG
    );
  });

  it("validates all visual elements together for a complete post", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2500, max: 4000 }), // Word count
        fc.integer({ min: 5, max: 10 }), // Bold count
        (wordCount, boldCount) => {
          const blockquoteCount = Math.floor(wordCount / 1000);
          const includeTOC = wordCount > 2000;
          
          const content = createContentWithVisualElements(
            wordCount,
            boldCount,
            blockquoteCount,
            includeTOC
          );

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

          // Validate all visual elements
          const boldResult = validator.validateBoldTextCount(post);
          const blockquoteResult = validator.validateBlockquoteCount(post);
          const tocResult = validator.validateTOCPresence(post);

          // All validations should pass
          expect(boldResult.passed).toBe(true);
          expect(blockquoteResult.passed).toBe(true);
          expect(tocResult.passed).toBe(true);
        }
      ),
      PBT_CONFIG
    );
  });
});
