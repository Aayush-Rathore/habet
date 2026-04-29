/**
 * Property-Based Tests for Blog Frontmatter
 *
 * Property 1: Blog frontmatter round-trip
 * Validates: Requirements 10.2, 10.4
 *
 * For any valid BlogFrontmatter object, serializing to YAML frontmatter and
 * parsing back with gray-matter produces an object with all required fields
 * present and with the correct types.
 */

import { describe, it } from "vitest";
import * as fc from "fast-check";
import matter from "gray-matter";
import type { BlogFrontmatter } from "./blog";

// ── Arbitraries ───────────────────────────────────────────────────────────────

/** Non-empty printable ASCII string (no YAML-breaking chars) */
const safeString = fc
  .string({ minLength: 1, maxLength: 80 })
  .filter((s) => s.trim().length > 0 && !s.includes(":") && !s.includes("#"));

/** ISO 8601 date string — use integer timestamps to avoid invalid Date during shrinking */
const isoDate = fc
  .integer({ min: new Date("2020-01-01").getTime(), max: new Date("2030-12-31").getTime() })
  .map((ts) => new Date(ts).toISOString());

/** Excerpt: non-empty, max 160 chars */
const excerpt = fc
  .string({ minLength: 1, maxLength: 160 })
  .filter((s) => s.trim().length > 0 && !s.includes(":") && !s.includes("#"));

/** Array of 1–5 keyword strings */
const keywords = fc.array(safeString, { minLength: 1, maxLength: 5 });

/** Reading time string like "N min read" */
const readingTime = fc
  .integer({ min: 1, max: 60 })
  .map((n) => `${n} min read`);

/** Arbitrary BlogFrontmatter */
const blogFrontmatterArb: fc.Arbitrary<BlogFrontmatter> = fc.record({
  title: safeString,
  slug: fc
    .string({ minLength: 1, maxLength: 60 })
    .filter((s) => /^[a-z0-9-]+$/.test(s)),
  date: isoDate,
  excerpt,
  keywords,
  author: safeString,
  readingTime,
});

// ── Serializer ────────────────────────────────────────────────────────────────

/**
 * Serialize a BlogFrontmatter to a YAML frontmatter string.
 * Uses gray-matter's stringify to produce the canonical ---\nkey: value\n---\n format.
 */
function serializeToFrontmatter(fm: BlogFrontmatter): string {
  return matter.stringify("", fm);
}

// ── Property Tests ────────────────────────────────────────────────────────────

describe("Blog frontmatter round-trip (Property 1)", () => {
  /**
   * **Validates: Requirements 10.2, 10.4**
   *
   * For any valid BlogFrontmatter, serializing to YAML and parsing back with
   * gray-matter must preserve all required fields with correct types.
   */
  it("round-trips all required fields with correct types", () => {
    fc.assert(
      fc.property(blogFrontmatterArb, (original) => {
        const yamlString = serializeToFrontmatter(original);
        const { data } = matter(yamlString);
        const parsed = data as BlogFrontmatter;

        // title — string
        if (typeof parsed.title !== "string") return false;
        // slug — string
        if (typeof parsed.slug !== "string") return false;
        // date — string (gray-matter may parse ISO dates as Date objects)
        const dateVal = parsed.date as unknown;
        if (typeof dateVal !== "string" && !(dateVal instanceof Date)) return false;
        // excerpt — string
        if (typeof parsed.excerpt !== "string") return false;
        // keywords — array
        if (!Array.isArray(parsed.keywords)) return false;
        // author — string
        if (typeof parsed.author !== "string") return false;
        // readingTime — string
        if (typeof parsed.readingTime !== "string") return false;

        return true;
      }),
      { numRuns: 20 }
    );
  });

  it("preserves title value after round-trip", () => {
    fc.assert(
      fc.property(blogFrontmatterArb, (original) => {
        const { data } = matter(serializeToFrontmatter(original));
        return data.title === original.title;
      }),
      { numRuns: 20 }
    );
  });

  it("preserves slug value after round-trip", () => {
    fc.assert(
      fc.property(blogFrontmatterArb, (original) => {
        const { data } = matter(serializeToFrontmatter(original));
        return data.slug === original.slug;
      }),
      { numRuns: 20 }
    );
  });

  it("preserves keywords array after round-trip", () => {
    fc.assert(
      fc.property(blogFrontmatterArb, (original) => {
        const { data } = matter(serializeToFrontmatter(original));
        if (!Array.isArray(data.keywords)) return false;
        if (data.keywords.length !== original.keywords.length) return false;
        return original.keywords.every((kw, i) => data.keywords[i] === kw);
      }),
      { numRuns: 20 }
    );
  });

  it("preserves author and readingTime after round-trip", () => {
    fc.assert(
      fc.property(blogFrontmatterArb, (original) => {
        const { data } = matter(serializeToFrontmatter(original));
        return data.author === original.author && data.readingTime === original.readingTime;
      }),
      { numRuns: 20 }
    );
  });
});
