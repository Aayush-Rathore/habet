/**
 * Content Validator
 * 
 * Validates blog posts against quality standards including word count,
 * keyword density, internal links, heading structure, and EEAT compliance.
 */

import type {
  BlogPost,
  ValidationResult,
  ValidationRule,
} from "./types/seo-blog";

export class ContentValidator {
  private rules: ValidationRule[] = [];

  /**
   * Validates word count is within acceptable range (2500-4000 words)
   */
  validateWordCount(post: BlogPost): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const wordCount = this.countWords(post.content);

    if (wordCount < 2500) {
      errors.push(`Word count ${wordCount} below minimum 2500`);
    } else if (wordCount > 4000) {
      errors.push(`Word count ${wordCount} exceeds maximum 4000`);
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates keyword density is within acceptable range (0.8-1.2%)
   */
  validateKeywordDensity(
    post: BlogPost,
    primaryKeyword: string
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const wordCount = this.countWords(post.content);
    const keywordCount = this.countKeywordOccurrences(post.content, primaryKeyword);
    const density = wordCount > 0 ? keywordCount / wordCount : 0;
    const densityPercent = (density * 100).toFixed(2);

    if (density < 0.008) {
      errors.push(`Keyword density ${densityPercent}% below minimum 0.8%`);
    } else if (density > 0.012) {
      errors.push(`Keyword density ${densityPercent}% exceeds maximum 1.2%`);
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates internal link count and distribution
   */
  validateInternalLinks(post: BlogPost): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const links = this.extractInternalLinks(post.content);
    const linkCount = links.length;

    if (linkCount < 20) {
      errors.push(`Internal link count ${linkCount} below minimum 20`);
    } else if (linkCount > 25) {
      errors.push(`Internal link count ${linkCount} exceeds maximum 25`);
    }

    // Validate links per paragraph
    const paragraphs = post.content.split(/\n\n+/);
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraphLinks = this.extractInternalLinks(paragraphs[i]);
      if (paragraphLinks.length > 3) {
        warnings.push(`Paragraph ${i + 1} contains ${paragraphLinks.length} links (max 3 recommended)`);
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates frontmatter completeness and format
   */
  validateFrontmatter(post: BlogPost): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const { frontmatter } = post;

    // Required fields
    if (!frontmatter.title || frontmatter.title.trim() === "") {
      errors.push("Missing required field: title");
    }

    if (!frontmatter.slug || frontmatter.slug.trim() === "") {
      errors.push("Missing required field: slug");
    } else if (!this.isValidSlug(frontmatter.slug)) {
      errors.push(`Invalid slug format: ${frontmatter.slug} (must be kebab-case)`);
    }

    if (!frontmatter.date || frontmatter.date.trim() === "") {
      errors.push("Missing required field: date");
    } else if (!this.isValidISO8601(frontmatter.date)) {
      errors.push(`Invalid date format: ${frontmatter.date} (must be ISO 8601)`);
    }

    if (!frontmatter.excerpt || frontmatter.excerpt.trim() === "") {
      errors.push("Missing required field: excerpt");
    }

    if (!frontmatter.keywords || frontmatter.keywords.length === 0) {
      errors.push("Missing required field: keywords");
    }

    if (!frontmatter.author || frontmatter.author.trim() === "") {
      errors.push("Missing required field: author");
    }

    if (!frontmatter.readingTime || frontmatter.readingTime.trim() === "") {
      errors.push("Missing required field: readingTime");
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates excerpt length and keyword presence
   */
  validateExcerpt(post: BlogPost, primaryKeyword: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const { excerpt } = post.frontmatter;

    if (!excerpt) {
      errors.push("Missing excerpt");
      return { passed: false, errors, warnings };
    }

    const excerptLength = excerpt.length;

    if (excerptLength < 150) {
      errors.push(`Excerpt length ${excerptLength} below minimum 150 characters`);
    } else if (excerptLength > 160) {
      errors.push(`Excerpt length ${excerptLength} exceeds maximum 160 characters`);
    }

    // Check if primary keyword is in excerpt
    const excerptLower = excerpt.toLowerCase();
    const keywordLower = primaryKeyword.toLowerCase();
    if (!excerptLower.includes(keywordLower)) {
      errors.push(`Excerpt does not include primary keyword: ${primaryKeyword}`);
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates slug format (kebab-case)
   */
  validateSlugFormat(slug: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.isValidSlug(slug)) {
      errors.push(`Invalid slug format: ${slug} (must be kebab-case: lowercase letters, numbers, and hyphens only)`);
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates date format (ISO 8601)
   */
  validateDateFormat(date: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.isValidISO8601(date)) {
      errors.push(`Invalid date format: ${date} (must be ISO 8601 format)`);
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates heading structure (H1, H2, H3 counts)
   */
  validateHeadingStructure(post: BlogPost): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const h1Count = (post.content.match(/^# .+$/gm) || []).length;
    const h2Count = (post.content.match(/^## .+$/gm) || []).length;
    const h3Count = (post.content.match(/^### .+$/gm) || []).length;

    if (h1Count < 1) {
      errors.push(`H1 count ${h1Count} below minimum 1`);
    } else if (h1Count > 1) {
      errors.push(`H1 count ${h1Count} exceeds maximum 1`);
    }

    if (h2Count < 5) {
      errors.push(`H2 count ${h2Count} below minimum 5`);
    } else if (h2Count > 8) {
      errors.push(`H2 count ${h2Count} exceeds maximum 8`);
    }

    if (h3Count < 10) {
      errors.push(`H3 count ${h3Count} below minimum 10`);
    } else if (h3Count > 15) {
      errors.push(`H3 count ${h3Count} exceeds maximum 15`);
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates title and slug uniqueness
   */
  validateUniqueness(
    post: BlogPost,
    existingPosts: BlogPost[]
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const duplicateTitle = existingPosts.find(
      (p) => p.frontmatter.title === post.frontmatter.title
    );
    if (duplicateTitle) {
      errors.push(`Duplicate title: ${post.frontmatter.title}`);
    }

    const duplicateSlug = existingPosts.find(
      (p) => p.frontmatter.slug === post.frontmatter.slug
    );
    if (duplicateSlug) {
      errors.push(`Duplicate slug: ${post.frontmatter.slug}`);
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates mobile readability - paragraph length (max 5 sentences)
   */
  validateParagraphLength(post: BlogPost): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Split content into paragraphs (separated by double newlines)
    const paragraphs = post.content.split(/\n\n+/).filter((p) => p.trim().length > 0);

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      
      // Skip headings, lists, code blocks, and blockquotes
      if (
        paragraph.match(/^#+\s/) || // Heading
        paragraph.match(/^[-*+]\s/) || // List item
        paragraph.match(/^>\s/) || // Blockquote
        paragraph.match(/^```/) || // Code block
        paragraph.match(/^\d+\.\s/) // Numbered list
      ) {
        continue;
      }

      // Count sentences (split by . ! ? followed by space or end of string)
      const sentences = paragraph.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim().length > 0);
      
      if (sentences.length > 5) {
        errors.push(`Paragraph ${i + 1} contains ${sentences.length} sentences (max 5 for mobile readability)`);
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates section length (max 400 words between headings)
   */
  validateSectionLength(post: BlogPost): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Split content by headings (H2 and H3)
    const sections = post.content.split(/^##+ .+$/gm);

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      if (section.length === 0) continue;

      const wordCount = this.countWords(section);
      
      if (wordCount > 400) {
        errors.push(`Section ${i + 1} contains ${wordCount} words (max 400 between headings for mobile readability)`);
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates average sentence length (max 20 words)
   */
  validateAverageSentenceLength(post: BlogPost): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Remove markdown formatting and split into sentences
    const cleanContent = post.content
      .replace(/^#+\s+/gm, "") // Remove heading markers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links, keep text
      .replace(/[*_~`]/g, "") // Remove formatting
      .replace(/\n+/g, " ") // Replace newlines with spaces
      .trim();

    // Split by sentence endings
    const sentences = cleanContent.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim().length > 0);

    if (sentences.length === 0) {
      return { passed: true, errors, warnings };
    }

    // Calculate average sentence length
    const totalWords = sentences.reduce((sum, sentence) => {
      const words = sentence.trim().split(/\s+/).filter((w) => w.length > 0);
      return sum + words.length;
    }, 0);

    const averageSentenceLength = totalWords / sentences.length;

    if (averageSentenceLength > 20) {
      errors.push(`Average sentence length ${averageSentenceLength.toFixed(1)} words exceeds maximum 20 words for mobile readability`);
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates list count (minimum 4 lists per post)
   */
  validateListCount(post: BlogPost): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Count bullet lists (lines starting with -, *, or +)
    const bulletLists = (post.content.match(/^[-*+]\s.+$/gm) || []).length;
    
    // Count numbered lists (lines starting with number followed by .)
    const numberedLists = (post.content.match(/^\d+\.\s.+$/gm) || []).length;

    // Count distinct list blocks (consecutive list items count as one list)
    const listBlocks = (post.content.match(/(^[-*+]\s.+$(\n[-*+]\s.+$)*)/gm) || []).length +
                       (post.content.match(/(^\d+\.\s.+$(\n\d+\.\s.+$)*)/gm) || []).length;

    if (listBlocks < 4) {
      errors.push(`List count ${listBlocks} below minimum 4 for mobile readability`);
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates bold text count (5-10 instances)
   */
  validateBoldTextCount(post: BlogPost): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Count bold text instances (** or __ markers)
    const boldInstances = (post.content.match(/\*\*[^*]+\*\*|__[^_]+__/g) || []).length;

    if (boldInstances < 5) {
      errors.push(`Bold text count ${boldInstances} below minimum 5 for mobile readability`);
    } else if (boldInstances > 10) {
      errors.push(`Bold text count ${boldInstances} exceeds maximum 10 for mobile readability`);
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates blockquote count (1 per 1000 words)
   */
  validateBlockquoteCount(post: BlogPost): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const wordCount = this.countWords(post.content);
    const expectedBlockquotes = Math.floor(wordCount / 1000);

    // Count blockquotes (lines starting with >)
    const blockquoteLines = (post.content.match(/^>\s.+$/gm) || []).length;
    
    // Count distinct blockquote blocks (consecutive blockquote lines count as one)
    const blockquoteBlocks = (post.content.match(/(^>\s.+$(\n>\s.+$)*)/gm) || []).length;

    if (blockquoteBlocks < expectedBlockquotes) {
      errors.push(`Blockquote count ${blockquoteBlocks} below minimum ${expectedBlockquotes} (1 per 1000 words) for mobile readability`);
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates TOC presence for posts >2000 words
   */
  validateTOCPresence(post: BlogPost): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const wordCount = this.countWords(post.content);

    if (wordCount > 2000) {
      // Check for common TOC patterns
      const hasTOC = 
        post.content.match(/^##?\s+(Table of Contents|Contents|TOC)/im) !== null ||
        post.content.match(/^[-*+]\s+\[.+\]\(#.+\)/m) !== null; // List of anchor links

      if (!hasTOC) {
        errors.push(`Post exceeds 2000 words (${wordCount}) but missing Table of Contents for mobile readability`);
      }
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validates FAQ section presence and structure (4-6 Q&A pairs)
   */
  validateFAQSection(post: BlogPost): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for FAQ heading (## FAQ)
    const faqHeadingMatch = post.content.match(/^##\s+FAQ\s*$/im);
    
    if (!faqHeadingMatch) {
      errors.push("Missing FAQ section with ## FAQ heading");
      return {
        passed: false,
        errors,
        warnings,
      };
    }

    // Extract FAQ section content (from after ## FAQ to next ## heading or end of content)
    const faqHeadingIndex = post.content.indexOf(faqHeadingMatch[0]);
    const contentAfterFAQHeading = post.content.substring(faqHeadingIndex + faqHeadingMatch[0].length);
    
    // Find the next H2 heading to determine where FAQ section ends
    const nextH2Match = contentAfterFAQHeading.match(/^##\s+[^\n]/m);
    const faqSection = nextH2Match 
      ? contentAfterFAQHeading.substring(0, nextH2Match.index)
      : contentAfterFAQHeading;

    // Count question-answer pairs
    // Questions typically start with H3 (###) or bold text with question mark
    const h3Questions = (faqSection.match(/^###\s+[^\n]*\?/gm) || []).length;
    const boldQuestions = (faqSection.match(/\*\*[^*]+\?\*\*/g) || []).length;
    
    const questionCount = h3Questions + boldQuestions;

    if (questionCount < 4) {
      errors.push(`FAQ section contains ${questionCount} questions (minimum 4 required)`);
    } else if (questionCount > 6) {
      errors.push(`FAQ section contains ${questionCount} questions (maximum 6 allowed)`);
    }

    return {
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Runs all validation rules
   */
  validateAll(post: BlogPost, existingPosts: BlogPost[]): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    const validations = [
      this.validateWordCount(post),
      this.validateHeadingStructure(post),
      this.validateFrontmatter(post),
      this.validateInternalLinks(post),
      this.validateUniqueness(post, existingPosts),
    ];

    for (const result of validations) {
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    return {
      passed: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
    };
  }

  // Helper methods

  private countWords(content: string): number {
    // Remove markdown syntax and count words
    const cleanContent = content
      .replace(/^#+\s+/gm, "") // Remove heading markers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links, keep text
      .replace(/[*_~`]/g, "") // Remove formatting
      .replace(/\n+/g, " ") // Replace newlines with spaces
      .trim();

    if (cleanContent.length === 0) return 0;

    return cleanContent.split(/\s+/).filter((word) => word.length > 0).length;
  }

  private countKeywordOccurrences(content: string, keyword: string): number {
    // Clean content by removing markdown formatting (same as countWords)
    const cleanContent = content
      .replace(/^#+\s+/gm, "") // Remove heading markers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links, keep text
      .replace(/[*_~`]/g, "") // Remove formatting
      .replace(/\n+/g, " ") // Replace newlines with spaces
      .trim();
    
    const contentLower = cleanContent.toLowerCase();
    const keywordLower = keyword.toLowerCase();
    
    // Use word boundary regex to match whole words/phrases
    const regex = new RegExp(`\\b${this.escapeRegex(keywordLower)}\\b`, "gi");
    const matches = contentLower.match(regex);
    
    return matches ? matches.length : 0;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private extractInternalLinks(content: string): string[] {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links: string[] = [];
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const url = match[2];
      // Internal links start with / and don't include protocol
      if (url.startsWith("/") && !url.startsWith("//")) {
        links.push(url);
      }
    }

    return links;
  }

  private isValidSlug(slug: string): boolean {
    // Kebab-case: lowercase letters, numbers, and hyphens only
    return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
  }

  private isValidISO8601(date: string): boolean {
    // Basic ISO 8601 validation
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    if (!iso8601Regex.test(date)) return false;

    // Verify it's a valid date
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime());
  }
}
