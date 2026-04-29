/**
 * Property-Based Tests for /api/generate-blogs route
 *
 * Property 6: CRON_SECRET authorization
 * Validates: Requirements 7.12
 *
 * Property 7: Partial failure atomicity
 * Validates: Requirements 7.11
 */

import { describe, it, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { checkAuthorization } from "./route";

// ── Property 6: CRON_SECRET authorization ────────────────────────────────────

describe("checkAuthorization (Property 6)", () => {
  /**
   * **Validates: Requirements 7.12**
   *
   * For any string that is not `Bearer ${secret}`, checkAuthorization returns false.
   * For the exact `Bearer ${secret}` value, it returns true.
   */

  it("returns false for any string that is not the exact Bearer token", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 64 }), // secret
        fc.string({ minLength: 0, maxLength: 128 }), // arbitrary header
        (secret, header) => {
          // Exclude the exact matching value
          fc.pre(header !== `Bearer ${secret}`);
          return checkAuthorization(header, secret) === false;
        }
      ),
      { numRuns: 20 }
    );
  });

  it("returns false for null header", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 64 }), (secret) => {
        return checkAuthorization(null, secret) === false;
      }),
      { numRuns: 20 }
    );
  });

  it("returns true for the exact Bearer ${secret} value", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 64 }), (secret) => {
        return checkAuthorization(`Bearer ${secret}`, secret) === true;
      }),
      { numRuns: 20 }
    );
  });
});

// ── Property 7: Partial failure atomicity ────────────────────────────────────

// Mock modules before importing the route
vi.mock("@/lib/gemini", () => ({
  generateBlogPost: vi.fn(),
}));

vi.mock("@/lib/blog", () => ({
  getAllSlugs: vi.fn().mockResolvedValue([]),
  calculateReadingTime: vi.fn().mockReturnValue("5 min read"),
}));

vi.mock("@/lib/slugify", () => ({
  generateUniqueSlug: vi.fn().mockImplementation((title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  ),
}));

vi.mock("fs", () => ({
  default: {
    promises: {
      writeFile: vi.fn().mockResolvedValue(undefined),
      mkdir: vi.fn().mockResolvedValue(undefined),
    },
  },
  promises: {
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("POST /api/generate-blogs — partial failure atomicity (Property 7)", () => {
  /**
   * **Validates: Requirements 7.11**
   *
   * When generateBlogPost throws at any position (0, 1, or 2) in the 3-post loop,
   * fs.promises.writeFile must never be called.
   */

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("never calls fs.promises.writeFile when generateBlogPost throws at any position", async () => {
    const { POST } = await import("./route");
    const { generateBlogPost } = await import("@/lib/gemini");
    const fs = await import("fs");

    const validMarkdown = [
      "# Test Blog Post Title",
      "",
      "This is a test paragraph with some content.",
      "",
      "## Section One",
      "",
      "Content here.",
      "",
      "## Section Two",
      "",
      "More content.",
      "",
      "## Section Three",
      "",
      "Even more content.",
      "",
      "## FAQ",
      "",
      "**Q:** What is HABET?",
      "**A:** A sports betting app.",
      "",
      "## Conclusion",
      "",
      "Download the [HABET app](/) today.",
    ].join("\n");

    const secret = "test-cron-secret";
    process.env.CRON_SECRET = secret;

    const mockRequest = {
      headers: {
        get: (name: string) =>
          name === "Authorization" ? `Bearer ${secret}` : null,
      },
    } as any;

    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 2 }), // failure position: 0, 1, or 2
        async (failPosition) => {
          vi.clearAllMocks();

          let callCount = 0;
          vi.mocked(generateBlogPost).mockImplementation(async () => {
            const currentCall = callCount++;
            if (currentCall === failPosition) {
              throw new Error(
                `Simulated Gemini failure at position ${failPosition}`
              );
            }
            return validMarkdown;
          });

          await POST(mockRequest);

          // Assert writeFile was never called
          return vi.mocked(fs.promises.writeFile).mock.calls.length === 0;
        }
      ),
      { numRuns: 20 }
    );
  });
});
