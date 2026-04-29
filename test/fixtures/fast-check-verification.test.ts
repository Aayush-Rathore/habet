/**
 * Fast-check library verification test
 * 
 * This test verifies that fast-check is properly installed and configured
 * for property-based testing in the SEO Blog Expansion feature.
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";

describe("Fast-check Infrastructure Verification", () => {
  it("should run a simple property test", () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        // Commutative property of addition
        expect(a + b).toBe(b + a);
      })
    );
  });

  it("should generate random strings", () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        // String length is always non-negative
        expect(str.length).toBeGreaterThanOrEqual(0);
      })
    );
  });

  it("should generate arrays with constraints", () => {
    fc.assert(
      fc.property(
        fc.array(fc.string(), { minLength: 8, maxLength: 12 }),
        (arr) => {
          // Array length should be within specified range
          expect(arr.length).toBeGreaterThanOrEqual(8);
          expect(arr.length).toBeLessThanOrEqual(12);
        }
      )
    );
  });

  it("should generate records with specific structure", () => {
    const blogFrontmatterArbitrary = fc.record({
      title: fc.string({ minLength: 10, maxLength: 100 }),
      slug: fc.stringMatching(/^[a-z0-9-]+$/),
      keywords: fc.array(fc.string(), { minLength: 8, maxLength: 12 }),
    });

    fc.assert(
      fc.property(blogFrontmatterArbitrary, (frontmatter) => {
        expect(frontmatter.title.length).toBeGreaterThanOrEqual(10);
        expect(frontmatter.title.length).toBeLessThanOrEqual(100);
        expect(frontmatter.keywords.length).toBeGreaterThanOrEqual(8);
        expect(frontmatter.keywords.length).toBeLessThanOrEqual(12);
        expect(frontmatter.slug).toMatch(/^[a-z0-9-]+$/);
      })
    );
  });
});
