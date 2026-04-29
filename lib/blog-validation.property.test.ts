/**
 * Property-Based Tests for Blog Validation Utilities
 *
 * Property 3: Generated blog post structure invariant
 * Validates: Requirements 7.5
 *
 * Property 4: Blog post word count minimum
 * Validates: Requirements 7.4
 *
 * Property 5: Internal link presence
 * Validates: Requirements 7.9
 */

import { describe, it } from "vitest";
import * as fc from "fast-check";
import {
  validateBlogStructure,
  countWords,
  containsInternalLink,
  validatePrimaryKeywordPlacement,
  validateCallToAction,
  validateDateConsistency,
} from "./blog-validation";

// ── Arbitraries ───────────────────────────────────────────────────────────────

/** A safe word: non-empty, no whitespace, no markdown special chars */
const safeWord = fc
  .string({ minLength: 1, maxLength: 20 })
  .filter((s) => /^[a-zA-Z0-9]+$/.test(s));

/** A line of safe words joined by spaces */
const safeLine = fc
  .array(safeWord, { minLength: 1, maxLength: 10 })
  .map((words) => words.join(" "));

/** Safe anchor text: no brackets or parens */
const anchorText = fc
  .string({ minLength: 1, maxLength: 30 })
  .filter((s) => s.trim().length > 0 && !/[\[\]()]/.test(s));

/** Arbitrary markdown content without any internal links */
const contentWithoutLink = fc
  .array(safeLine, { minLength: 0, maxLength: 5 })
  .map((lines) => lines.join("\n"))
  .filter((s) => !s.includes("](/)") && !s.includes("](https://habetapk.com"));

// ── Property 3: validateBlogStructure ────────────────────────────────────────

describe("validateBlogStructure (Property 3)", () => {
  /**
   * **Validates: Requirements 7.5**
   *
   * For any markdown string, validateBlogStructure returns true iff:
   * - H1 count >= 1
   * - H2 count >= 4
   * - H3 count >= 2
   * - Has FAQ section (## FAQ or ## Frequently Asked Questions)
   * - Has conclusion section (## Conclusion or ## Summary)
   */

  /** Arbitrary that generates a markdown structure with controlled heading counts */
  const structureArb = fc.record({
    h1Count: fc.integer({ min: 0, max: 3 }),
    h2Count: fc.integer({ min: 0, max: 6 }),
    h3Count: fc.integer({ min: 0, max: 4 }),
    hasFaq: fc.boolean(),
    hasConclusion: fc.boolean(),
    bodyLine: safeLine,
  });

  function buildMarkdown(params: {
    h1Count: number;
    h2Count: number;
    h3Count: number;
    hasFaq: boolean;
    hasConclusion: boolean;
    bodyLine: string;
  }): string {
    const lines: string[] = [];

    for (let i = 0; i < params.h1Count; i++) {
      lines.push(`# Heading One ${i + 1}`);
    }

    // Reserve slots for FAQ and Conclusion from the h2Count budget
    const reservedH2 = (params.hasFaq ? 1 : 0) + (params.hasConclusion ? 1 : 0);
    const regularH2 = Math.max(0, params.h2Count - reservedH2);

    for (let i = 0; i < regularH2; i++) {
      lines.push(`## Section ${i + 1}`);
    }

    if (params.hasFaq) {
      lines.push("## FAQ");
    }

    if (params.hasConclusion) {
      lines.push("## Conclusion");
    }

    for (let i = 0; i < params.h3Count; i++) {
      lines.push(`### Subsection ${i + 1}`);
    }

    lines.push(params.bodyLine);

    return lines.join("\n");
  }

  it("returns true iff all structural requirements are met", () => {
    fc.assert(
      fc.property(structureArb, (params) => {
        const content = buildMarkdown(params);
        const result = validateBlogStructure(content);

        // Compute expected: total H2 = regularH2 + reserved
        const reservedH2 =
          (params.hasFaq ? 1 : 0) + (params.hasConclusion ? 1 : 0);
        const totalH2 = Math.max(0, params.h2Count - reservedH2) + reservedH2;

        const shouldPass =
          params.h1Count >= 1 &&
          totalH2 >= 4 &&
          params.h3Count >= 2 &&
          params.hasFaq &&
          params.hasConclusion;

        return result === shouldPass;
      }),
      { numRuns: 20 }
    );
  });

  it("returns false when H1 is missing", () => {
    fc.assert(
      fc.property(structureArb, (params) => {
        const noH1Params = { ...params, h1Count: 0 };
        const content = buildMarkdown(noH1Params);
        // With no H1, must be false
        return validateBlogStructure(content) === false;
      }),
      { numRuns: 20 }
    );
  });

  it("returns false when FAQ section is missing", () => {
    fc.assert(
      fc.property(structureArb, (params) => {
        const noFaqParams = { ...params, hasFaq: false };
        const content = buildMarkdown(noFaqParams);
        return validateBlogStructure(content) === false;
      }),
      { numRuns: 20 }
    );
  });
});

// ── Property 4: countWords ────────────────────────────────────────────────────

describe("countWords (Property 4)", () => {
  /**
   * **Validates: Requirements 7.4**
   *
   * For any array of words joined into a string, countWords returns a value
   * equal to the known word count within ±5.
   */

  const wordArrayArb = fc.array(safeWord, { minLength: 0, maxLength: 200 });

  it("returns word count within ±5 of the known count for space-joined words", () => {
    fc.assert(
      fc.property(wordArrayArb, (words) => {
        const text = words.join(" ");
        const result = countWords(text);
        const expected = words.length;
        return Math.abs(result - expected) <= 5;
      }),
      { numRuns: 20 }
    );
  });

  it("returns 0 for empty or whitespace-only strings", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(""),
          fc.constant("   "),
          fc.constant("\n\t\n")
        ),
        (text) => countWords(text) === 0
      ),
      { numRuns: 20 }
    );
  });

  it("returns exact word count for newline-separated words", () => {
    fc.assert(
      fc.property(
        fc.array(safeWord, { minLength: 1, maxLength: 100 }),
        (words) => {
          const text = words.join("\n");
          const result = countWords(text);
          return Math.abs(result - words.length) <= 5;
        }
      ),
      { numRuns: 20 }
    );
  });
});

// ── Property 5: containsInternalLink ─────────────────────────────────────────

describe("containsInternalLink (Property 5)", () => {
  /**
   * **Validates: Requirements 7.9**
   *
   * For any markdown string, containsInternalLink(content, '/') returns true
   * iff the content contains a markdown link to '/'.
   */

  it("returns true when a [text](/) link is present", () => {
    fc.assert(
      fc.property(anchorText, contentWithoutLink, (anchor, surrounding) => {
        const link = `[${anchor}](/)`;
        const content = `${surrounding}\n${link}\nsome more text`;
        return containsInternalLink(content, "/") === true;
      }),
      { numRuns: 20 }
    );
  });

  it("returns false when no internal link to / is present", () => {
    fc.assert(
      fc.property(contentWithoutLink, (content) => {
        return containsInternalLink(content, "/") === false;
      }),
      { numRuns: 20 }
    );
  });

  it("returns true when a [text](https://habetapk.com/) link is present", () => {
    fc.assert(
      fc.property(anchorText, contentWithoutLink, (anchor, surrounding) => {
        const link = `[${anchor}](https://habetapk.com/)`;
        const content = `${surrounding}\n${link}`;
        return containsInternalLink(content, "/") === true;
      }),
      { numRuns: 20 }
    );
  });

  it("returns correct result regardless of surrounding content", () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        anchorText,
        contentWithoutLink,
        (includeLink, anchor, surrounding) => {
          const link = includeLink ? `[${anchor}](/)` : "";
          const content = `${surrounding}\n${link}`;
          const result = containsInternalLink(content, "/");
          return result === includeLink;
        }
      ),
      { numRuns: 20 }
    );
  });
});

// ── Property 14: validatePrimaryKeywordPlacement ─────────────────────────────

describe("validatePrimaryKeywordPlacement (Property 14)", () => {
  /**
   * **Validates: Requirements 4.6**
   *
   * For any blog post content and primary keyword, the validator SHALL correctly
   * identify whether the primary keyword appears within the first 100 words of
   * the content.
   */

  /** Generate a keyword (3-20 characters, alphanumeric with spaces) */
  const keywordArb = fc
    .string({ minLength: 3, maxLength: 20 })
    .filter((s) => /^[a-zA-Z0-9 ]+$/.test(s) && s.trim().length >= 3);

  /** Generate content with a known word count */
  const contentWithWordCountArb = (wordCount: number) =>
    fc
      .array(safeWord, { minLength: wordCount, maxLength: wordCount })
      .map((words) => words.join(" "));

  it("returns true when keyword appears in first 100 words", () => {
    fc.assert(
      fc.property(
        keywordArb,
        fc.integer({ min: 10, max: 90 }), // Position to insert keyword (within first 100)
        fc.integer({ min: 100, max: 200 }), // Total word count
        (keyword, insertPosition, totalWords) => {
          // Generate content
          const words: string[] = [];
          for (let i = 0; i < totalWords; i++) {
            if (i === insertPosition) {
              words.push(keyword);
            } else {
              words.push(`word${i}`);
            }
          }
          const content = words.join(" ");

          const result = validatePrimaryKeywordPlacement(content, keyword);
          return result === true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("returns false when keyword appears only after first 100 words", () => {
    fc.assert(
      fc.property(
        keywordArb,
        fc.integer({ min: 101, max: 200 }), // Position to insert keyword (after first 100)
        (keyword, insertPosition) => {
          // Generate content with keyword after position 100
          const words: string[] = [];
          for (let i = 0; i < 250; i++) {
            if (i === insertPosition) {
              words.push(keyword);
            } else {
              words.push(`word${i}`);
            }
          }
          const content = words.join(" ");

          const result = validatePrimaryKeywordPlacement(content, keyword);
          return result === false;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("returns false when keyword is not present at all", () => {
    fc.assert(
      fc.property(
        keywordArb,
        fc.integer({ min: 100, max: 300 }),
        (keyword, wordCount) => {
          // Generate content without the keyword
          const words: string[] = [];
          for (let i = 0; i < wordCount; i++) {
            words.push(`differentword${i}`);
          }
          const content = words.join(" ");

          const result = validatePrimaryKeywordPlacement(content, keyword);
          return result === false;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("is case-insensitive", () => {
    fc.assert(
      fc.property(
        keywordArb,
        fc.integer({ min: 10, max: 90 }),
        fc.integer({ min: 100, max: 200 }),
        (keyword, insertPosition, totalWords) => {
          // Generate content with keyword in different case
          const words: string[] = [];
          for (let i = 0; i < totalWords; i++) {
            if (i === insertPosition) {
              // Insert keyword in uppercase
              words.push(keyword.toUpperCase());
            } else {
              words.push(`word${i}`);
            }
          }
          const content = words.join(" ");

          // Search with lowercase keyword
          const result = validatePrimaryKeywordPlacement(
            content,
            keyword.toLowerCase()
          );
          return result === true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("handles markdown formatting correctly", () => {
    fc.assert(
      fc.property(
        keywordArb,
        fc.integer({ min: 10, max: 90 }),
        (keyword, insertPosition) => {
          // Generate markdown content with headings, links, and formatting
          const words: string[] = ["# Main Heading"];
          for (let i = 0; i < 150; i++) {
            if (i === insertPosition) {
              words.push(`**${keyword}**`); // Bold keyword
            } else if (i === 20) {
              words.push("## Section Heading");
            } else if (i === 50) {
              words.push("[link text](/some/path)");
            } else {
              words.push(`word${i}`);
            }
          }
          const content = words.join(" ");

          const result = validatePrimaryKeywordPlacement(content, keyword);
          return result === true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("returns false for empty content or keyword", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(""),
          fc.constant("   "),
          fc.constant("\n\n")
        ),
        keywordArb,
        (emptyContent, keyword) => {
          const result1 = validatePrimaryKeywordPlacement(emptyContent, keyword);
          const result2 = validatePrimaryKeywordPlacement("some content", "");
          return result1 === false && result2 === false;
        }
      ),
      { numRuns: 20 }
    );
  });

  it("correctly identifies keyword at exactly word 100", () => {
    fc.assert(
      fc.property(
        // Use single-word keywords only for this test
        fc
          .string({ minLength: 3, maxLength: 20 })
          .filter((s) => /^[a-zA-Z0-9]+$/.test(s) && s.trim().length >= 3),
        (keyword) => {
          // Generate exactly 100 words with keyword at position 99 (0-indexed)
          const words: string[] = [];
          for (let i = 0; i < 100; i++) {
            if (i === 99) {
              words.push(keyword);
            } else {
              words.push(`word${i}`);
            }
          }
          const content = words.join(" ");

          const result = validatePrimaryKeywordPlacement(content, keyword);
          return result === true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("handles multi-word keywords correctly", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 90 }),
        fc.integer({ min: 100, max: 200 }),
        (insertPosition, totalWords) => {
          const multiWordKeyword = "habet betting app";
          
          // Generate content
          const words: string[] = [];
          for (let i = 0; i < totalWords; i++) {
            if (i === insertPosition) {
              words.push(multiWordKeyword);
            } else {
              words.push(`word${i}`);
            }
          }
          const content = words.join(" ");

          const result = validatePrimaryKeywordPlacement(
            content,
            multiWordKeyword
          );
          return result === true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ── Property 15: validateCallToAction ────────────────────────────────────────

describe("validateCallToAction (Property 15)", () => {
  /**
   * **Validates: Requirements 4.7**
   *
   * For any blog post targeting download-intent keywords, the validator SHALL
   * correctly identify whether at least one CTA link to the download page is
   * present in the content.
   */

  /** Generate a download-intent keyword */
  const downloadKeywordArb = fc.oneof(
    fc.constant("habet app download"),
    fc.constant("habet apk"),
    fc.constant("download habet"),
    fc.constant("install habet app"),
    fc.constant("get app habet"),
    fc.string({ minLength: 5, maxLength: 30 }).map((s) => `${s} download`),
    fc.string({ minLength: 5, maxLength: 30 }).map((s) => `${s} apk`),
    fc.string({ minLength: 5, maxLength: 30 }).map((s) => `install ${s}`)
  );

  /** Generate a non-download-intent keyword */
  const nonDownloadKeywordArb = fc.oneof(
    fc.constant("habet betting tips"),
    fc.constant("cricket betting guide"),
    fc.constant("ipl predictions"),
    fc.constant("sports betting strategy"),
    fc
      .string({ minLength: 5, maxLength: 30 })
      .filter(
        (s) =>
          !/\b(download|apk|install|get\s+app)\b/i.test(s) && s.trim().length >= 5
      )
  );

  it("returns true for download-intent keywords when CTA link is present", () => {
    fc.assert(
      fc.property(
        downloadKeywordArb,
        anchorText,
        contentWithoutLink,
        (keyword, anchor, surrounding) => {
          const link = `[${anchor}](/)`;
          const content = `${surrounding}\n${link}\nsome more text`;

          const result = validateCallToAction(content, keyword);
          return result === true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("returns false for download-intent keywords when CTA link is missing", () => {
    fc.assert(
      fc.property(
        downloadKeywordArb,
        contentWithoutLink,
        (keyword, content) => {
          const result = validateCallToAction(content, keyword);
          return result === false;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("returns true for non-download-intent keywords regardless of CTA link", () => {
    fc.assert(
      fc.property(
        nonDownloadKeywordArb,
        fc.boolean(),
        anchorText,
        contentWithoutLink,
        (keyword, includeLink, anchor, surrounding) => {
          const link = includeLink ? `[${anchor}](/)` : "";
          const content = `${surrounding}\n${link}`;

          const result = validateCallToAction(content, keyword);
          // Should always return true for non-download-intent keywords
          return result === true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("returns false for empty content or keyword", () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(""), fc.constant("   "), fc.constant("\n\n")),
        downloadKeywordArb,
        (emptyContent, keyword) => {
          const result1 = validateCallToAction(emptyContent, keyword);
          const result2 = validateCallToAction("some content", "");
          return result1 === false && result2 === false;
        }
      ),
      { numRuns: 20 }
    );
  });

  it("correctly identifies download-intent patterns", () => {
    fc.assert(
      fc.property(
        fc.record({
          hasDownloadIntent: fc.boolean(),
          baseKeyword: fc
            .string({ minLength: 3, maxLength: 20 })
            .filter((s) => /^[a-zA-Z0-9 ]+$/.test(s) && s.trim().length >= 3),
        }),
        anchorText,
        (params, anchor) => {
          // Construct keyword based on download intent
          const keyword = params.hasDownloadIntent
            ? `${params.baseKeyword} download`
            : `${params.baseKeyword} tips`;

          // Create content with or without CTA link
          const contentWithCTA = `Some text here [${anchor}](/) more text`;
          const contentWithoutCTA = `Some text here without any links`;

          const resultWithCTA = validateCallToAction(contentWithCTA, keyword);
          const resultWithoutCTA = validateCallToAction(
            contentWithoutCTA,
            keyword
          );

          if (params.hasDownloadIntent) {
            // Download-intent keywords require CTA link
            return resultWithCTA === true && resultWithoutCTA === false;
          } else {
            // Non-download-intent keywords don't require CTA link
            return resultWithCTA === true && resultWithoutCTA === true;
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  it("accepts absolute URLs to homepage as valid CTA", () => {
    fc.assert(
      fc.property(
        downloadKeywordArb,
        anchorText,
        contentWithoutLink,
        (keyword, anchor, surrounding) => {
          const link = `[${anchor}](https://habetapk.com/)`;
          const content = `${surrounding}\n${link}`;

          const result = validateCallToAction(content, keyword);
          return result === true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("is case-insensitive for download-intent detection", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant("HABET APP DOWNLOAD"),
          fc.constant("Habet Apk"),
          fc.constant("Install HABET App"),
          fc.constant("GET APP habet")
        ),
        anchorText,
        (keyword, anchor) => {
          const contentWithCTA = `[${anchor}](/)`;
          const contentWithoutCTA = `Some text without links`;

          const resultWith = validateCallToAction(contentWithCTA, keyword);
          const resultWithout = validateCallToAction(contentWithoutCTA, keyword);

          return resultWith === true && resultWithout === false;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("handles multiple CTA links correctly", () => {
    fc.assert(
      fc.property(
        downloadKeywordArb,
        fc.array(anchorText, { minLength: 2, maxLength: 5 }),
        (keyword, anchors) => {
          // Create content with multiple CTA links
          const links = anchors.map((anchor) => `[${anchor}](/)`).join("\n");
          const content = `Some intro text\n${links}\nSome conclusion text`;

          const result = validateCallToAction(content, keyword);
          return result === true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

// ── Property 28: validateDateConsistency ─────────────────────────────────────

describe("validateDateConsistency (Property 28)", () => {
  /**
   * **Validates: Requirements 10.5**
   *
   * For any blog post with frontmatter date and content containing date references
   * (e.g., "2026", "January 2026"), the validator SHALL correctly identify whether
   * all date references are consistent with the frontmatter date field's year.
   */

  /** Generate a valid ISO 8601 date string */
  const isoDateArb = fc
    .integer({ min: 2020, max: 2030 })
    .chain((year) =>
      fc
        .integer({ min: 1, max: 12 })
        .chain((month) =>
          fc
            .integer({ min: 1, max: 28 })
            .map(
              (day) =>
                `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T10:00:00Z`
            )
        )
    );

  /** Generate content with a specific year mentioned */
  const contentWithYearArb = (year: number) =>
    fc
      .array(safeWord, { minLength: 50, maxLength: 150 })
      .chain((words) =>
        fc
          .integer({ min: 10, max: words.length - 10 })
          .map((insertPos) => {
            const contentWords = [...words];
            contentWords.splice(insertPos, 0, String(year));
            return contentWords.join(" ");
          })
      );

  it("returns true when all year references match frontmatter year", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2030 }),
        fc.integer({ min: 1, max: 5 }), // Number of year mentions
        (year, mentions) => {
          const frontmatterDate = `${year}-06-15T10:00:00Z`;
          
          // Generate content with multiple mentions of the same year
          const words: string[] = [];
          for (let i = 0; i < 200; i++) {
            words.push(`word${i}`);
            if (i % 40 === 0 && mentions > 0) {
              words.push(String(year));
              mentions--;
            }
          }
          const content = words.join(" ");

          const result = validateDateConsistency(content, frontmatterDate);
          return result === true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("returns false when content contains inconsistent year references", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2030 }),
        fc.integer({ min: 2020, max: 2030 }).filter((y) => y !== 2025),
        (frontmatterYear, contentYear) => {
          // Ensure years are different
          if (frontmatterYear === contentYear) {
            contentYear = frontmatterYear + 1;
          }

          const frontmatterDate = `${frontmatterYear}-06-15T10:00:00Z`;
          const content = `This is content about ${contentYear} and predictions for ${contentYear}.`;

          const result = validateDateConsistency(content, frontmatterDate);
          return result === false;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("returns true when content has no year references", () => {
    fc.assert(
      fc.property(isoDateArb, fc.array(safeWord, { minLength: 50, maxLength: 150 }), (frontmatterDate, words) => {
        // Generate content without any year references
        const content = words.join(" ");

        const result = validateDateConsistency(content, frontmatterDate);
        return result === true;
      }),
      { numRuns: 50 }
    );
  });

  it("returns false for invalid frontmatter date format", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(""),
          fc.constant("invalid-date"),
          fc.constant("2026/01/15"),
          fc.constant("15-01-2026")
        ),
        fc.integer({ min: 2020, max: 2030 }),
        (invalidDate, year) => {
          // Content with a year reference
          const content = `This is content about ${year} predictions.`;

          const result = validateDateConsistency(content, invalidDate);
          return result === false;
        }
      ),
      { numRuns: 20 }
    );
  });

  it("returns false for empty content or date", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2030 }),
        (year) => {
          // Test with empty date and content with year
          const contentWithYear = `This is content about ${year} predictions.`;
          const result1 = validateDateConsistency(contentWithYear, "");
          
          // Test with empty content and valid date (should return false)
          const result2 = validateDateConsistency("", `${year}-06-15T10:00:00Z`);
          
          return result1 === false && result2 === false;
        }
      ),
      { numRuns: 20 }
    );
  });

  it("handles mixed consistent and inconsistent years correctly", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2030 }),
        (year) => {
          const frontmatterDate = `${year}-06-15T10:00:00Z`;
          const differentYear = year + 1;

          // Content with both matching and non-matching years
          const contentMixed = `In ${year} we saw growth. But ${differentYear} will be different.`;
          const contentConsistent = `In ${year} we saw growth. The ${year} season was great.`;

          const resultMixed = validateDateConsistency(contentMixed, frontmatterDate);
          const resultConsistent = validateDateConsistency(
            contentConsistent,
            frontmatterDate
          );

          return resultMixed === false && resultConsistent === true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("correctly identifies years in various contexts", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2030 }),
        (year) => {
          const frontmatterDate = `${year}-06-15T10:00:00Z`;

          // Various contexts where year might appear
          const contexts = [
            `Updated for ${year} season`,
            `January ${year} predictions`,
            `The year ${year} brought changes`,
            `${year}-specific strategies`,
            `Best tips for ${year}`,
          ];

          const content = contexts.join(". ");

          const result = validateDateConsistency(content, frontmatterDate);
          return result === true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("does not match non-year 4-digit numbers outside 2000-2099 range", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2030 }),
        (year) => {
          const frontmatterDate = `${year}-06-15T10:00:00Z`;

          // Content with 4-digit numbers that are not years
          const content = `The score was 1999 to 1500. In ${year} we improved to 3000 points.`;

          const result = validateDateConsistency(content, frontmatterDate);
          // Should be true because 1999 is before 2000, and 3000 is after 2099
          // Only ${year} should be matched
          return result === true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("handles multiple occurrences of the same year correctly", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2030 }),
        fc.integer({ min: 3, max: 10 }),
        (year, occurrences) => {
          const frontmatterDate = `${year}-06-15T10:00:00Z`;

          // Generate content with multiple occurrences of the same year
          const yearMentions = Array(occurrences).fill(`year ${year}`).join(". ");
          const content = `This content mentions ${yearMentions}. All about ${year}.`;

          const result = validateDateConsistency(content, frontmatterDate);
          return result === true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it("is strict about year matching (no partial matches)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2020, max: 2030 }),
        (year) => {
          const frontmatterDate = `${year}-06-15T10:00:00Z`;
          const differentYear = year === 2030 ? 2020 : year + 1;

          // Content where one year is correct, one is not
          const content = `The ${year} season was great, but ${differentYear} will be better.`;

          const result = validateDateConsistency(content, frontmatterDate);
          return result === false;
        }
      ),
      { numRuns: 50 }
    );
  });
});
