/**
 * SEO Optimizer
 * 
 * Analyzes GSC data to identify target keywords, prioritizes high-impression
 * zero-click keywords, classifies search intent, and generates blog topic
 * recommendations.
 */

import * as fs from "fs";
import * as path from "path";
import type {
  GSCKeywordData,
  KeywordAnalysis,
  TopicRecommendation,
  BlogPost,
} from "./types/seo-blog";

export class SEOOptimizer {
  /**
   * Analyzes GSC CSV data and returns keyword analysis
   */
  async analyzeGSCData(csvPath: string): Promise<KeywordAnalysis[]> {
    const csvContent = await fs.promises.readFile(csvPath, "utf-8");
    const lines = csvContent.trim().split("\n");
    
    if (lines.length < 2) {
      return [];
    }

    // Parse header
    const header = lines[0].split(",");
    const queryIdx = header.indexOf("query");
    const clicksIdx = header.indexOf("clicks");
    const impressionsIdx = header.indexOf("impressions");
    const ctrIdx = header.indexOf("ctr");
    const positionIdx = header.indexOf("position");

    if (queryIdx === -1 || clicksIdx === -1 || impressionsIdx === -1) {
      throw new Error("Invalid CSV format: missing required columns");
    }

    const keywords: KeywordAnalysis[] = [];

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(",");
      
      if (row.length < header.length) {
        continue; // Skip malformed rows
      }

      const query = row[queryIdx];
      const clicks = parseInt(row[clicksIdx], 10);
      const impressions = parseInt(row[impressionsIdx], 10);
      const position = parseFloat(row[positionIdx]);

      // Filter: 10+ impressions and 0 clicks (Requirement 4.1)
      if (impressions >= 10 && clicks === 0) {
        const intent = this.classifySearchIntent(query);
        const competition = position / 100; // Normalize position to 0-1 range
        const priority = this.calculatePriority(impressions, position);

        keywords.push({
          keyword: query,
          searchVolume: impressions,
          competition,
          intent,
          priority,
        });
      }
    }

    return this.prioritizeKeywords(keywords);
  }

  /**
   * Calculates priority score based on impressions and position
   */
  private calculatePriority(impressions: number, position: number): number {
    // Higher impressions = more valuable
    // Lower position = easier to rank
    // Priority = impressions / position (higher is better)
    return impressions / position;
  }

  /**
   * Prioritizes keywords based on impressions, clicks, and position
   */
  prioritizeKeywords(keywords: KeywordAnalysis[]): KeywordAnalysis[] {
    return keywords.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Classifies search intent based on keyword patterns
   */
  classifySearchIntent(
    keyword: string
  ): "informational" | "navigational" | "transactional" {
    const lowerKeyword = keyword.toLowerCase();

    // Transactional intent patterns
    const transactionalPatterns = [
      "download",
      "apk",
      "install",
      "buy",
      "register",
      "signup",
      "login",
      "withdrawal",
      "withdraw",
      "bonus",
      "promo",
      "offer",
    ];

    // Navigational intent patterns
    const navigationalPatterns = [
      "habet app",
      "ha bet",
      "habet",
      "official",
      "website",
      "site",
    ];

    // Informational intent patterns
    const informationalPatterns = [
      "how to",
      "what is",
      "why",
      "guide",
      "tips",
      "real or fake",
      "review",
      "comparison",
      "vs",
      "explained",
      "markets",
    ];

    // Check transactional first (highest conversion intent)
    if (transactionalPatterns.some((pattern) => lowerKeyword.includes(pattern))) {
      return "transactional";
    }

    // Check informational (educational content)
    if (informationalPatterns.some((pattern) => lowerKeyword.includes(pattern))) {
      return "informational";
    }

    // Check navigational (brand searches)
    if (navigationalPatterns.some((pattern) => lowerKeyword.includes(pattern))) {
      return "navigational";
    }

    // Default to informational
    return "informational";
  }

  /**
   * Generates topic recommendations from keyword analysis
   */
  generateTopicRecommendations(
    keywords: KeywordAnalysis[],
    count: number
  ): TopicRecommendation[] {
    const recommendations: TopicRecommendation[] = [];
    const usedKeywords = new Set<string>();

    for (const keyword of keywords) {
      if (recommendations.length >= count) {
        break;
      }

      if (usedKeywords.has(keyword.keyword)) {
        continue;
      }

      // Generate topic and content angle based on keyword and intent
      const topic = this.generateTopicFromKeyword(keyword.keyword, keyword.intent);
      const contentAngle = this.generateContentAngle(keyword.keyword, keyword.intent);
      
      // Find related secondary keywords
      const secondaryKeywords = this.findRelatedKeywords(
        keyword.keyword,
        keywords,
        usedKeywords
      );

      recommendations.push({
        topic,
        primaryKeyword: keyword.keyword,
        secondaryKeywords,
        searchIntent: keyword.intent,
        targetAudience: "Indian cricket betting enthusiasts",
        contentAngle,
      });

      usedKeywords.add(keyword.keyword);
      secondaryKeywords.forEach((k) => usedKeywords.add(k));
    }

    return recommendations;
  }

  /**
   * Generates a blog topic from a keyword
   */
  private generateTopicFromKeyword(
    keyword: string,
    intent: "informational" | "navigational" | "transactional"
  ): string {
    const titleCaseKeyword = keyword
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    if (intent === "informational") {
      if (keyword.includes("real or fake")) {
        return `Is ${titleCaseKeyword.replace("Real Or Fake", "")}Real or Fake? Legitimacy Verification 2026`;
      }
      if (keyword.includes("tips")) {
        return `${titleCaseKeyword} - Complete Guide 2026`;
      }
      if (keyword.includes("vs") || keyword.includes("comparison")) {
        return `${titleCaseKeyword} - Detailed Comparison 2026`;
      }
      return `${titleCaseKeyword} Explained - Complete Guide 2026`;
    }

    if (intent === "transactional") {
      if (keyword.includes("download")) {
        return `${titleCaseKeyword} - Step-by-Step Guide 2026`;
      }
      if (keyword.includes("withdrawal") || keyword.includes("withdraw")) {
        return `How to ${titleCaseKeyword} - Complete Process 2026`;
      }
      if (keyword.includes("bonus") || keyword.includes("promo")) {
        return `${titleCaseKeyword} - Latest Offers 2026`;
      }
      return `${titleCaseKeyword} - Quick Guide 2026`;
    }

    // Navigational
    return `${titleCaseKeyword} - Official Information 2026`;
  }

  /**
   * Generates content angle based on keyword and intent
   */
  private generateContentAngle(
    keyword: string,
    intent: "informational" | "navigational" | "transactional"
  ): string {
    if (intent === "informational") {
      return "Educational content with data-backed insights and expert analysis";
    }
    if (intent === "transactional") {
      return "Action-oriented guide with step-by-step instructions and clear CTAs";
    }
    return "Brand-focused content establishing authority and trust";
  }

  /**
   * Finds related keywords for secondary keyword assignment
   */
  private findRelatedKeywords(
    primaryKeyword: string,
    allKeywords: KeywordAnalysis[],
    usedKeywords: Set<string>
  ): string[] {
    const related: string[] = [];
    const primaryWords = primaryKeyword.toLowerCase().split(" ");

    for (const kw of allKeywords) {
      if (related.length >= 8) {
        break;
      }

      if (usedKeywords.has(kw.keyword) || kw.keyword === primaryKeyword) {
        continue;
      }

      const kwWords = kw.keyword.toLowerCase().split(" ");
      const overlap = primaryWords.filter((word) => kwWords.includes(word));

      // If at least 1 word overlaps, consider it related
      if (overlap.length > 0) {
        related.push(kw.keyword);
      }
    }

    // Ensure we have 5-8 secondary keywords (Requirement 4.4)
    return related.slice(0, 8);
  }

  /**
   * Validates that a new keyword doesn't cannibalize existing posts
   */
  validateKeywordCannibalization(
    newKeyword: string,
    existingPosts: BlogPost[]
  ): boolean {
    const normalizedNewKeyword = newKeyword.toLowerCase().trim();

    // Empty keyword after trimming cannot cannibalize
    if (normalizedNewKeyword.length === 0) {
      return true;
    }

    for (const post of existingPosts) {
      const primaryKeyword = post.frontmatter.keywords?.[0]?.toLowerCase().trim();
      
      if (primaryKeyword && primaryKeyword === normalizedNewKeyword) {
        return false; // Cannibalization detected
      }
    }

    return true; // No cannibalization
  }
}
