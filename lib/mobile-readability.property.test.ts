/**
 * Property-Based Tests for Mobile Readability Validation
 *
 * Property 23: Mobile Readability Validation
 * Validates: Requirements 8.1, 8.2, 8.3, 8.6
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

/** Generate a sentence (5-30 words) */
const sentenceArbitrary = fc
  .array(fc.string({ minLength: 3, maxLength: 10 }).filter((s) => /^[a-zA-Z]+$/.test(s)), {
    minLength: 5,
    maxLength: 30,
  })
  .map((words) => words.join(" ") + ".");

/** Generate a paragraph with specific sentence count */
const paragraphWithSentences = (sentenceCount: number) => {
  return fc
    .array(sentenceArbitrary, { minLength: sentenceCount, maxLength: sentenceCount })
    .map((sentences) => sentences.join(" "));
};

/** Generate a section with specific word count */
const sectionWithWordCount = (wordCount: number) => {
  return fc
    .array(fc.string({ minLength: 3, maxLength: 10 }).filter((s) => /^[a-zA-Z]+$/.test(s)), {
      minLength: wordCount,
      maxLength: wordCount,
    })
    .map((words) => words.join(" "));
};

/** Generate a list block (bullet or numbered) */
const listBlockArbitrary = fc.oneof(
  // Bullet list
  fc
    .array(fc.string({ minLength: 5, maxLength: 20 }), { minLength: 3, maxLength: 6 })
    .map((items) => items.map((item) => `- ${item}`).join("\n")),
  // Numbered list
  fc
    .array(fc.string({ minLength: 5, maxLength: 20 }), { minLength: 3, maxLength: 6 })
    .map((items) => items.map((item, i) => `${i + 1}. ${item}`).join("\n"))
);

/** Create a blog post with specific mobile readability characteristics */
function createBlogPost(content: string): BlogPost {
  return {
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
}

// ── Property 23: Mobile Readability Validation ───────────────────────────────

describe("ContentValidator - Mobile Readability Validation (Property 23)", () => {
  const validator = new ContentValidator();

  /**
   * **Validates: Requirements 8.1, 8.2, 8.3, 8.6**
   *
   * For any blog post content, the validator SHALL correctly identify violations
   * of mobile readability rules: paragraphs exceeding 5 sentences, sections
   * exceeding 400 words between headings, average sentence length exceeding 20
   * words, and insufficient lists (minimum 4).
   */

  // ── Requirement 8.1: Paragraph Length (max 5 sentences) ────────────────────

  describe("Paragraph Length Validation (Requirement 8.1)", () => {
    it("validates content with paragraphs within limit (≤5 sentences)", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }), // Sentences per paragraph
          fc.integer({ min: 5, max: 10 }), // Number of paragraphs
          (sentencesPerParagraph, paragraphCount) => {
            // Generate paragraphs with valid sentence count
            const paragraphs: string[] = [];
            for (let i = 0; i < paragraphCount; i++) {
              const words = Array(sentencesPerParagraph * 10).fill("word");
              const sentences = [];
              for (let j = 0; j < sentencesPerParagraph; j++) {
                sentences.push(words.slice(j * 10, (j + 1) * 10).join(" ") + ".");
              }
              paragraphs.push(sentences.join(" "));
            }

            const content = paragraphs.join("\n\n");
            const post = createBlogPost(content);

            const result = validator.validateParagraphLength(post);

            // Should pass for paragraphs with ≤5 sentences
            expect(result.passed).toBe(true);
            expect(result.errors).toHaveLength(0);
          }
        ),
        PBT_CONFIG
      );
    });

    it("rejects content with paragraphs exceeding 5 sentences", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 6, max: 15 }), // Sentences per paragraph (exceeds limit)
          fc.integer({ min: 1, max: 5 }), // Number of violating paragraphs
          (sentencesPerParagraph, violatingCount) => {
            // Generate paragraphs that violate the limit
            const paragraphs: string[] = [];
            for (let i = 0; i < violatingCount; i++) {
              const words = Array(sentencesPerParagraph * 10).fill("word");
              const sentences = [];
              for (let j = 0; j < sentencesPerParagraph; j++) {
                sentences.push(words.slice(j * 10, (j + 1) * 10).join(" ") + ".");
              }
              paragraphs.push(sentences.join(" "));
            }

            const content = paragraphs.join("\n\n");
            const post = createBlogPost(content);

            const result = validator.validateParagraphLength(post);

            // Should fail for paragraphs with >5 sentences
            expect(result.passed).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain("sentences");
            expect(result.errors[0]).toContain("max 5");
          }
        ),
        PBT_CONFIG
      );
    });

    it("correctly skips headings, lists, and code blocks when counting paragraphs", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }), // Valid sentences per paragraph
          (sentencesPerParagraph) => {
            // Create content with headings, lists, and code blocks mixed with paragraphs
            const validParagraph = Array(sentencesPerParagraph)
              .fill(0)
              .map((_, i) => `Sentence ${i + 1} with some words here.`)
              .join(" ");

            const content = `
# Main Heading

${validParagraph}

## Section Heading

- List item 1
- List item 2
- List item 3

${validParagraph}

\`\`\`
Code block content
\`\`\`

> Blockquote content

${validParagraph}

1. Numbered item 1
2. Numbered item 2

${validParagraph}
`;

            const post = createBlogPost(content);
            const result = validator.validateParagraphLength(post);

            // Should pass - only regular paragraphs are counted
            expect(result.passed).toBe(true);
            expect(result.errors).toHaveLength(0);
          }
        ),
        PBT_CONFIG
      );
    });
  });

  // ── Requirement 8.2: Section Length (max 400 words between headings) ───────

  describe("Section Length Validation (Requirement 8.2)", () => {
    it("validates content with sections within limit (≤400 words)", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 400 }), // Words per section
          fc.integer({ min: 3, max: 8 }), // Number of sections
          (wordsPerSection, sectionCount) => {
            // Generate sections with valid word count
            const sections: string[] = [];
            for (let i = 0; i < sectionCount; i++) {
              sections.push(`## Heading ${i + 1}`);
              sections.push(Array(wordsPerSection).fill("word").join(" "));
            }

            const content = sections.join("\n\n");
            const post = createBlogPost(content);

            const result = validator.validateSectionLength(post);

            // Should pass for sections with ≤400 words
            expect(result.passed).toBe(true);
            expect(result.errors).toHaveLength(0);
          }
        ),
        PBT_CONFIG
      );
    });

    it("rejects content with sections exceeding 400 words", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 401, max: 800 }), // Words per section (exceeds limit)
          fc.integer({ min: 1, max: 3 }), // Number of violating sections
          (wordsPerSection, violatingCount) => {
            // Generate sections that violate the limit
            const sections: string[] = [];
            for (let i = 0; i < violatingCount; i++) {
              sections.push(`## Heading ${i + 1}`);
              sections.push(Array(wordsPerSection).fill("word").join(" "));
            }

            const content = sections.join("\n\n");
            const post = createBlogPost(content);

            const result = validator.validateSectionLength(post);

            // Should fail for sections with >400 words
            expect(result.passed).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain("words");
            expect(result.errors[0]).toContain("max 400");
          }
        ),
        PBT_CONFIG
      );
    });

    it("correctly splits content by H2 and H3 headings", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 400 }), // Words per section
          (wordsPerSection) => {
            // Create content with mixed H2 and H3 headings
            const content = `
## Section 1

${Array(wordsPerSection).fill("word").join(" ")}

### Subsection 1.1

${Array(wordsPerSection).fill("word").join(" ")}

## Section 2

${Array(wordsPerSection).fill("word").join(" ")}

### Subsection 2.1

${Array(wordsPerSection).fill("word").join(" ")}
`;

            const post = createBlogPost(content);
            const result = validator.validateSectionLength(post);

            // Should pass - all sections are within limit
            expect(result.passed).toBe(true);
            expect(result.errors).toHaveLength(0);
          }
        ),
        PBT_CONFIG
      );
    });
  });

  // ── Requirement 8.3: Average Sentence Length (max 20 words) ────────────────

  describe("Average Sentence Length Validation (Requirement 8.3)", () => {
    it("validates content with average sentence length within limit (≤20 words)", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 20 }), // Words per sentence
          fc.integer({ min: 50, max: 100 }), // Number of sentences
          (wordsPerSentence, sentenceCount) => {
            // Generate sentences with valid word count
            const sentences: string[] = [];
            for (let i = 0; i < sentenceCount; i++) {
              sentences.push(Array(wordsPerSentence).fill("word").join(" ") + ".");
            }

            const content = sentences.join(" ");
            const post = createBlogPost(content);

            const result = validator.validateAverageSentenceLength(post);

            // Should pass for average sentence length ≤20 words
            expect(result.passed).toBe(true);
            expect(result.errors).toHaveLength(0);
          }
        ),
        PBT_CONFIG
      );
    });

    it("rejects content with average sentence length exceeding 20 words", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 21, max: 40 }), // Words per sentence (exceeds limit)
          fc.integer({ min: 50, max: 100 }), // Number of sentences
          (wordsPerSentence, sentenceCount) => {
            // Generate sentences that violate the limit
            const sentences: string[] = [];
            for (let i = 0; i < sentenceCount; i++) {
              sentences.push(Array(wordsPerSentence).fill("word").join(" ") + ".");
            }

            const content = sentences.join(" ");
            const post = createBlogPost(content);

            const result = validator.validateAverageSentenceLength(post);

            // Should fail for average sentence length >20 words
            expect(result.passed).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain("Average sentence length");
            expect(result.errors[0]).toContain("exceeds maximum 20 words");
          }
        ),
        PBT_CONFIG
      );
    });

    it("correctly handles mixed sentence lengths", () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 5, max: 20 }), { minLength: 50, maxLength: 100 }),
          (sentenceLengths) => {
            // Generate sentences with varying lengths, all within limit
            const sentences = sentenceLengths.map((length) =>
              Array(length).fill("word").join(" ") + "."
            );

            const content = sentences.join(" ");
            const post = createBlogPost(content);

            const result = validator.validateAverageSentenceLength(post);

            // Calculate expected average
            const totalWords = sentenceLengths.reduce((sum, len) => sum + len, 0);
            const avgLength = totalWords / sentenceLengths.length;

            // Should pass if average is ≤20
            if (avgLength <= 20) {
              expect(result.passed).toBe(true);
              expect(result.errors).toHaveLength(0);
            } else {
              expect(result.passed).toBe(false);
            }
          }
        ),
        PBT_CONFIG
      );
    });

    it("correctly removes markdown formatting before calculating", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 20 }), // Words per sentence
          fc.integer({ min: 50, max: 100 }), // Number of sentences
          fc.constantFrom("**", "*", "_", "~~", "`"), // Markdown formatting
          (wordsPerSentence, sentenceCount, formatting) => {
            // Generate sentences with markdown formatting
            const sentences: string[] = [];
            for (let i = 0; i < sentenceCount; i++) {
              const words = Array(wordsPerSentence).fill("word");
              // Format every 3rd word
              const formattedWords = words.map((w, idx) =>
                idx % 3 === 0 ? `${formatting}${w}${formatting}` : w
              );
              sentences.push(formattedWords.join(" ") + ".");
            }

            const content = sentences.join(" ");
            const post = createBlogPost(content);

            const result = validator.validateAverageSentenceLength(post);

            // Should pass - markdown formatting should be removed before counting
            expect(result.passed).toBe(true);
            expect(result.errors).toHaveLength(0);
          }
        ),
        PBT_CONFIG
      );
    });

    it("handles different sentence terminators (. ! ?)", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 5, max: 20 }), // Words per sentence
          fc.integer({ min: 50, max: 100 }), // Number of sentences
          (wordsPerSentence, sentenceCount) => {
            // Generate sentences with different terminators
            const terminators = [".", "!", "?"];
            const sentences: string[] = [];
            for (let i = 0; i < sentenceCount; i++) {
              const terminator = terminators[i % terminators.length];
              sentences.push(Array(wordsPerSentence).fill("word").join(" ") + terminator);
            }

            const content = sentences.join(" ");
            const post = createBlogPost(content);

            const result = validator.validateAverageSentenceLength(post);

            // Should pass for average sentence length ≤20 words
            expect(result.passed).toBe(true);
            expect(result.errors).toHaveLength(0);
          }
        ),
        PBT_CONFIG
      );
    });
  });

  // ── Requirement 8.6: List Count (minimum 4 lists) ──────────────────────────

  describe("List Count Validation (Requirement 8.6)", () => {
    it("validates content with sufficient lists (≥4)", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 4, max: 10 }), // Number of list blocks
          (listCount) => {
            // Generate content with sufficient list blocks
            const lists: string[] = [];
            for (let i = 0; i < listCount; i++) {
              // Alternate between bullet and numbered lists
              if (i % 2 === 0) {
                lists.push(`- Item ${i + 1}a\n- Item ${i + 1}b\n- Item ${i + 1}c`);
              } else {
                lists.push(`1. Item ${i + 1}a\n2. Item ${i + 1}b\n3. Item ${i + 1}c`);
              }
              lists.push("\n\nSome paragraph text between lists.\n\n");
            }

            const content = lists.join("");
            const post = createBlogPost(content);

            const result = validator.validateListCount(post);

            // Should pass for ≥4 list blocks
            expect(result.passed).toBe(true);
            expect(result.errors).toHaveLength(0);
          }
        ),
        PBT_CONFIG
      );
    });

    it("rejects content with insufficient lists (<4)", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 3 }), // Number of list blocks (below minimum)
          (listCount) => {
            // Generate content with insufficient list blocks
            const lists: string[] = [];
            for (let i = 0; i < listCount; i++) {
              lists.push(`- Item ${i + 1}a\n- Item ${i + 1}b\n- Item ${i + 1}c`);
              lists.push("\n\nSome paragraph text between lists.\n\n");
            }

            const content = lists.join("") + "\n\nAdditional paragraph content without lists.";
            const post = createBlogPost(content);

            const result = validator.validateListCount(post);

            // Should fail for <4 list blocks
            expect(result.passed).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain("List count");
            expect(result.errors[0]).toContain("below minimum 4");
          }
        ),
        PBT_CONFIG
      );
    });

    it("correctly counts both bullet and numbered lists", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 5 }), // Bullet lists
          fc.integer({ min: 2, max: 5 }), // Numbered lists
          (bulletCount, numberedCount) => {
            const lists: string[] = [];

            // Add bullet lists
            for (let i = 0; i < bulletCount; i++) {
              lists.push(`- Bullet item ${i + 1}a\n- Bullet item ${i + 1}b`);
              lists.push("\n\nParagraph text.\n\n");
            }

            // Add numbered lists
            for (let i = 0; i < numberedCount; i++) {
              lists.push(`1. Numbered item ${i + 1}a\n2. Numbered item ${i + 1}b`);
              lists.push("\n\nParagraph text.\n\n");
            }

            const content = lists.join("");
            const post = createBlogPost(content);

            const result = validator.validateListCount(post);

            const totalLists = bulletCount + numberedCount;

            // Should pass if total ≥4
            if (totalLists >= 4) {
              expect(result.passed).toBe(true);
              expect(result.errors).toHaveLength(0);
            } else {
              expect(result.passed).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
            }
          }
        ),
        PBT_CONFIG
      );
    });

    it("correctly treats consecutive list items as one list block", () => {
      const content = `
# Main Heading

Some introductory text.

- Item 1
- Item 2
- Item 3
- Item 4
- Item 5

More text here.

1. First item
2. Second item
3. Third item

Another paragraph.

- Another list item 1
- Another list item 2

Final paragraph.

1. Final list item 1
2. Final list item 2
3. Final list item 3
`;

      const post = createBlogPost(content);
      const result = validator.validateListCount(post);

      // Should pass - 4 distinct list blocks
      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("handles mixed list markers (-, *, +)", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 4, max: 8 }), // Number of list blocks
          (listCount) => {
            const markers = ["-", "*", "+"];
            const lists: string[] = [];

            for (let i = 0; i < listCount; i++) {
              const marker = markers[i % markers.length];
              lists.push(`${marker} Item ${i + 1}a\n${marker} Item ${i + 1}b`);
              lists.push("\n\nParagraph text.\n\n");
            }

            const content = lists.join("");
            const post = createBlogPost(content);

            const result = validator.validateListCount(post);

            // Should pass - all list markers are valid
            expect(result.passed).toBe(true);
            expect(result.errors).toHaveLength(0);
          }
        ),
        PBT_CONFIG
      );
    });
  });

  // ── Combined Mobile Readability Tests ──────────────────────────────────────

  describe("Combined Mobile Readability Validation", () => {
    it("validates content that passes all mobile readability rules", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 5 }), // Sentences per paragraph
          fc.integer({ min: 100, max: 400 }), // Words per section
          fc.integer({ min: 5, max: 20 }), // Words per sentence
          fc.integer({ min: 4, max: 8 }), // Number of lists
          (sentencesPerPara, wordsPerSection, wordsPerSentence, listCount) => {
            // Build content that satisfies all rules
            const parts: string[] = [];

            // Add sections with headings
            for (let i = 0; i < 3; i++) {
              parts.push(`## Section ${i + 1}`);

              // Add paragraphs with valid sentence count
              const sentences = [];
              for (let j = 0; j < sentencesPerPara; j++) {
                sentences.push(Array(wordsPerSentence).fill("word").join(" ") + ".");
              }
              parts.push(sentences.join(" "));
              parts.push("");
            }

            // Add lists
            for (let i = 0; i < listCount; i++) {
              if (i % 2 === 0) {
                parts.push(`- List ${i + 1} item a\n- List ${i + 1} item b`);
              } else {
                parts.push(`1. List ${i + 1} item a\n2. List ${i + 1} item b`);
              }
              parts.push("");
            }

            const content = parts.join("\n\n");
            const post = createBlogPost(content);

            // Test all mobile readability validators
            const paragraphResult = validator.validateParagraphLength(post);
            const sectionResult = validator.validateSectionLength(post);
            const sentenceResult = validator.validateAverageSentenceLength(post);
            const listResult = validator.validateListCount(post);

            // All should pass
            expect(paragraphResult.passed).toBe(true);
            expect(sectionResult.passed).toBe(true);
            expect(sentenceResult.passed).toBe(true);
            expect(listResult.passed).toBe(true);
          }
        ),
        PBT_CONFIG
      );
    });

    it("correctly identifies multiple mobile readability violations", () => {
      // Create content that violates all rules
      const longParagraph = Array(10)
        .fill(0)
        .map((_, i) => `Sentence ${i + 1} with some words.`)
        .join(" "); // >5 sentences

      const longSection = Array(500).fill("word").join(" "); // >400 words

      const longSentences = Array(50)
        .fill(0)
        .map(() => Array(30).fill("word").join(" ") + ".") // 30 words per sentence
        .join(" ");

      const content = `
# Main Heading

${longParagraph}

## Section Without Enough Headings

${longSection}

${longSentences}

- Only one list here
`;

      const post = createBlogPost(content);

      // Test all mobile readability validators
      const paragraphResult = validator.validateParagraphLength(post);
      const sectionResult = validator.validateSectionLength(post);
      const sentenceResult = validator.validateAverageSentenceLength(post);
      const listResult = validator.validateListCount(post);

      // All should fail
      expect(paragraphResult.passed).toBe(false);
      expect(sectionResult.passed).toBe(false);
      expect(sentenceResult.passed).toBe(false);
      expect(listResult.passed).toBe(false);
    });
  });
});
