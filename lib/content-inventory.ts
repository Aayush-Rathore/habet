/**
 * Content Inventory Tracker
 * 
 * Tracks metadata for generated blog posts, maintains keyword assignments,
 * generates summary reports, and provides data structure for GSC performance
 * tracking.
 */

import fs from "fs/promises";
import path from "path";
import type {
  ContentInventoryEntry,
  ContentInventorySummary,
  ContentInventoryDatabase,
} from "./types/seo-blog";

export class ContentInventoryTracker {
  private inventoryPath: string;
  private database: ContentInventoryDatabase | null = null;

  constructor(inventoryPath: string = "content/inventory.json") {
    this.inventoryPath = inventoryPath;
  }

  /**
   * Loads the inventory database from disk
   */
  private async loadDatabase(): Promise<ContentInventoryDatabase> {
    if (this.database) {
      return this.database;
    }

    try {
      const data = await fs.readFile(this.inventoryPath, "utf-8");
      this.database = JSON.parse(data);
      return this.database!;
    } catch (error) {
      // If file doesn't exist, create new database
      this.database = {
        posts: [],
        keywordMap: {},
        metadata: {
          lastGenerated: new Date().toISOString(),
          totalPosts: 0,
          version: "1.0.0",
        },
      };
      return this.database;
    }
  }

  /**
   * Saves the inventory database to disk
   */
  private async saveDatabase(): Promise<void> {
    if (!this.database) {
      throw new Error("Database not loaded");
    }

    // Ensure directory exists
    const dir = path.dirname(this.inventoryPath);
    await fs.mkdir(dir, { recursive: true });

    // Write database to file
    await fs.writeFile(
      this.inventoryPath,
      JSON.stringify(this.database, null, 2),
      "utf-8"
    );
  }

  /**
   * Assigns schema type based on content structure
   */
  private assignSchemaType(entry: ContentInventoryEntry): "Article" | "HowTo" | "FAQPage" {
    const title = entry.title.toLowerCase();
    const keywords = entry.secondaryKeywords.map(k => k.toLowerCase());

    // Check for HowTo indicators
    if (
      title.includes("how to") ||
      title.includes("guide") ||
      title.includes("step-by-step") ||
      keywords.some(k => k.includes("how to") || k.includes("guide"))
    ) {
      return "HowTo";
    }

    // Check for FAQPage indicators
    if (
      title.includes("faq") ||
      title.includes("questions") ||
      keywords.some(k => k.includes("faq") || k.includes("questions"))
    ) {
      return "FAQPage";
    }

    // Default to Article
    return "Article";
  }

  /**
   * Logs a new blog post to the inventory
   */
  async logPost(entry: ContentInventoryEntry): Promise<void> {
    const db = await this.loadDatabase();

    // Always assign schema type based on content structure
    entry.schemaType = this.assignSchemaType(entry);

    // Check for duplicate slug
    const existingPost = db.posts.find(p => p.slug === entry.slug);
    if (existingPost) {
      throw new Error(`Post with slug "${entry.slug}" already exists in inventory`);
    }

    // Check for keyword conflict
    if (db.keywordMap[entry.primaryKeyword]) {
      throw new Error(
        `Primary keyword "${entry.primaryKeyword}" already assigned to post "${db.keywordMap[entry.primaryKeyword]}"`
      );
    }

    // Add post to database
    db.posts.push(entry);
    db.keywordMap[entry.primaryKeyword] = entry.slug;
    db.metadata.totalPosts = db.posts.length;
    db.metadata.lastGenerated = new Date().toISOString();

    await this.saveDatabase();
  }

  /**
   * Updates an existing post in the inventory
   */
  async updatePost(
    slug: string,
    updates: Partial<ContentInventoryEntry>
  ): Promise<void> {
    const db = await this.loadDatabase();

    const postIndex = db.posts.findIndex(p => p.slug === slug);
    if (postIndex === -1) {
      throw new Error(`Post with slug "${slug}" not found in inventory`);
    }

    const existingPost = db.posts[postIndex];

    // If primary keyword is being updated, check for conflicts
    if (updates.primaryKeyword && updates.primaryKeyword !== existingPost.primaryKeyword) {
      if (db.keywordMap[updates.primaryKeyword]) {
        throw new Error(
          `Primary keyword "${updates.primaryKeyword}" already assigned to post "${db.keywordMap[updates.primaryKeyword]}"`
        );
      }

      // Remove old keyword mapping
      delete db.keywordMap[existingPost.primaryKeyword];
      // Add new keyword mapping
      db.keywordMap[updates.primaryKeyword] = slug;
    }

    // Update post
    db.posts[postIndex] = {
      ...existingPost,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };

    db.metadata.lastGenerated = new Date().toISOString();

    await this.saveDatabase();
  }

  /**
   * Generates a summary report of all posts
   */
  async generateSummary(): Promise<ContentInventorySummary> {
    const db = await this.loadDatabase();

    const totalPosts = db.posts.length;
    const totalWordCount = db.posts.reduce((sum, post) => sum + post.wordCount, 0);
    const totalInternalLinks = db.posts.reduce((sum, post) => sum + post.internalLinkCount, 0);

    const keywordCoverage = new Map<string, string>();
    for (const [keyword, slug] of Object.entries(db.keywordMap)) {
      keywordCoverage.set(keyword, slug);
    }

    const averageWordCount = totalPosts > 0 ? totalWordCount / totalPosts : 0;
    const averageLinksPerPost = totalPosts > 0 ? totalInternalLinks / totalPosts : 0;

    return {
      totalPosts,
      totalWordCount,
      totalInternalLinks,
      keywordCoverage,
      averageWordCount,
      averageLinksPerPost,
    };
  }

  /**
   * Exports keyword mapping (keyword -> slug)
   */
  async exportKeywordMapping(): Promise<Map<string, string>> {
    const db = await this.loadDatabase();

    const mapping = new Map<string, string>();
    for (const [keyword, slug] of Object.entries(db.keywordMap)) {
      mapping.set(keyword, slug);
    }

    return mapping;
  }

  /**
   * Checks if a keyword conflicts with existing posts
   * @returns The slug of the conflicting post, or null if no conflict
   */
  async checkKeywordConflict(keyword: string): Promise<string | null> {
    const db = await this.loadDatabase();
    return db.keywordMap[keyword] || null;
  }
}
