import { slugify, generateUniqueSlug } from "./slugify";

describe("slugify", () => {
  it("converts a simple title to kebab-case", () => {
    expect(slugify("Cricket Betting Tips India 2026")).toBe(
      "cricket-betting-tips-india-2026"
    );
  });

  it("strips special characters", () => {
    expect(slugify("HABET App – Download & Install!")).toBe(
      "habet-app-download-install"
    );
  });

  it("collapses multiple spaces/hyphens", () => {
    expect(slugify("Hello   World---Test")).toBe("hello-world-test");
  });

  it("handles Hindi/Devanagari text gracefully (strips non-ASCII)", () => {
    // Hindi characters are stripped; remaining ASCII parts form the slug
    const result = slugify("HABET kaise download करें");
    expect(result).toBe("habet-kaise-download");
  });

  it("handles an empty string", () => {
    expect(slugify("")).toBe("");
  });

  it("handles a title that is only special characters", () => {
    expect(slugify("!@#$%^&*()")).toBe("");
  });
});

describe("generateUniqueSlug", () => {
  it("returns the base slug when no collision", () => {
    const result = generateUniqueSlug("Cricket Tips", ["other-slug"]);
    expect(result).toBe("cricket-tips");
  });

  it("appends a timestamp suffix on collision", () => {
    const before = Date.now();
    const result = generateUniqueSlug("Cricket Tips", ["cricket-tips"]);
    const after = Date.now();

    expect(result).toMatch(/^cricket-tips-\d+$/);
    const ts = parseInt(result.split("-").pop()!, 10);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it("returns a slug not present in existingSlugs after collision", () => {
    const existing = ["cricket-tips"];
    const result = generateUniqueSlug("Cricket Tips", existing);
    expect(existing).not.toContain(result);
  });

  it("works with an empty existingSlugs array", () => {
    expect(generateUniqueSlug("My Post", [])).toBe("my-post");
  });
});

// Property-Based Tests
// **Validates: Requirements 7.8**
import * as fc from "fast-check";

describe("generateUniqueSlug — Property 2: Slug uniqueness on collision", () => {
  it("always returns a slug not present in existingSlugs", () => {
    fc.assert(
      fc.property(fc.string(), fc.array(fc.string()), (title, existingSlugs) => {
        const result = generateUniqueSlug(title, existingSlugs);
        return !existingSlugs.includes(result);
      }),
      { numRuns: 100 }
    );
  });
});
