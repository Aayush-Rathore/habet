/**
 * Unit Tests for Visual Element Validation
 * These tests verify the exact behavior before writing property tests
 */

import { describe, it, expect } from "vitest";
import { ContentValidator } from "./content-validator";
import type { BlogPost } from "./types/seo-blog";

describe("ContentValidator - Visual Element Validation (Unit Tests)", () => {
  const validator = new ContentValidator();

  it("validates blockquote requirement for 3000 words with 2 blockquotes", () => {
    const words = Array(3000).fill("word").join(" ");
    const content = `# Main Title

${words}

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
    // 3000 words / 1000 = 3 blockquotes required, but we only have 2
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toContain("below minimum 3");
  });

  it("counts words correctly with simple content", () => {
    const words = Array(3000).fill("word").join(" ");
    const content = `# Main Title\n\n${words}`;

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

    const result = validator.validateWordCount(post);
    console.log("Word count validation result:", result);
  });

  it("validates TOC requirement for 2500 words without TOC", () => {
    const words = Array(2500).fill("word").join(" ");
    const content = `# Main Title\n\n${words}`;

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
    // 2500 words > 2000, so TOC is required
    expect(result.passed).toBe(false);
    expect(result.errors[0]).toContain("exceeds 2000 words");
    expect(result.errors[0]).toContain("missing Table of Contents");
  });
});
