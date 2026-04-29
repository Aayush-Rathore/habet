/**
 * Blog Generator
 * 
 * Orchestrates blog post creation workflow, calling Gemini AI to generate
 * content, constructing frontmatter, validating content, and managing file
 * creation.
 */

import fs from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { generateBlogPost as generateWithGemini } from "./gemini";
import { ContentValidator } from "./content-validator";
import { InternalLinkManager } from "./internal-link-manager";
import { ContentInventoryTracker } from "./content-inventory";
import { slugify } from "./slugify";
import type {
  BlogGeneratorConfig,
  BlogGenerationRequest,
  BlogGenerationResult,
  BlogPost,
  LinkTarget,
  ContentInventoryEntry,
} from "./types/seo-blog";

export class BlogGenerator {
  private validator: ContentValidator;
  private linkManager: InternalLinkManager;
  private inventoryTracker: ContentInventoryTracker;

  constructor(private config: BlogGeneratorConfig) {
    this.validator = new ContentValidator();
    this.linkManager = new InternalLinkManager({
      targetLinkCount: { min: 20, max: 25 },
      distribution: {
        introLinks: 2,
        bodyLinks: { min: 15, max: 18 },
        conclusionLinks: { min: 3, max: 5 },
        maxLinksPerParagraph: 3,
      },
      linkTargets: [], // Will be populated when inserting links
    });
    this.inventoryTracker = new ContentInventoryTracker();
  }

  /**
   * Generates a single blog post from a topic and keywords
   */
  async generateBlogPost(
    request: BlogGenerationRequest
  ): Promise<BlogGenerationResult> {
    try {
      // Step 1: Generate content with Gemini AI
      const rawContent = await this.generateContentWithRetry(
        request.topic,
        [request.primaryKeyword, ...request.secondaryKeywords]
      );

      // Step 2: Extract title from content
      const title = this.extractTitle(rawContent);
      if (!title) {
        return {
          success: false,
          slug: "",
          title: "",
          wordCount: 0,
          internalLinkCount: 0,
          validationErrors: ["Failed to extract title from generated content"],
        };
      }

      // Step 3: Generate slug from title
      const slug = slugify(title);

      // Step 4: Extract excerpt from content
      const excerpt = this.extractExcerpt(rawContent, request.primaryKeyword);

      // Step 5: Calculate reading time
      const wordCount = this.countWords(rawContent);
      const readingTime = this.calculateReadingTime(wordCount);

      // Step 6: Construct frontmatter
      const frontmatter = {
        title,
        slug,
        date: new Date().toISOString(),
        excerpt,
        keywords: [request.primaryKeyword, ...request.secondaryKeywords],
        author: this.config.author,
        readingTime,
        id: uuidv4(),
      };

      // Step 7: Create BlogPost object
      const blogPost: BlogPost = {
        frontmatter,
        content: rawContent,
      };

      // Step 8: Validate content before linking
      const existingPosts = await this.loadExistingPosts();
      const preValidation = this.validator.validateAll(blogPost, existingPosts);

      if (!preValidation.passed) {
        return {
          success: false,
          slug,
          title,
          wordCount,
          internalLinkCount: 0,
          validationErrors: preValidation.errors,
        };
      }

      // Step 9: Insert internal links
      const linkTargets = await this.getLinkTargets();
      const contentWithLinks = await this.linkManager.insertLinks(
        rawContent,
        linkTargets
      );

      // Update blog post with linked content
      blogPost.content = contentWithLinks;

      // Step 10: Count internal links
      const internalLinkCount = this.countInternalLinks(contentWithLinks);

      // Step 11: Final validation
      const finalValidation = this.validator.validateAll(blogPost, existingPosts);

      if (!finalValidation.passed) {
        return {
          success: false,
          slug,
          title,
          wordCount,
          internalLinkCount,
          validationErrors: finalValidation.errors,
        };
      }

      // Step 12: Write file to disk
      await this.writeMarkdownFile(blogPost);

      // Step 13: Log to content inventory
      const inventoryEntry: ContentInventoryEntry = {
        id: frontmatter.id!,
        slug,
        title,
        primaryKeyword: request.primaryKeyword,
        secondaryKeywords: request.secondaryKeywords,
        wordCount,
        internalLinkCount,
        createdAt: frontmatter.date,
        schemaType: "Article", // Will be assigned by inventory tracker
      };

      await this.inventoryTracker.logPost(inventoryEntry);

      return {
        success: true,
        slug,
        title,
        wordCount,
        internalLinkCount,
        validationErrors: [],
      };
    } catch (error) {
      return {
        success: false,
        slug: "",
        title: "",
        wordCount: 0,
        internalLinkCount: 0,
        validationErrors: [
          error instanceof Error ? error.message : "Unknown error occurred",
        ],
      };
    }
  }

  /**
   * Generates multiple blog posts in batch
   */
  async generateMultiplePosts(
    requests: BlogGenerationRequest[]
  ): Promise<BlogGenerationResult[]> {
    const results: BlogGenerationResult[] = [];

    for (const request of requests) {
      const result = await this.generateBlogPost(request);
      results.push(result);

      // Add delay between requests to avoid rate limiting
      if (result.success) {
        await this.delay(2000); // 2 second delay
      }
    }

    return results;
  }

  // ── Private Helper Methods ──────────────────────────────────────────────

  /**
   * Generates content with Gemini AI with retry logic
   */
  private async generateContentWithRetry(
    topic: string,
    keywords: string[],
    maxRetries: number = 3
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const content = await generateWithGemini(topic, keywords);
        return content;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");

        if (attempt < maxRetries) {
          // Exponential backoff: 2s, 4s, 8s
          const delay = Math.pow(2, attempt) * 1000;
          await this.delay(delay);
        }
      }
    }

    throw new Error(
      `Gemini API failed after ${maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * Extracts title from markdown content (first H1)
   */
  private extractTitle(content: string): string | null {
    const h1Match = content.match(/^#\s+(.+)$/m);
    return h1Match ? h1Match[1].trim() : null;
  }

  /**
   * Extracts excerpt from content (first paragraph, 150-160 chars)
   */
  private extractExcerpt(content: string, primaryKeyword: string): string {
    // Remove H1 heading
    const contentWithoutH1 = content.replace(/^#\s+.+$/m, "").trim();

    // Get first paragraph
    const paragraphs = contentWithoutH1.split(/\n\n+/);
    let firstParagraph = "";

    for (const para of paragraphs) {
      // Skip headings and empty paragraphs
      if (!para.startsWith("#") && para.trim().length > 0) {
        firstParagraph = para.trim();
        break;
      }
    }

    if (!firstParagraph) {
      // Fallback: use primary keyword
      return `Complete guide to ${primaryKeyword}. Learn everything you need to know about ${primaryKeyword} in 2026.`;
    }

    // Clean markdown formatting
    let excerpt = firstParagraph
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links
      .replace(/[*_~`]/g, "") // Remove formatting
      .replace(/\n/g, " ") // Replace newlines with spaces
      .trim();

    // Ensure excerpt includes primary keyword
    if (!excerpt.toLowerCase().includes(primaryKeyword.toLowerCase())) {
      excerpt = `${primaryKeyword}: ${excerpt}`;
    }

    // Truncate to 150-160 characters
    if (excerpt.length > 160) {
      excerpt = excerpt.substring(0, 157) + "...";
    } else if (excerpt.length < 150) {
      // Pad with additional context if too short
      const padding = ` Learn more about ${primaryKeyword}.`;
      if (excerpt.length + padding.length <= 160) {
        excerpt += padding;
      }
    }

    return excerpt;
  }

  /**
   * Calculates reading time based on word count (200 words/min)
   */
  private calculateReadingTime(wordCount: number): string {
    const minutes = Math.ceil(wordCount / 200);
    return `${minutes} min read`;
  }

  /**
   * Counts words in content
   */
  private countWords(content: string): number {
    const cleanContent = content
      .replace(/^#+\s+/gm, "") // Remove heading markers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links, keep text
      .replace(/[*_~`]/g, "") // Remove formatting
      .replace(/\n+/g, " ") // Replace newlines with spaces
      .trim();

    if (cleanContent.length === 0) return 0;

    return cleanContent.split(/\s+/).filter((word) => word.length > 0).length;
  }

  /**
   * Counts internal links in content
   */
  private countInternalLinks(content: string): number {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let count = 0;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const url = match[2];
      // Internal links start with / and don't include protocol
      if (url.startsWith("/") && !url.startsWith("//")) {
        count++;
      }
    }

    return count;
  }

  /**
   * Loads existing blog posts for validation
   */
  private async loadExistingPosts(): Promise<BlogPost[]> {
    const blogsDir = path.join(process.cwd(), "content", "blogs");
    const posts: BlogPost[] = [];

    try {
      const files = await fs.readdir(blogsDir);

      for (const file of files) {
        if (file.endsWith(".md")) {
          const filePath = path.join(blogsDir, file);
          const content = await fs.readFile(filePath, "utf-8");
          const parsed = this.parseMarkdownFile(content);
          posts.push(parsed);
        }
      }
    } catch (error) {
      // Directory might not exist yet
      return [];
    }

    return posts;
  }

  /**
   * Gets link targets for internal linking
   */
  private async getLinkTargets(): Promise<LinkTarget[]> {
    const targets: LinkTarget[] = [];

    // Add homepage
    targets.push({
      url: "/",
      title: "HABET Sports Betting App",
      keywords: ["HABET", "HABET APK", "HABET app", "sports betting"],
      type: "page",
    });

    // Add other pages
    targets.push({
      url: "/about",
      title: "About HABET",
      keywords: ["about", "HABET team", "company"],
      type: "page",
    });

    targets.push({
      url: "/disclaimer",
      title: "Disclaimer",
      keywords: ["disclaimer", "legal", "terms"],
      type: "page",
    });

    // Add existing blog posts
    const existingPosts = await this.loadExistingPosts();

    for (const post of existingPosts) {
      targets.push({
        url: `/blog/${post.frontmatter.slug}`,
        title: post.frontmatter.title,
        keywords: post.frontmatter.keywords || [],
        type: "blog",
      });
    }

    return targets;
  }

  /**
   * Writes blog post to markdown file
   */
  private async writeMarkdownFile(post: BlogPost): Promise<void> {
    const { frontmatter, content } = post;
    const filePath = path.join(
      process.cwd(),
      this.config.outputDir,
      `${frontmatter.slug}.md`
    );

    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // Construct YAML frontmatter
    let yaml = "---\n";
    yaml += `title: "${frontmatter.title}"\n`;
    yaml += `slug: "${frontmatter.slug}"\n`;
    yaml += `date: "${frontmatter.date}"\n`;
    yaml += `excerpt: "${frontmatter.excerpt}"\n`;
    yaml += `keywords:\n`;
    for (const keyword of frontmatter.keywords) {
      yaml += `  - ${keyword}\n`;
    }
    yaml += `author: "${frontmatter.author}"\n`;
    yaml += `readingTime: "${frontmatter.readingTime}"\n`;
    if (frontmatter.id) {
      yaml += `id: "${frontmatter.id}"\n`;
    }
    if (frontmatter.lastUpdated) {
      yaml += `lastUpdated: "${frontmatter.lastUpdated}"\n`;
    }
    yaml += "---\n\n";

    // Write file
    await fs.writeFile(filePath, yaml + content, "utf-8");
  }

  /**
   * Parses markdown file into BlogPost object
   */
  private parseMarkdownFile(fileContent: string): BlogPost {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = fileContent.match(frontmatterRegex);

    if (!match) {
      return {
        frontmatter: {
          title: "",
          slug: "",
          date: "",
          excerpt: "",
          keywords: [],
          author: "",
          readingTime: "",
        },
        content: fileContent,
      };
    }

    const frontmatterText = match[1];
    const content = match[2];

    // Simple YAML parsing
    const frontmatter: any = {
      keywords: [],
    };

    const lines = frontmatterText.split("\n");
    let currentKey = "";
    let inArray = false;

    for (const line of lines) {
      if (line.trim().startsWith("-")) {
        // Array item
        if (inArray && currentKey) {
          const value = line.trim().substring(1).trim();
          if (!Array.isArray(frontmatter[currentKey])) {
            frontmatter[currentKey] = [];
          }
          frontmatter[currentKey].push(value);
        }
      } else if (line.includes(":")) {
        // Key-value pair
        const colonIndex = line.indexOf(":");
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();

        currentKey = key;

        if (value === "") {
          // Likely an array follows
          inArray = true;
          frontmatter[key] = [];
        } else {
          inArray = false;
          // Remove quotes if present
          frontmatter[key] = value.replace(/^["']|["']$/g, "");
        }
      }
    }

    return {
      frontmatter,
      content,
    };
  }

  /**
   * Delays execution for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
