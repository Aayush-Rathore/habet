import { describe, it, expect } from "vitest";
import { ContentValidator } from "./content-validator";
import type { BlogPost } from "./types/seo-blog";

// ── helpers ──────────────────────────────────────────────────────────────────

function createMockPost(overrides: Partial<BlogPost> = {}): BlogPost {
  return {
    frontmatter: {
      title: "Test Blog Post",
      slug: "test-blog-post",
      date: "2026-01-15T10:00:00Z",
      excerpt: "This is a test excerpt with exactly the right length including the keyword habet for testing purposes and meeting the minimum length requirement of chars.",
      keywords: ["habet", "test", "blog", "cricket", "betting", "app", "download", "guide"],
      author: "HABET Sports Team",
      readingTime: "7 min read",
    },
    content: "# Test Blog Post\n\nThis is test content.",
    ...overrides,
  };
}

function createContentWithWordCount(wordCount: number): string {
  const words = [];
  for (let i = 0; i < wordCount; i++) {
    words.push(`word${i}`);
  }
  return words.join(" ");
}

function createContentWithKeyword(keyword: string, occurrences: number, totalWords: number): string {
  const words = [];
  const interval = Math.floor(totalWords / occurrences);
  
  for (let i = 0; i < totalWords; i++) {
    if (i % interval === 0 && occurrences > 0) {
      words.push(keyword);
      occurrences--;
    } else {
      words.push(`word${i}`);
    }
  }
  
  return words.join(" ");
}

// ── ContentValidator ─────────────────────────────────────────────────────────

const validator = new ContentValidator();

describe("ContentValidator", () => {
  describe("validateWordCount", () => {
    it("should pass for content within range (2500-4000 words)", () => {
      const post = createMockPost({
        content: `# Title\n\n${createContentWithWordCount(3000)}`,
      });

      const result = validator.validateWordCount(post);

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail for content below minimum (2500 words)", () => {
      const post = createMockPost({
        content: `# Title\n\n${createContentWithWordCount(2000)}`,
      });

      const result = validator.validateWordCount(post);

      expect(result.passed).toBe(false);
      expect(result.errors).toContain("Word count 2001 below minimum 2500");
    });

    it("should fail for content above maximum (4000 words)", () => {
      const post = createMockPost({
        content: `# Title\n\n${createContentWithWordCount(4500)}`,
      });

      const result = validator.validateWordCount(post);

      expect(result.passed).toBe(false);
      expect(result.errors).toContain("Word count 4501 exceeds maximum 4000");
    });

    it("should pass for exactly 2500 words", () => {
      const post = createMockPost({
        content: `# Title\n\n${createContentWithWordCount(2499)}`,
      });

      const result = validator.validateWordCount(post);

      expect(result.passed).toBe(true);
    });

    it("should pass for exactly 4000 words", () => {
      const post = createMockPost({
        content: `# Title\n\n${createContentWithWordCount(3999)}`,
      });

      const result = validator.validateWordCount(post);

      expect(result.passed).toBe(true);
    });
  });

  describe("validateKeywordDensity", () => {
    it("should pass for keyword density within range (0.8-1.2%)", () => {
      // 3000 words, 30 occurrences = 1.0% density
      const post = createMockPost({
        content: `# Title\n\n${createContentWithKeyword("habet", 30, 3000)}`,
      });

      const result = validator.validateKeywordDensity(post, "habet");

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail for keyword density below minimum (0.8%)", () => {
      // 3000 words, 20 occurrences = 0.67% density
      const post = createMockPost({
        content: `# Title\n\n${createContentWithKeyword("habet", 20, 3000)}`,
      });

      const result = validator.validateKeywordDensity(post, "habet");

      expect(result.passed).toBe(false);
      expect(result.errors[0]).toContain("below minimum 0.8%");
    });

    it("should fail for keyword density above maximum (1.2%)", () => {
      // 3000 words, 40 occurrences = 1.33% density
      const post = createMockPost({
        content: `# Title\n\n${createContentWithKeyword("habet", 40, 3000)}`,
      });

      const result = validator.validateKeywordDensity(post, "habet");

      expect(result.passed).toBe(false);
      expect(result.errors[0]).toContain("exceeds maximum 1.2%");
    });

    it("should handle multi-word keywords", () => {
      const content = "habet app ".repeat(30) + "word ".repeat(2970);
      const post = createMockPost({ content: `# Heading\n\n${content}` });

      const result = validator.validateKeywordDensity(post, "habet app");

      expect(result.passed).toBe(true);
    });
  });

  describe("validateHeadingStructure", () => {
    it("should pass for valid heading structure", () => {
      const content = `
# Main Title

## Section 1
### Subsection 1.1
### Subsection 1.2

## Section 2
### Subsection 2.1
### Subsection 2.2
### Subsection 2.3

## Section 3
### Subsection 3.1
### Subsection 3.2

## Section 4
### Subsection 4.1
### Subsection 4.2

## Section 5
### Subsection 5.1
### Subsection 5.2
### Subsection 5.3
      `.trim();

      const post = createMockPost({ content });

      const result = validator.validateHeadingStructure(post);

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail for missing H1", () => {
      const content = "## Section 1\n### Subsection";
      const post = createMockPost({ content });

      const result = validator.validateHeadingStructure(post);

      expect(result.passed).toBe(false);
      expect(result.errors).toContain("H1 count 0 below minimum 1");
    });

    it("should fail for multiple H1s", () => {
      const content = "# Title 1\n# Title 2\n## Section";
      const post = createMockPost({ content });

      const result = validator.validateHeadingStructure(post);

      expect(result.passed).toBe(false);
      expect(result.errors).toContain("H1 count 2 exceeds maximum 1");
    });

    it("should fail for too few H2s", () => {
      const content = "# Title\n## Section 1\n### Sub";
      const post = createMockPost({ content });

      const result = validator.validateHeadingStructure(post);

      expect(result.passed).toBe(false);
      expect(result.errors).toContain("H2 count 1 below minimum 5");
    });

    it("should fail for too many H2s", () => {
      const h2s = Array.from({ length: 10 }, (_, i) => `## Section ${i + 1}`).join("\n");
      const content = `# Title\n${h2s}`;
      const post = createMockPost({ content });

      const result = validator.validateHeadingStructure(post);

      expect(result.passed).toBe(false);
      expect(result.errors).toContain("H2 count 10 exceeds maximum 8");
    });

    it("should fail for too few H3s", () => {
      const content = "# Title\n" + "## Section\n".repeat(5) + "### Sub\n".repeat(5);
      const post = createMockPost({ content });

      const result = validator.validateHeadingStructure(post);

      expect(result.passed).toBe(false);
      expect(result.errors).toContain("H3 count 5 below minimum 10");
    });
  });

  describe("validateFrontmatter", () => {
    it("should pass for complete valid frontmatter", () => {
      const post = createMockPost();

      const result = validator.validateFrontmatter(post);

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail for missing title", () => {
      const post = createMockPost();
      post.frontmatter.title = "";

      const result = validator.validateFrontmatter(post);

      expect(result.passed).toBe(false);
      expect(result.errors).toContain("Missing required field: title");
    });

    it("should fail for missing slug", () => {
      const post = createMockPost();
      post.frontmatter.slug = "";

      const result = validator.validateFrontmatter(post);

      expect(result.passed).toBe(false);
      expect(result.errors).toContain("Missing required field: slug");
    });

    it("should fail for invalid slug format", () => {
      const post = createMockPost();
      post.frontmatter.slug = "Invalid Slug!";

      const result = validator.validateFrontmatter(post);

      expect(result.passed).toBe(false);
      expect(result.errors[0]).toContain("Invalid slug format");
    });

    it("should fail for missing date", () => {
      const post = createMockPost();
      post.frontmatter.date = "";

      const result = validator.validateFrontmatter(post);

      expect(result.passed).toBe(false);
      expect(result.errors).toContain("Missing required field: date");
    });

    it("should fail for invalid date format", () => {
      const post = createMockPost();
      post.frontmatter.date = "2026-01-15";

      const result = validator.validateFrontmatter(post);

      expect(result.passed).toBe(false);
      expect(result.errors[0]).toContain("Invalid date format");
    });

    it("should fail for missing excerpt", () => {
      const post = createMockPost();
      post.frontmatter.excerpt = "";

      const result = validator.validateFrontmatter(post);

      expect(result.passed).toBe(false);
      expect(result.errors).toContain("Missing required field: excerpt");
    });

    it("should fail for missing keywords", () => {
      const post = createMockPost();
      post.frontmatter.keywords = [];

      const result = validator.validateFrontmatter(post);

      expect(result.passed).toBe(false);
      expect(result.errors).toContain("Missing required field: keywords");
    });

    it("should fail for missing author", () => {
      const post = createMockPost();
      post.frontmatter.author = "";

      const result = validator.validateFrontmatter(post);

      expect(result.passed).toBe(false);
      expect(result.errors).toContain("Missing required field: author");
    });

    it("should fail for missing readingTime", () => {
      const post = createMockPost();
      post.frontmatter.readingTime = "";

      const result = validator.validateFrontmatter(post);

      expect(result.passed).toBe(false);
      expect(result.errors).toContain("Missing required field: readingTime");
    });
  });

  describe("validateExcerpt", () => {
    it("should pass for valid excerpt with keyword", () => {
      const post = createMockPost();

      const result = validator.validateExcerpt(post, "habet");

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail for excerpt below minimum length", () => {
      const post = createMockPost();
      post.frontmatter.excerpt = "Short excerpt with habet.";

      const result = validator.validateExcerpt(post, "habet");

      expect(result.passed).toBe(false);
      expect(result.errors[0]).toContain("below minimum 150 characters");
    });

    it("should fail for excerpt above maximum length", () => {
      const post = createMockPost();
      post.frontmatter.excerpt = "x".repeat(161);

      const result = validator.validateExcerpt(post, "habet");

      expect(result.passed).toBe(false);
      expect(result.errors[0]).toContain("exceeds maximum 160 characters");
    });

    it("should fail for excerpt without primary keyword", () => {
      const post = createMockPost();
      post.frontmatter.excerpt = "This is a valid length excerpt without the primary keyword mentioned anywhere in the text at all for testing purposes here.";

      const result = validator.validateExcerpt(post, "habet");

      expect(result.passed).toBe(false);
      expect(result.errors).toContain("Excerpt does not include primary keyword: habet");
    });
  });

  describe("validateSlugFormat", () => {
    it("should pass for valid kebab-case slug", () => {
      const result = validator.validateSlugFormat("valid-slug-format");

      expect(result.passed).toBe(true);
    });

    it("should pass for slug with numbers", () => {
      const result = validator.validateSlugFormat("slug-with-123-numbers");

      expect(result.passed).toBe(true);
    });

    it("should fail for slug with uppercase letters", () => {
      const result = validator.validateSlugFormat("Invalid-Slug");

      expect(result.passed).toBe(false);
      expect(result.errors[0]).toContain("must be kebab-case");
    });

    it("should fail for slug with spaces", () => {
      const result = validator.validateSlugFormat("invalid slug");

      expect(result.passed).toBe(false);
    });

    it("should fail for slug with special characters", () => {
      const result = validator.validateSlugFormat("invalid_slug!");

      expect(result.passed).toBe(false);
    });
  });

  describe("validateDateFormat", () => {
    it("should pass for valid ISO 8601 date", () => {
      const result = validator.validateDateFormat("2026-01-15T10:00:00Z");

      expect(result.passed).toBe(true);
    });

    it("should pass for ISO 8601 date with milliseconds", () => {
      const result = validator.validateDateFormat("2026-01-15T10:00:00.000Z");

      expect(result.passed).toBe(true);
    });

    it("should fail for date without time", () => {
      const result = validator.validateDateFormat("2026-01-15");

      expect(result.passed).toBe(false);
      expect(result.errors[0]).toContain("must be ISO 8601 format");
    });

    it("should fail for invalid date", () => {
      const result = validator.validateDateFormat("not-a-date");

      expect(result.passed).toBe(false);
    });
  });

  describe("validateInternalLinks", () => {
    it("should pass for content with 20-25 internal links", () => {
      const links = Array.from({ length: 22 }, (_, i) => `[Link ${i}](/blog/post-${i})`).join(" ");
      const post = createMockPost({
        content: `# Title\n\n${links}`,
      });

      const result = validator.validateInternalLinks(post);

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail for too few internal links", () => {
      const links = Array.from({ length: 15 }, (_, i) => `[Link ${i}](/blog/post-${i})`).join(" ");
      const post = createMockPost({
        content: `# Title\n\n${links}`,
      });

      const result = validator.validateInternalLinks(post);

      expect(result.passed).toBe(false);
      expect(result.errors).toContain("Internal link count 15 below minimum 20");
    });

    it("should fail for too many internal links", () => {
      const links = Array.from({ length: 30 }, (_, i) => `[Link ${i}](/blog/post-${i})`).join(" ");
      const post = createMockPost({
        content: `# Title\n\n${links}`,
      });

      const result = validator.validateInternalLinks(post);

      expect(result.passed).toBe(false);
      expect(result.errors).toContain("Internal link count 30 exceeds maximum 25");
    });

    it("should warn for paragraphs with more than 3 links", () => {
      const paragraph = Array.from({ length: 5 }, (_, i) => `[Link ${i}](/blog/post-${i})`).join(" ");
      const post = createMockPost({
        content: `# Title\n\n${paragraph}\n\n` + Array.from({ length: 15 }, (_, i) => `[Link ${i}](/page-${i})`).join(" "),
      });

      const result = validator.validateInternalLinks(post);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain("contains 5 links");
    });

    it("should only count internal links (starting with /)", () => {
      const internalLinks = Array.from({ length: 20 }, (_, i) => `[Link ${i}](/blog/post-${i})`).join(" ");
      const externalLinks = Array.from({ length: 10 }, (_, i) => `[External ${i}](https://example.com/page-${i})`).join(" ");
      const post = createMockPost({
        content: `# Title\n\n${internalLinks} ${externalLinks}`,
      });

      const result = validator.validateInternalLinks(post);

      expect(result.passed).toBe(true);
    });
  });

  describe("validateUniqueness", () => {
    it("should pass when title and slug are unique", () => {
      const post = createMockPost();
      const existingPosts = [
        createMockPost({ frontmatter: { ...createMockPost().frontmatter, title: "Different Title", slug: "different-slug" } }),
      ];

      const result = validator.validateUniqueness(post, existingPosts);

      expect(result.passed).toBe(true);
    });

    it("should fail for duplicate title", () => {
      const post = createMockPost();
      const existingPosts = [
        createMockPost({ frontmatter: { ...createMockPost().frontmatter, slug: "different-slug" } }),
      ];

      const result = validator.validateUniqueness(post, existingPosts);

      expect(result.passed).toBe(false);
      expect(result.errors).toContain("Duplicate title: Test Blog Post");
    });

    it("should fail for duplicate slug", () => {
      const post = createMockPost();
      const existingPosts = [
        createMockPost({ frontmatter: { ...createMockPost().frontmatter, title: "Different Title" } }),
      ];

      const result = validator.validateUniqueness(post, existingPosts);

      expect(result.passed).toBe(false);
      expect(result.errors).toContain("Duplicate slug: test-blog-post");
    });
  });

  describe("validateParagraphLength", () => {
    it("should pass for paragraphs with 5 or fewer sentences", () => {
      const content = `
# Title

This is sentence one. This is sentence two. This is sentence three. This is sentence four. This is sentence five.

Another paragraph. With two sentences.
      `.trim();

      const post = createMockPost({ content });
      const result = validator.validateParagraphLength(post);

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail for paragraphs with more than 5 sentences", () => {
      const content = `
# Title

This is sentence one. This is sentence two. This is sentence three. This is sentence four. This is sentence five. This is sentence six.
      `.trim();

      const post = createMockPost({ content });
      const result = validator.validateParagraphLength(post);

      expect(result.passed).toBe(false);
      expect(result.errors[0]).toContain("contains 6 sentences");
    });

    it("should skip headings when counting sentences", () => {
      const content = `
# Title with multiple. Sentences. In heading.

This is a valid paragraph. With two sentences.
      `.trim();

      const post = createMockPost({ content });
      const result = validator.validateParagraphLength(post);

      expect(result.passed).toBe(true);
    });

    it("should skip list items when counting sentences", () => {
      const content = `
# Title

- List item one. With two sentences.
- List item two. With two sentences.

Valid paragraph. With two sentences.
      `.trim();

      const post = createMockPost({ content });
      const result = validator.validateParagraphLength(post);

      expect(result.passed).toBe(true);
    });
  });

  describe("validateSectionLength", () => {
    it("should pass for sections with 400 or fewer words", () => {
      const section1 = createContentWithWordCount(300);
      const section2 = createContentWithWordCount(400);
      const content = `
# Title

${section1}

## Section 2

${section2}
      `.trim();

      const post = createMockPost({ content });
      const result = validator.validateSectionLength(post);

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail for sections with more than 400 words", () => {
      const section = createContentWithWordCount(500);
      const content = `
# Title

## Section 1

${section}
      `.trim();

      const post = createMockPost({ content });
      const result = validator.validateSectionLength(post);

      expect(result.passed).toBe(false);
      expect(result.errors[0]).toContain("contains 500 words");
    });
  });

  describe("validateAverageSentenceLength", () => {
    it("should pass for average sentence length of 20 words or less", () => {
      // Create sentences with exactly 20 words each
      const sentence = Array(20).fill("word").join(" ");
      const content = `${sentence}. ${sentence}. ${sentence}.`;

      const post = createMockPost({ content });
      const result = validator.validateAverageSentenceLength(post);

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail for average sentence length exceeding 20 words", () => {
      // Create sentences with 25 words each
      const sentence = Array(25).fill("word").join(" ");
      const content = `${sentence}. ${sentence}. ${sentence}.`;

      const post = createMockPost({ content });
      const result = validator.validateAverageSentenceLength(post);

      expect(result.passed).toBe(false);
      expect(result.errors[0]).toContain("exceeds maximum 20 words");
    });

    it("should handle empty content", () => {
      const post = createMockPost({ content: "" });
      const result = validator.validateAverageSentenceLength(post);

      expect(result.passed).toBe(true);
    });
  });

  describe("validateListCount", () => {
    it("should pass for content with 4 or more lists", () => {
      const content = `
# Title

- List 1 item 1
- List 1 item 2

Some text.

- List 2 item 1
- List 2 item 2

More text.

1. List 3 item 1
2. List 3 item 2

Even more text.

- List 4 item 1
- List 4 item 2
      `.trim();

      const post = createMockPost({ content });
      const result = validator.validateListCount(post);

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail for content with fewer than 4 lists", () => {
      const content = `
# Title

- List 1 item 1
- List 1 item 2

Some text.

- List 2 item 1
- List 2 item 2
      `.trim();

      const post = createMockPost({ content });
      const result = validator.validateListCount(post);

      expect(result.passed).toBe(false);
      expect(result.errors[0]).toContain("List count 2 below minimum 4");
    });
  });

  describe("validateBoldTextCount", () => {
    it("should pass for content with 5-10 bold instances", () => {
      const content = `
# Title

This has **bold1** and **bold2** and **bold3** and **bold4** and **bold5** text.
      `.trim();

      const post = createMockPost({ content });
      const result = validator.validateBoldTextCount(post);

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail for content with fewer than 5 bold instances", () => {
      const content = `
# Title

This has **bold1** and **bold2** text.
      `.trim();

      const post = createMockPost({ content });
      const result = validator.validateBoldTextCount(post);

      expect(result.passed).toBe(false);
      expect(result.errors[0]).toContain("Bold text count 2 below minimum 5");
    });

    it("should fail for content with more than 10 bold instances", () => {
      const bolds = Array.from({ length: 12 }, (_, i) => `**bold${i}**`).join(" ");
      const content = `# Title\n\n${bolds}`;

      const post = createMockPost({ content });
      const result = validator.validateBoldTextCount(post);

      expect(result.passed).toBe(false);
      expect(result.errors[0]).toContain("Bold text count 12 exceeds maximum 10");
    });

    it("should count both ** and __ bold syntax", () => {
      const content = `
# Title

This has **bold1** and __bold2__ and **bold3** and __bold4__ and **bold5** text.
      `.trim();

      const post = createMockPost({ content });
      const result = validator.validateBoldTextCount(post);

      expect(result.passed).toBe(true);
    });
  });

  describe("validateBlockquoteCount", () => {
    it("should pass for content with 1 blockquote per 1000 words", () => {
      const content = `
# Title

${createContentWithWordCount(1000)}

> This is a blockquote.

${createContentWithWordCount(1000)}

> This is another blockquote.
      `.trim();

      const post = createMockPost({ content });
      const result = validator.validateBlockquoteCount(post);

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail for content with insufficient blockquotes", () => {
      const content = `
# Title

${createContentWithWordCount(2000)}
      `.trim();

      const post = createMockPost({ content });
      const result = validator.validateBlockquoteCount(post);

      expect(result.passed).toBe(false);
      expect(result.errors[0]).toContain("Blockquote count 0 below minimum 2");
    });

    it("should count multi-line blockquotes as one block", () => {
      const content = `
# Title

${createContentWithWordCount(1000)}

> This is a blockquote.
> With multiple lines.
> All part of one block.
      `.trim();

      const post = createMockPost({ content });
      const result = validator.validateBlockquoteCount(post);

      expect(result.passed).toBe(true);
    });
  });

  describe("validateTOCPresence", () => {
    it("should pass for posts >2000 words with TOC", () => {
      const content = `
# Title

## Table of Contents

- [Section 1](#section-1)
- [Section 2](#section-2)

${createContentWithWordCount(2500)}
      `.trim();

      const post = createMockPost({ content });
      const result = validator.validateTOCPresence(post);

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail for posts >2000 words without TOC", () => {
      const content = `
# Title

${createContentWithWordCount(2500)}
      `.trim();

      const post = createMockPost({ content });
      const result = validator.validateTOCPresence(post);

      expect(result.passed).toBe(false);
      expect(result.errors[0]).toContain("missing Table of Contents");
    });

    it("should pass for posts <=2000 words without TOC", () => {
      const content = `
# Title

${createContentWithWordCount(1500)}
      `.trim();

      const post = createMockPost({ content });
      const result = validator.validateTOCPresence(post);

      expect(result.passed).toBe(true);
    });

    it("should recognize 'Contents' as TOC", () => {
      const content = `
# Title

## Contents

${createContentWithWordCount(2500)}
      `.trim();

      const post = createMockPost({ content });
      const result = validator.validateTOCPresence(post);

      expect(result.passed).toBe(true);
    });
  });

  describe("validateFAQSection", () => {
    it("should pass for FAQ section with 4-6 questions using H3 headings", () => {
      const content = `
# Title

Some content here.

## FAQ

### What is HABET?
HABET is a betting app.

### How do I download HABET?
You can download it from our website.

### Is HABET safe?
Yes, HABET is completely safe.

### What sports can I bet on?
You can bet on cricket, football, and more.

## Conclusion

More content.
      `.trim();

      const post = createMockPost({ content });
      const result = validator.validateFAQSection(post);

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should pass for FAQ section with 4-6 questions using bold text", () => {
      const content = `
# Title

Some content here.

## FAQ

**What is HABET?**
HABET is a betting app.

**How do I download HABET?**
You can download it from our website.

**Is HABET safe?**
Yes, HABET is completely safe.

**What sports can I bet on?**
You can bet on cricket, football, and more.

**How do I withdraw money?**
Go to the withdrawal section.

## Conclusion

More content.
      `.trim();

      const post = createMockPost({ content });
      const result = validator.validateFAQSection(post);

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should pass for FAQ section with mixed H3 and bold questions", () => {
      const content = `
# Title

## FAQ

### What is HABET?
Answer here.

**How do I download HABET?**
Answer here.

### Is HABET safe?
Answer here.

**What sports can I bet on?**
Answer here.
      `.trim();

      const post = createMockPost({ content });
      const result = validator.validateFAQSection(post);

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should fail for missing FAQ section", () => {
      const content = `
# Title

Some content without FAQ section.

## Conclusion

More content.
      `.trim();

      const post = createMockPost({ content });
      const result = validator.validateFAQSection(post);

      expect(result.passed).toBe(false);
      expect(result.errors).toContain("Missing FAQ section with ## FAQ heading");
    });

    it("should fail for FAQ section with fewer than 4 questions", () => {
      const content = `
# Title

## FAQ

### What is HABET?
Answer here.

### How do I download HABET?
Answer here.

**Is HABET safe?**
Answer here.

## Conclusion
      `.trim();

      const post = createMockPost({ content });
      const result = validator.validateFAQSection(post);

      expect(result.passed).toBe(false);
      expect(result.errors[0]).toContain("FAQ section contains 3 questions (minimum 4 required)");
    });

    it("should fail for FAQ section with more than 6 questions", () => {
      const content = `
# Title

## FAQ

### Question 1?
Answer 1.

### Question 2?
Answer 2.

### Question 3?
Answer 3.

### Question 4?
Answer 4.

### Question 5?
Answer 5.

### Question 6?
Answer 6.

### Question 7?
Answer 7.

## Conclusion
      `.trim();

      const post = createMockPost({ content });
      const result = validator.validateFAQSection(post);

      expect(result.passed).toBe(false);
      expect(result.errors[0]).toContain("FAQ section contains 7 questions (maximum 6 allowed)");
    });

    it("should handle FAQ section at end of document", () => {
      const content = `
# Title

Some content.

## FAQ

### What is HABET?
Answer.

### How do I download?
Answer.

### Is it safe?
Answer.

### What sports?
Answer.
      `.trim();

      const post = createMockPost({ content });
      const result = validator.validateFAQSection(post);

      expect(result.passed).toBe(true);
    });

    it("should only count questions with question marks", () => {
      const content = `
# Title

## FAQ

### What is HABET?
Answer.

### How to download
Answer (no question mark).

### Is it safe?
Answer.

### What sports can I bet on?
Answer.

### How do I withdraw?
Answer.

## Conclusion
      `.trim();

      const post = createMockPost({ content });
      const result = validator.validateFAQSection(post);

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("validateAll", () => {
    it("should pass for a fully valid post", () => {
      const content = `
# Main Title

## Section 1
### Subsection 1.1
### Subsection 1.2

## Section 2
### Subsection 2.1
### Subsection 2.2

## Section 3
### Subsection 3.1
### Subsection 3.2

## Section 4
### Subsection 4.1
### Subsection 4.2

## Section 5
### Subsection 5.1
### Subsection 5.2
### Subsection 5.3
### Subsection 5.4

${createContentWithWordCount(3000)}

${Array.from({ length: 22 }, (_, i) => `[Link ${i}](/blog/post-${i})`).join(" ")}
      `.trim();

      const post = createMockPost({ content });

      const result = validator.validateAll(post, []);

      if (!result.passed) {
        console.log("Validation errors:", result.errors);
        console.log("Validation warnings:", result.warnings);
      }

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should collect all errors from multiple validations", () => {
      const post = createMockPost({
        content: "Short content",
        frontmatter: {
          ...createMockPost().frontmatter,
          title: "",
          slug: "Invalid Slug",
        },
      });

      const result = validator.validateAll(post, []);

      expect(result.passed).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});
