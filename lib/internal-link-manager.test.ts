/**
 * Unit Tests for Internal Link Manager
 * 
 * Tests the updateExistingPost method functionality
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { InternalLinkManager } from "./internal-link-manager";
import type { LinkTarget, InternalLinkConfig } from "./types/seo-blog";
import fs from "fs/promises";
import path from "path";

describe("InternalLinkManager - updateExistingPost", () => {
  const testSlug = "test-post-update";
  const testFilePath = path.join(process.cwd(), "content", "blogs", `${testSlug}.md`);
  
  const config: InternalLinkConfig = {
    targetLinkCount: { min: 8, max: 12 },
    distribution: {
      introLinks: 2,
      bodyLinks: { min: 4, max: 6 },
      conclusionLinks: { min: 2, max: 4 },
      maxLinksPerParagraph: 3,
    },
    linkTargets: [],
  };

  const originalContent = `---
title: "Test Blog Post"
slug: "test-post-update"
date: "2026-01-20T10:00:00Z"
excerpt: "This is a test blog post for testing the updateExistingPost method."
keywords:
  - test
  - blog
  - cricket
author: "HABET Sports Team"
readingTime: "5 min read"
---

# Test Blog Post

This is the introduction paragraph. It talks about cricket betting and HABET app features.

## Section 1

This section discusses cricket betting strategies. The HABET platform offers great odds.

## Section 2

Here we talk about IPL betting and how to download the app.

## Conclusion

In conclusion, cricket betting is exciting and the HABET app makes it easy.`;

  beforeEach(async () => {
    // Create test file
    await fs.mkdir(path.dirname(testFilePath), { recursive: true });
    await fs.writeFile(testFilePath, originalContent, "utf-8");
  });

  afterEach(async () => {
    // Clean up test file
    try {
      await fs.unlink(testFilePath);
    } catch {
      // File might not exist
    }
  });

  it("should read and parse existing blog post", async () => {
    const linkTargets: LinkTarget[] = [
      {
        url: "/",
        title: "HABET Homepage",
        keywords: ["HABET app", "HABET platform"],
        type: "page",
      },
      {
        url: "/blog/cricket-betting-tips",
        title: "Cricket Betting Tips",
        keywords: ["cricket betting", "betting strategies"],
        type: "blog",
      },
    ];

    const manager = new InternalLinkManager({ ...config, linkTargets });
    
    // Update the post
    await manager.updateExistingPost(testSlug, linkTargets);
    
    // Read the updated file
    const updatedFileContent = await fs.readFile(testFilePath, "utf-8");
    
    // Verify file was updated
    expect(updatedFileContent).toBeTruthy();
    expect(updatedFileContent.length).toBeGreaterThan(0);
  });

  it("should preserve frontmatter fields", async () => {
    const linkTargets: LinkTarget[] = [
      {
        url: "/",
        title: "HABET Homepage",
        keywords: ["HABET app"],
        type: "page",
      },
    ];

    const manager = new InternalLinkManager({ ...config, linkTargets });
    
    await manager.updateExistingPost(testSlug, linkTargets);
    
    const updatedFileContent = await fs.readFile(testFilePath, "utf-8");
    
    // Verify original frontmatter is preserved
    expect(updatedFileContent).toContain('title: "Test Blog Post"');
    expect(updatedFileContent).toContain('slug: "test-post-update"');
    expect(updatedFileContent).toContain('date: "2026-01-20T10:00:00Z"');
    expect(updatedFileContent).toContain('author: "HABET Sports Team"');
    expect(updatedFileContent).toContain('readingTime: "5 min read"');
    expect(updatedFileContent).toContain("- test");
    expect(updatedFileContent).toContain("- blog");
    expect(updatedFileContent).toContain("- cricket");
  });

  it("should add lastUpdated field to frontmatter", async () => {
    const linkTargets: LinkTarget[] = [
      {
        url: "/",
        title: "HABET Homepage",
        keywords: ["HABET app"],
        type: "page",
      },
    ];

    const manager = new InternalLinkManager({ ...config, linkTargets });
    
    const beforeUpdate = new Date();
    await manager.updateExistingPost(testSlug, linkTargets);
    const afterUpdate = new Date();
    
    const updatedFileContent = await fs.readFile(testFilePath, "utf-8");
    
    // Verify lastUpdated field was added
    expect(updatedFileContent).toContain("lastUpdated:");
    
    // Extract lastUpdated value
    const lastUpdatedMatch = updatedFileContent.match(/lastUpdated: "([^"]+)"/);
    expect(lastUpdatedMatch).toBeTruthy();
    
    if (lastUpdatedMatch) {
      const lastUpdatedDate = new Date(lastUpdatedMatch[1]);
      expect(lastUpdatedDate.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
      expect(lastUpdatedDate.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
    }
  });

  it("should preserve content structure (headings and paragraphs)", async () => {
    const linkTargets: LinkTarget[] = [
      {
        url: "/",
        title: "HABET Homepage",
        keywords: ["HABET app", "HABET platform"],
        type: "page",
      },
    ];

    const manager = new InternalLinkManager({ ...config, linkTargets });
    
    await manager.updateExistingPost(testSlug, linkTargets);
    
    const updatedFileContent = await fs.readFile(testFilePath, "utf-8");
    
    // Verify headings are preserved
    expect(updatedFileContent).toContain("# Test Blog Post");
    expect(updatedFileContent).toContain("## Section 1");
    expect(updatedFileContent).toContain("## Section 2");
    expect(updatedFileContent).toContain("## Conclusion");
    
    // Count headings in original and updated content
    const originalHeadings = originalContent.match(/^#{1,6}\s+.+$/gm) || [];
    const updatedHeadings = updatedFileContent.match(/^#{1,6}\s+.+$/gm) || [];
    
    expect(updatedHeadings.length).toBe(originalHeadings.length);
  });

  it("should insert links into content", async () => {
    const linkTargets: LinkTarget[] = [
      {
        url: "/",
        title: "HABET Homepage",
        keywords: ["HABET app", "HABET platform"],
        type: "page",
      },
      {
        url: "/blog/cricket-betting-tips",
        title: "Cricket Betting Tips",
        keywords: ["cricket betting"],
        type: "blog",
      },
      {
        url: "/blog/ipl-betting-guide",
        title: "IPL Betting Guide",
        keywords: ["IPL betting"],
        type: "blog",
      },
    ];

    const manager = new InternalLinkManager({ ...config, linkTargets });
    
    await manager.updateExistingPost(testSlug, linkTargets);
    
    const updatedFileContent = await fs.readFile(testFilePath, "utf-8");
    
    // Verify links were inserted (content should be longer)
    expect(updatedFileContent.length).toBeGreaterThan(originalContent.length);
    
    // Check for markdown link format
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links = updatedFileContent.match(linkRegex);
    
    // Should have at least some links inserted
    if (links) {
      expect(links.length).toBeGreaterThan(0);
      
      // Verify links use relative URLs
      for (const link of links) {
        const urlMatch = link.match(/\(([^)]+)\)/);
        if (urlMatch) {
          expect(urlMatch[1]).toMatch(/^\//);
        }
      }
    }
  });

  it("should write updated content back to file", async () => {
    const linkTargets: LinkTarget[] = [
      {
        url: "/",
        title: "HABET Homepage",
        keywords: ["HABET app"],
        type: "page",
      },
    ];

    const manager = new InternalLinkManager({ ...config, linkTargets });
    
    // Get original file stats
    const originalStats = await fs.stat(testFilePath);
    
    // Wait a bit to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 10));
    
    await manager.updateExistingPost(testSlug, linkTargets);
    
    // Get updated file stats
    const updatedStats = await fs.stat(testFilePath);
    
    // Verify file was modified
    expect(updatedStats.mtimeMs).toBeGreaterThan(originalStats.mtimeMs);
  });
});
