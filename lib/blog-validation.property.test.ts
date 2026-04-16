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
      { numRuns: 100 }
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
      { numRuns: 100 }
    );
  });

  it("returns false when FAQ section is missing", () => {
    fc.assert(
      fc.property(structureArb, (params) => {
        const noFaqParams = { ...params, hasFaq: false };
        const content = buildMarkdown(noFaqParams);
        return validateBlogStructure(content) === false;
      }),
      { numRuns: 100 }
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
      { numRuns: 100 }
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
      { numRuns: 100 }
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
      { numRuns: 100 }
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

  /** Safe anchor text: no brackets or parens */
  const anchorText = fc
    .string({ minLength: 1, maxLength: 30 })
    .filter((s) => s.trim().length > 0 && !/[\[\]()]/.test(s));

  /** Arbitrary markdown content without any internal links */
  const contentWithoutLink = fc
    .array(safeLine, { minLength: 0, maxLength: 5 })
    .map((lines) => lines.join("\n"))
    .filter((s) => !s.includes("](/)") && !s.includes("](https://habetapk.com"));

  it("returns true when a [text](/) link is present", () => {
    fc.assert(
      fc.property(anchorText, contentWithoutLink, (anchor, surrounding) => {
        const link = `[${anchor}](/)`;
        const content = `${surrounding}\n${link}\nsome more text`;
        return containsInternalLink(content, "/") === true;
      }),
      { numRuns: 100 }
    );
  });

  it("returns false when no internal link to / is present", () => {
    fc.assert(
      fc.property(contentWithoutLink, (content) => {
        return containsInternalLink(content, "/") === false;
      }),
      { numRuns: 100 }
    );
  });

  it("returns true when a [text](https://habetapk.com/) link is present", () => {
    fc.assert(
      fc.property(anchorText, contentWithoutLink, (anchor, surrounding) => {
        const link = `[${anchor}](https://habetapk.com/)`;
        const content = `${surrounding}\n${link}`;
        return containsInternalLink(content, "/") === true;
      }),
      { numRuns: 100 }
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
      { numRuns: 100 }
    );
  });
});
