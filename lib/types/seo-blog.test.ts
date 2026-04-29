/**
 * Basic infrastructure verification test
 */

import { describe, it, expect } from "vitest";
import type {
  BlogFrontmatter,
  BlogPost,
  BlogGeneratorConfig,
  ContentValidationSchema,
  GSCKeywordData,
} from "./seo-blog";

describe("SEO Blog Types Infrastructure", () => {
  it("should allow creating a valid BlogFrontmatter object", () => {
    const frontmatter: BlogFrontmatter = {
      title: "Test Blog Post",
      slug: "test-blog-post",
      date: "2026-01-20T10:00:00Z",
      excerpt: "This is a test excerpt that is exactly 150 characters long to meet the requirement for excerpt length validation in the system.",
      keywords: [
        "test",
        "blog",
        "post",
        "habet",
        "cricket",
        "betting",
        "tips",
        "guide",
      ],
      author: "HABET Sports Team",
      readingTime: "5 min read",
    };

    expect(frontmatter.title).toBe("Test Blog Post");
    expect(frontmatter.keywords).toHaveLength(8);
  });

  it("should allow creating a valid BlogPost object", () => {
    const post: BlogPost = {
      frontmatter: {
        title: "Test Post",
        slug: "test-post",
        date: "2026-01-20T10:00:00Z",
        excerpt: "Test excerpt with exactly 150 characters to meet the requirement for excerpt length validation in the SEO blog expansion system.",
        keywords: ["test", "post", "habet", "cricket", "betting", "tips", "guide", "ipl"],
        author: "HABET Sports Team",
        readingTime: "5 min read",
      },
      content: "# Test Post\n\nThis is test content.",
    };

    expect(post.frontmatter.slug).toBe("test-post");
    expect(post.content).toContain("# Test Post");
  });

  it("should allow creating a valid BlogGeneratorConfig object", () => {
    const config: BlogGeneratorConfig = {
      minWordCount: 2500,
      maxWordCount: 4000,
      targetKeywordDensity: { min: 0.008, max: 0.012 },
      author: "HABET Sports Team",
      outputDir: "content/blogs",
    };

    expect(config.minWordCount).toBe(2500);
    expect(config.targetKeywordDensity.min).toBe(0.008);
  });

  it("should allow creating a valid GSCKeywordData object", () => {
    const gscData: GSCKeywordData = {
      query: "habet app download",
      clicks: 12,
      impressions: 450,
      ctr: 0.0267,
      position: 12.3,
    };

    expect(gscData.query).toBe("habet app download");
    expect(gscData.impressions).toBe(450);
  });

  it("should validate ContentValidationSchema structure", () => {
    const schema: ContentValidationSchema = {
      wordCount: {
        min: 2500,
        max: 4000,
      },
      keywordDensity: {
        min: 0.008,
        max: 0.012,
      },
      internalLinks: {
        min: 20,
        max: 25,
        maxPerParagraph: 3,
        distribution: {
          intro: 2,
          body: { min: 15, max: 18 },
          conclusion: { min: 3, max: 5 },
        },
      },
      headingStructure: {
        h1: { min: 1, max: 1 },
        h2: { min: 5, max: 8 },
        h3: { min: 10, max: 15 },
      },
      requiredSections: ["FAQ", "Conclusion"],
      excerptLength: {
        min: 150,
        max: 160,
      },
      keywordsCount: {
        min: 8,
        max: 12,
      },
    };

    expect(schema.wordCount.min).toBe(2500);
    expect(schema.internalLinks.distribution.intro).toBe(2);
    expect(schema.headingStructure.h1.max).toBe(1);
  });
});
