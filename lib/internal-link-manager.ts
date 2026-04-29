/**
 * Internal Link Manager
 * 
 * Manages strategic internal linking across blog posts, inserting 20-25
 * contextually relevant links per post and updating existing posts with
 * bidirectional links.
 */

import fs from "fs/promises";
import path from "path";
import type {
  LinkInsertionPoint,
  LinkTarget,
  InternalLinkConfig,
} from "./types/seo-blog";

export class InternalLinkManager {
  constructor(private config: InternalLinkConfig) {}

  /**
   * Inserts internal links into blog content
   */
  async insertLinks(
    content: string,
    linkTargets: LinkTarget[]
  ): Promise<string> {
    const insertionPoints = this.findInsertionPoints(content, linkTargets);
    
    // Sort by position (descending) to insert from end to start
    // This prevents position shifts as we insert
    const sortedPoints = [...insertionPoints].sort((a, b) => {
      if (b.paragraphIndex !== a.paragraphIndex) {
        return b.paragraphIndex - a.paragraphIndex;
      }
      return b.sentenceIndex - a.sentenceIndex;
    });

    // Split content into blocks (paragraphs and headings)
    const blocks = content.split(/\n\n+/);
    
    // Separate paragraphs from headings
    const paragraphs = this.splitIntoParagraphs(content);
    
    // Create a map from paragraph content to block index
    const paragraphToBlockIndex = new Map<number, number>();
    let paragraphIndex = 0;
    
    for (let blockIndex = 0; blockIndex < blocks.length; blockIndex++) {
      const block = blocks[blockIndex].trim();
      if (block.length > 0 && !block.startsWith("#")) {
        paragraphToBlockIndex.set(paragraphIndex, blockIndex);
        paragraphIndex++;
      }
    }

    // Track links per paragraph
    const linksPerParagraph = new Map<number, number>();

    for (const point of sortedPoints) {
      const currentLinks = linksPerParagraph.get(point.paragraphIndex) || 0;
      
      // Enforce max links per paragraph
      if (currentLinks >= this.config.distribution.maxLinksPerParagraph) {
        continue;
      }

      const paragraph = paragraphs[point.paragraphIndex];
      if (!paragraph) continue;

      const sentences = this.splitIntoSentences(paragraph);
      const sentence = sentences[point.sentenceIndex];
      if (!sentence) continue;

      // Create markdown link
      const link = `[${point.anchorText}](${point.targetUrl})`;
      
      // Replace anchor text with link in the sentence
      const modifiedSentence = sentence.replace(point.anchorText, link);
      sentences[point.sentenceIndex] = modifiedSentence;
      
      // Rebuild paragraph
      const modifiedParagraph = sentences.join(" ");
      
      // Update the corresponding block
      const blockIndex = paragraphToBlockIndex.get(point.paragraphIndex);
      if (blockIndex !== undefined) {
        blocks[blockIndex] = modifiedParagraph;
      }
      
      linksPerParagraph.set(point.paragraphIndex, currentLinks + 1);
    }

    // Reconstruct content with original structure preserved
    return blocks.join("\n\n");
  }

  /**
   * Updates an existing blog post with new internal links
   */
  async updateExistingPost(
    slug: string,
    newLinkTargets: LinkTarget[]
  ): Promise<void> {
    const filePath = path.join(process.cwd(), "content", "blogs", `${slug}.md`);
    
    // Read existing file
    const fileContent = await fs.readFile(filePath, "utf-8");
    
    // Split frontmatter and content
    const { frontmatter, content } = this.parseFrontmatter(fileContent);
    
    // Insert links into content
    const updatedContent = await this.insertLinks(content, newLinkTargets);
    
    // Add lastUpdated field to frontmatter
    const now = new Date().toISOString();
    const updatedFrontmatter = { ...frontmatter, lastUpdated: now };
    
    // Reconstruct file
    const updatedFile = this.reconstructMarkdownFile(updatedFrontmatter, updatedContent);
    
    // Write back to file
    await fs.writeFile(filePath, updatedFile, "utf-8");
  }

  /**
   * Finds optimal insertion points for links in content
   */
  findInsertionPoints(
    content: string,
    linkTargets: LinkTarget[]
  ): LinkInsertionPoint[] {
    const insertionPoints: LinkInsertionPoint[] = [];
    const paragraphs = this.splitIntoParagraphs(content);
    
    // Identify content sections
    const sections = this.identifySections(paragraphs);
    
    // Calculate target links per section based on distribution strategy
    const targetLinks = {
      intro: this.config.distribution.introLinks,
      body: Math.floor(
        (this.config.distribution.bodyLinks.min + this.config.distribution.bodyLinks.max) / 2
      ),
      conclusion: Math.floor(
        (this.config.distribution.conclusionLinks.min + this.config.distribution.conclusionLinks.max) / 2
      ),
    };

    // Find insertion points for each section
    for (const section of ["intro", "body", "conclusion"] as const) {
      const sectionParagraphs = sections[section];
      const targetCount = targetLinks[section];
      
      const sectionPoints = this.findSectionInsertionPoints(
        sectionParagraphs,
        linkTargets,
        targetCount,
        paragraphs
      );
      
      insertionPoints.push(...sectionPoints);
    }

    // Sort by relevance and take top N links within target range
    const sorted = insertionPoints.sort((a, b) => b.relevanceScore - a.relevanceScore);
    let targetCount = Math.floor(
      (this.config.targetLinkCount.min + this.config.targetLinkCount.max) / 2
    );
    
    // Requirement 2.7: Ensure at least 1 homepage link per 1000 words when HABET mentions exist
    const wordCount = this.countWords(content);
    const habetMentions = this.countHabetMentions(content);
    
    if (habetMentions > 0) {
      const requiredHomepageLinks = Math.max(1, Math.floor(wordCount / 1000));
      const homepageLinks = sorted.filter(point => point.targetUrl === "/").length;
      
      // If we don't have enough homepage links, we need to ensure we include them
      if (homepageLinks < requiredHomepageLinks) {
        // Find all potential homepage link insertion points
        const homepageTarget = linkTargets.find(t => t.url === "/");
        if (homepageTarget) {
          const additionalHomepagePoints = this.findHomepageLinkPoints(
            paragraphs,
            homepageTarget,
            requiredHomepageLinks - homepageLinks
          );
          
          // Add these points with high priority
          for (const point of additionalHomepagePoints) {
            // Boost relevance score to ensure they're included
            point.relevanceScore += 100;
          }
          
          // Re-sort with the new homepage points
          sorted.push(...additionalHomepagePoints);
          sorted.sort((a, b) => b.relevanceScore - a.relevanceScore);
          
          // Ensure we include at least the required homepage links
          const minLinksNeeded = Math.min(sorted.length, targetCount + additionalHomepagePoints.length);
          targetCount = Math.max(targetCount, minLinksNeeded);
        }
      }
    }
    
    return sorted.slice(0, targetCount);
  }

  /**
   * Validates that all link targets exist
   */
  async validateLinkTargets(links: string[]): Promise<boolean> {
    for (const link of links) {
      // Extract path from relative URL
      if (!link.startsWith("/")) {
        return false; // Must be relative URL
      }

      // Check if it's a blog post
      if (link.startsWith("/blog/")) {
        const slug = link.replace("/blog/", "");
        const filePath = path.join(process.cwd(), "content", "blogs", `${slug}.md`);
        
        try {
          await fs.access(filePath);
        } catch {
          return false; // File doesn't exist
        }
      }
      // For pages, we assume they exist (/, /about, /disclaimer)
      // In a real implementation, we'd check the app router structure
    }

    return true;
  }

  // ── Private Helper Methods ──────────────────────────────────────────────

  private countWords(content: string): number {
    return content.split(/\s+/).filter((w) => w.length > 0).length;
  }

  private countHabetMentions(content: string): number {
    const regex = /\bHABET\s+(APK|app)\b/gi;
    const matches = content.match(regex);
    return matches ? matches.length : 0;
  }

  private findHomepageLinkPoints(
    paragraphs: string[],
    homepageTarget: LinkTarget,
    count: number
  ): LinkInsertionPoint[] {
    const points: LinkInsertionPoint[] = [];
    
    // First, look for sentences containing "HABET APK" or "HABET app"
    for (let paraIndex = 0; paraIndex < paragraphs.length && points.length < count; paraIndex++) {
      const paragraph = paragraphs[paraIndex];
      const sentences = this.splitIntoSentences(paragraph);
      
      for (let sentIndex = 0; sentIndex < sentences.length && points.length < count; sentIndex++) {
        const sentence = sentences[sentIndex];
        
        // Check if sentence contains HABET APK or HABET app
        const match = sentence.match(/\bHABET\s+(APK|app)\b/i);
        if (match) {
          points.push({
            paragraphIndex: paraIndex,
            sentenceIndex: sentIndex,
            anchorText: match[0],
            targetUrl: "/",
            relevanceScore: 10, // High base score for HABET mentions
          });
        }
      }
    }
    
    // If we still need more homepage links and didn't find enough HABET mentions,
    // insert generic homepage links in paragraphs that mention relevant keywords
    if (points.length < count) {
      for (let paraIndex = 0; paraIndex < paragraphs.length && points.length < count; paraIndex++) {
        const paragraph = paragraphs[paraIndex];
        
        // Skip paragraphs we've already added points for
        if (points.some(p => p.paragraphIndex === paraIndex)) {
          continue;
        }
        
        const sentences = this.splitIntoSentences(paragraph);
        if (sentences.length > 0) {
          // Try to find a sentence with keywords from the homepage target
          let bestSentIndex = 0;
          let bestMatch: string | null = null;
          
          for (let sentIndex = 0; sentIndex < sentences.length; sentIndex++) {
            const sentence = sentences[sentIndex];
            
            // Look for any of the homepage target keywords
            for (const keyword of homepageTarget.keywords) {
              const regex = new RegExp(`\\b${this.escapeRegex(keyword)}\\b`, "i");
              const match = sentence.match(regex);
              if (match) {
                bestSentIndex = sentIndex;
                bestMatch = match[0];
                break;
              }
            }
            
            if (bestMatch) break;
          }
          
          // If we found a keyword match, use it; otherwise use the first sentence
          points.push({
            paragraphIndex: paraIndex,
            sentenceIndex: bestSentIndex,
            anchorText: bestMatch || homepageTarget.keywords[0] || "HABET",
            targetUrl: "/",
            relevanceScore: bestMatch ? 8 : 5, // Lower score for generic links
          });
        }
      }
    }
    
    return points;
  }

  private splitIntoParagraphs(content: string): string[] {
    return content
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0 && !p.startsWith("#")); // Exclude headings
  }

  private splitIntoSentences(paragraph: string): string[] {
    // Simple sentence splitting on . ! ?
    return paragraph
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  private identifySections(paragraphs: string[]): {
    intro: number[];
    body: number[];
    conclusion: number[];
  } {
    const totalParagraphs = paragraphs.length;
    
    // Intro: first 2-3 paragraphs (10%)
    const introEnd = Math.max(2, Math.floor(totalParagraphs * 0.1));
    
    // Conclusion: last 3-5 paragraphs (15%)
    const conclusionStart = Math.max(
      introEnd + 1,
      totalParagraphs - Math.floor(totalParagraphs * 0.15)
    );
    
    const intro: number[] = [];
    const body: number[] = [];
    const conclusion: number[] = [];
    
    for (let i = 0; i < totalParagraphs; i++) {
      if (i < introEnd) {
        intro.push(i);
      } else if (i >= conclusionStart) {
        conclusion.push(i);
      } else {
        body.push(i);
      }
    }
    
    return { intro, body, conclusion };
  }

  private findSectionInsertionPoints(
    paragraphIndices: number[],
    linkTargets: LinkTarget[],
    targetCount: number,
    allParagraphs: string[]
  ): LinkInsertionPoint[] {
    const points: LinkInsertionPoint[] = [];
    
    for (const paraIndex of paragraphIndices) {
      const paragraph = allParagraphs[paraIndex];
      const sentences = this.splitIntoSentences(paragraph);
      
      for (let sentIndex = 0; sentIndex < sentences.length; sentIndex++) {
        const sentence = sentences[sentIndex];
        
        // Try to find matching link targets
        for (const target of linkTargets) {
          const anchorText = this.findAnchorText(sentence, target);
          
          if (anchorText) {
            const relevanceScore = this.calculateRelevance(sentence, target);
            
            points.push({
              paragraphIndex: paraIndex,
              sentenceIndex: sentIndex,
              anchorText,
              targetUrl: target.url,
              relevanceScore,
            });
          }
        }
      }
    }
    
    // Sort by relevance and return top N for this section
    return points.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, targetCount);
  }

  private findAnchorText(sentence: string, target: LinkTarget): string | null {
    const lowerSentence = sentence.toLowerCase();
    
    // Check if any target keywords appear in the sentence
    for (const keyword of target.keywords) {
      const lowerKeyword = keyword.toLowerCase();
      
      // Look for exact keyword match
      const regex = new RegExp(`\\b${this.escapeRegex(lowerKeyword)}\\b`, "i");
      const match = sentence.match(regex);
      
      if (match) {
        return match[0]; // Return the matched text with original casing
      }
    }
    
    // Special case: "HABET APK" or "HABET app" should link to homepage
    if (target.url === "/" && /\bHABET\s+(APK|app)\b/i.test(sentence)) {
      const match = sentence.match(/\bHABET\s+(APK|app)\b/i);
      return match ? match[0] : null;
    }
    
    return null;
  }

  private calculateRelevance(sentence: string, target: LinkTarget): number {
    let score = 0;
    const lowerSentence = sentence.toLowerCase();
    
    // Score based on keyword matches
    for (const keyword of target.keywords) {
      if (lowerSentence.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }
    
    // Bonus for blog posts (prefer linking to blogs over pages)
    if (target.type === "blog") {
      score += 0.5;
    }
    
    // Penalty for very short sentences (less context)
    const wordCount = sentence.split(/\s+/).length;
    if (wordCount < 10) {
      score -= 0.3;
    }
    
    return score;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private parseFrontmatter(fileContent: string): {
    frontmatter: Record<string, any>;
    content: string;
  } {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = fileContent.match(frontmatterRegex);
    
    if (!match) {
      return { frontmatter: {}, content: fileContent };
    }
    
    const frontmatterText = match[1];
    const content = match[2];
    
    // Simple YAML parsing (for basic key-value pairs)
    const frontmatter: Record<string, any> = {};
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
    
    return { frontmatter, content };
  }

  private reconstructMarkdownFile(
    frontmatter: Record<string, any>,
    content: string
  ): string {
    let yaml = "---\n";
    
    for (const [key, value] of Object.entries(frontmatter)) {
      if (Array.isArray(value)) {
        yaml += `${key}:\n`;
        for (const item of value) {
          yaml += `  - ${item}\n`;
        }
      } else {
        yaml += `${key}: "${value}"\n`;
      }
    }
    
    yaml += "---\n\n";
    
    return yaml + content;
  }
}
