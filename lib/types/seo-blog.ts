/**
 * Shared type definitions for SEO Blog Expansion feature
 */

// ============================================================================
// Blog Post Types
// ============================================================================

export interface BlogFrontmatter {
  title: string; // Unique, includes target keyword
  slug: string; // Unique, kebab-case
  date: string; // ISO 8601 format
  excerpt: string; // 150-160 characters, includes primary keyword
  keywords: string[]; // 8-12 keywords
  author: string; // "HABET Sports Team"
  readingTime: string; // e.g., "7 min read"
  lastUpdated?: string; // ISO 8601, added when existing posts are updated
  id?: string; // UUID for tracking (optional, added by inventory tracker)
}

export interface BlogPost {
  frontmatter: BlogFrontmatter;
  content: string;
}

// ============================================================================
// Blog Generator Types
// ============================================================================

export interface BlogGeneratorConfig {
  minWordCount: number; // 2500
  maxWordCount: number; // 4000
  targetKeywordDensity: { min: number; max: number }; // 0.008, 0.012
  author: string; // "HABET Sports Team"
  outputDir: string; // "content/blogs"
}

export interface BlogGenerationRequest {
  topic: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: "informational" | "navigational" | "transactional";
}

export interface BlogGenerationResult {
  success: boolean;
  slug: string;
  title: string;
  wordCount: number;
  internalLinkCount: number;
  validationErrors: string[];
}

// ============================================================================
// Content Validator Types
// ============================================================================

export interface ValidationRule {
  name: string;
  validate: (post: BlogPost) => ValidationResult;
}

export interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

export interface ContentValidationSchema {
  wordCount: {
    min: 2500;
    max: 4000;
  };
  keywordDensity: {
    min: 0.008; // 0.8%
    max: 0.012; // 1.2%
  };
  internalLinks: {
    min: 20;
    max: 25;
    maxPerParagraph: 3;
    distribution: {
      intro: 2;
      body: { min: 15; max: 18 };
      conclusion: { min: 3; max: 5 };
    };
  };
  headingStructure: {
    h1: { min: 1; max: 1 };
    h2: { min: 5; max: 8 };
    h3: { min: 10; max: 15 };
  };
  requiredSections: ["FAQ", "Conclusion"];
  excerptLength: {
    min: 150;
    max: 160;
  };
  keywordsCount: {
    min: 8;
    max: 12;
  };
}

// ============================================================================
// Internal Link Manager Types
// ============================================================================

export interface LinkInsertionPoint {
  paragraphIndex: number;
  sentenceIndex: number;
  anchorText: string;
  targetUrl: string;
  relevanceScore: number;
}

export interface LinkDistributionStrategy {
  introLinks: number; // 2
  bodyLinks: { min: number; max: number }; // 15-18
  conclusionLinks: { min: number; max: number }; // 3-5
  maxLinksPerParagraph: number; // 3
}

export interface InternalLinkConfig {
  targetLinkCount: { min: number; max: number }; // 20, 25
  distribution: LinkDistributionStrategy;
  linkTargets: LinkTarget[];
}

export interface LinkTarget {
  url: string;
  title: string;
  keywords: string[];
  type: "blog" | "page";
}

export interface LinkTargetRegistry {
  blogs: Array<{
    slug: string;
    title: string;
    keywords: string[];
    url: string; // e.g., "/blog/habet-app-download-guide"
  }>;
  pages: Array<{
    path: string;
    title: string;
    keywords: string[];
    url: string; // e.g., "/", "/about", "/disclaimer"
  }>;
}

// ============================================================================
// SEO Optimizer Types
// ============================================================================

export interface GSCKeywordData {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface KeywordAnalysis {
  keyword: string;
  searchVolume: number; // from impressions
  competition: number; // derived from position
  intent: "informational" | "navigational" | "transactional";
  priority: number; // calculated score
}

export interface TopicRecommendation {
  topic: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: "informational" | "navigational" | "transactional";
  targetAudience: string;
  contentAngle: string;
}

export interface GSCQueryData {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GSCPageData {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

// ============================================================================
// Content Inventory Types
// ============================================================================

export interface ContentInventoryEntry {
  id: string; // UUID
  slug: string;
  title: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  wordCount: number;
  internalLinkCount: number;
  createdAt: string; // ISO 8601
  lastUpdated?: string; // ISO 8601
  schemaType: "Article" | "HowTo" | "FAQPage";
  gscMetrics?: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
}

export interface ContentInventorySummary {
  totalPosts: number;
  totalWordCount: number;
  totalInternalLinks: number;
  keywordCoverage: Map<string, string>; // keyword -> slug
  averageWordCount: number;
  averageLinksPerPost: number;
}

export interface ContentInventoryDatabase {
  posts: ContentInventoryEntry[];
  keywordMap: Record<string, string>; // primaryKeyword -> slug
  metadata: {
    lastGenerated: string; // ISO 8601
    totalPosts: number;
    version: string; // e.g., "1.0.0"
  };
}
