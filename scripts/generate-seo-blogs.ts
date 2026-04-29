#!/usr/bin/env ts-node
/**
 * SEO Blog Generation Script
 *
 * Orchestrates the full blog generation workflow:
 * 1. Load GSC data from gsc/ directory (CSV files)
 * 2. Use SEOOptimizer to analyze keywords and generate topic recommendations
 * 3. Use BlogGenerator to generate 5-10 new blog posts
 * 4. Use InternalLinkManager to update 3 existing blog posts
 * 5. Use ContentInventoryTracker to log all posts and generate summary report
 *
 * Usage:
 *   npx ts-node scripts/generate-seo-blogs.ts
 *   npx tsx scripts/generate-seo-blogs.ts
 */

import * as fs from "fs";
import * as path from "path";
import { SEOOptimizer } from "../lib/seo-optimizer";
import { BlogGenerator } from "../lib/blog-generator";
import { InternalLinkManager } from "../lib/internal-link-manager";
import { ContentInventoryTracker } from "../lib/content-inventory";
import type {
  BlogGenerationResult,
  LinkTarget,
  TopicRecommendation,
} from "../lib/types/seo-blog";

// ── Configuration ─────────────────────────────────────────────────────────────

const GSC_DIR = path.join(process.cwd(), "gsc");
const CONTENT_DIR = path.join(process.cwd(), "content", "blogs");
const INVENTORY_PATH = path.join(process.cwd(), "content", "inventory.json");

// The 3 existing blog posts to update with internal links
const EXISTING_POSTS_TO_UPDATE = [
  "cricket-betting-tips-india-2026",
  "ipl-betting-predictions-2026",
  "habet-app-download-guide",
];

// Blog generator config
const BLOG_GENERATOR_CONFIG = {
  minWordCount: 2500,
  maxWordCount: 4000,
  targetKeywordDensity: { min: 0.008, max: 0.012 },
  author: "HABET Sports Team",
  outputDir: "content/blogs",
};

// Internal link manager config
const LINK_MANAGER_CONFIG = {
  targetLinkCount: { min: 20, max: 25 },
  distribution: {
    introLinks: 2,
    bodyLinks: { min: 15, max: 18 },
    conclusionLinks: { min: 3, max: 5 },
    maxLinksPerParagraph: 3,
  },
  linkTargets: [],
};

// ── Logging Helpers ───────────────────────────────────────────────────────────

function log(message: string): void {
  const timestamp = new Date().toISOString().substring(11, 19);
  console.log(`[${timestamp}] ${message}`);
}

function logSuccess(message: string): void {
  const timestamp = new Date().toISOString().substring(11, 19);
  console.log(`[${timestamp}] ✅ ${message}`);
}

function logError(message: string): void {
  const timestamp = new Date().toISOString().substring(11, 19);
  console.error(`[${timestamp}] ❌ ${message}`);
}

function logWarning(message: string): void {
  const timestamp = new Date().toISOString().substring(11, 19);
  console.warn(`[${timestamp}] ⚠️  ${message}`);
}

function logSection(title: string): void {
  console.log("\n" + "─".repeat(60));
  console.log(`  ${title}`);
  console.log("─".repeat(60));
}

// ── GSC Data Loading ──────────────────────────────────────────────────────────

/**
 * Finds the GSC query CSV file in the gsc/ directory.
 * The file has a Hindi name (क्वेरी.csv) so we look for it by listing the dir.
 */
function findGSCQueryFile(): string | null {
  try {
    const files = fs.readdirSync(GSC_DIR);
    // The query file contains "क्वेरी" (query in Hindi)
    const queryFile = files.find(
      (f) => f.includes("क्वेरी") || f.toLowerCase().includes("query")
    );
    if (queryFile) {
      return path.join(GSC_DIR, queryFile);
    }
    // Fallback: return first CSV file
    const csvFile = files.find((f) => f.endsWith(".csv"));
    return csvFile ? path.join(GSC_DIR, csvFile) : null;
  } catch (error) {
    return null;
  }
}

/**
 * Parses the Hindi-column GSC CSV into a normalized format for SEOOptimizer.
 * The CSV has columns: शीर्ष क्वेरी, क्लिक की संख्या, छापें, क्लिक मिलने की दर (सीटीआर), स्थिति
 * We write a normalized version to a temp file for SEOOptimizer to consume.
 */
function normalizeGSCCSV(csvPath: string): string {
  const content = fs.readFileSync(csvPath, "utf-8");
  const lines = content.trim().split("\n");

  if (lines.length < 2) {
    throw new Error("GSC CSV file is empty or has no data rows");
  }

  // Map Hindi column names to English
  const hindiToEnglish: Record<string, string> = {
    "शीर्ष क्वेरी": "query",
    "क्लिक की संख्या": "clicks",
    "छापें": "impressions",
    "क्लिक मिलने की दर (सीटीआर)": "ctr",
    "स्थिति": "position",
  };

  const headerLine = lines[0];
  const headers = headerLine.split(",");

  // Build normalized header
  const normalizedHeaders = headers.map((h) => {
    const trimmed = h.trim();
    return hindiToEnglish[trimmed] || trimmed.toLowerCase().replace(/\s+/g, "_");
  });

  // Normalize data rows: strip % from CTR values
  const normalizedLines = [normalizedHeaders.join(",")];

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (!row.trim()) continue;

    // Parse CSV row (handle quoted values)
    const cols = row.split(",");
    const normalizedCols = cols.map((col, idx) => {
      const header = normalizedHeaders[idx];
      let value = col.trim();

      // Strip % from CTR
      if (header === "ctr") {
        value = value.replace("%", "");
        // Convert percentage string to decimal (e.g., "31" -> "0.31")
        const num = parseFloat(value);
        if (!isNaN(num) && num > 1) {
          value = (num / 100).toFixed(4);
        }
      }

      // Handle position values that might have % appended (data quirk)
      if (header === "position") {
        value = value.replace("%", "");
      }

      return value;
    });

    normalizedLines.push(normalizedCols.join(","));
  }

  return normalizedLines.join("\n");
}

// ── Link Target Builder ───────────────────────────────────────────────────────

/**
 * Builds the full list of link targets from existing blog posts + site pages.
 */
function buildLinkTargets(generatedSlugs: string[] = []): LinkTarget[] {
  const targets: LinkTarget[] = [];

  // Site pages
  targets.push({
    url: "/",
    title: "HABET Sports Betting App",
    keywords: ["HABET", "HABET APK", "HABET app", "sports betting", "ha bet"],
    type: "page",
  });
  targets.push({
    url: "/about",
    title: "About HABET",
    keywords: ["about HABET", "HABET team", "company", "who we are"],
    type: "page",
  });
  targets.push({
    url: "/disclaimer",
    title: "Disclaimer",
    keywords: ["disclaimer", "legal", "terms", "responsible gambling"],
    type: "page",
  });

  // Existing blog posts
  const existingBlogTargets: LinkTarget[] = [
    {
      url: "/blog/cricket-betting-tips-india-2026",
      title: "Cricket Betting Tips India 2026",
      keywords: [
        "cricket betting tips",
        "cricket betting",
        "IPL betting",
        "cricket strategy",
      ],
      type: "blog",
    },
    {
      url: "/blog/ipl-betting-predictions-2026",
      title: "IPL Betting Predictions 2026",
      keywords: [
        "IPL betting predictions",
        "IPL 2026",
        "IPL betting",
        "cricket predictions",
      ],
      type: "blog",
    },
    {
      url: "/blog/habet-app-download-guide",
      title: "HABET App Download Guide",
      keywords: [
        "HABET app download",
        "HABET APK",
        "download HABET",
        "install HABET",
      ],
      type: "blog",
    },
  ];

  targets.push(...existingBlogTargets);

  // Add newly generated blog posts as link targets
  for (const slug of generatedSlugs) {
    // Derive a readable title from slug
    const title = slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    targets.push({
      url: `/blog/${slug}`,
      title,
      keywords: slug.split("-").filter((w) => w.length > 3),
      type: "blog",
    });
  }

  return targets;
}

// ── Summary Report ────────────────────────────────────────────────────────────

interface RunSummary {
  generatedPosts: Array<{
    slug: string;
    title: string;
    wordCount: number;
    internalLinkCount: number;
    success: boolean;
    errors?: string[];
  }>;
  updatedPosts: Array<{
    slug: string;
    success: boolean;
    error?: string;
  }>;
  totalGenerated: number;
  totalFailed: number;
  totalUpdated: number;
  totalUpdateFailed: number;
}

function printSummaryReport(summary: RunSummary): void {
  logSection("SUMMARY REPORT");

  console.log(`\n📝 Blog Posts Generated: ${summary.totalGenerated} / ${summary.generatedPosts.length}`);
  console.log(`🔗 Existing Posts Updated: ${summary.totalUpdated} / ${summary.updatedPosts.length}`);

  if (summary.generatedPosts.length > 0) {
    console.log("\n── Generated Posts ──────────────────────────────────────");
    for (const post of summary.generatedPosts) {
      if (post.success) {
        console.log(
          `  ✅ ${post.slug}\n     Words: ${post.wordCount} | Links: ${post.internalLinkCount}`
        );
      } else {
        console.log(`  ❌ ${post.slug || "(failed)"}`);
        if (post.errors && post.errors.length > 0) {
          for (const err of post.errors.slice(0, 3)) {
            console.log(`     • ${err}`);
          }
        }
      }
    }
  }

  if (summary.updatedPosts.length > 0) {
    console.log("\n── Updated Existing Posts ───────────────────────────────");
    for (const post of summary.updatedPosts) {
      if (post.success) {
        console.log(`  ✅ ${post.slug}`);
      } else {
        console.log(`  ❌ ${post.slug}: ${post.error}`);
      }
    }
  }

  if (summary.totalFailed > 0 || summary.totalUpdateFailed > 0) {
    console.log(
      `\n⚠️  ${summary.totalFailed} generation(s) failed, ${summary.totalUpdateFailed} update(s) failed.`
    );
  }

  console.log("\n" + "─".repeat(60) + "\n");
}

// ── Main Workflow ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("\n🚀 SEO Blog Generation Workflow Starting...\n");

  const summary: RunSummary = {
    generatedPosts: [],
    updatedPosts: [],
    totalGenerated: 0,
    totalFailed: 0,
    totalUpdated: 0,
    totalUpdateFailed: 0,
  };

  // ── Step 1: Load and parse GSC data ────────────────────────────────────────
  logSection("Step 1: Loading GSC Data");

  const gscQueryFile = findGSCQueryFile();
  if (!gscQueryFile) {
    logError(`No GSC CSV file found in ${GSC_DIR}`);
    logError("Please ensure the gsc/ directory contains a query CSV file.");
    process.exit(1);
  }

  log(`Found GSC query file: ${path.basename(gscQueryFile)}`);

  // Write normalized CSV to a temp file for SEOOptimizer
  let normalizedCSVPath: string;
  try {
    const normalizedContent = normalizeGSCCSV(gscQueryFile);
    normalizedCSVPath = path.join(process.cwd(), "gsc", "_normalized_queries.csv");
    fs.writeFileSync(normalizedCSVPath, normalizedContent, "utf-8");
    logSuccess("GSC data normalized successfully");
  } catch (error) {
    logError(`Failed to normalize GSC CSV: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }

  // ── Step 2: Analyze keywords with SEOOptimizer ─────────────────────────────
  logSection("Step 2: Analyzing Keywords with SEOOptimizer");

  const seoOptimizer = new SEOOptimizer();
  let topicRecommendations: TopicRecommendation[] = [];

  try {
    log("Analyzing GSC keyword data...");
    const keywordAnalysis = await seoOptimizer.analyzeGSCData(normalizedCSVPath);

    log(`Found ${keywordAnalysis.length} high-priority keywords (10+ impressions, 0 clicks)`);

    if (keywordAnalysis.length === 0) {
      logWarning("No zero-click keywords found. Using fallback topic list.");
    } else {
      for (const kw of keywordAnalysis.slice(0, 10)) {
        log(`  • "${kw.keyword}" — impressions: ${kw.searchVolume}, intent: ${kw.intent}, priority: ${kw.priority.toFixed(2)}`);
      }
    }

    // Required topics from requirements 6.1-6.7 (always included)
    const requiredTopics: TopicRecommendation[] = [
      {
        topic: "Is HABET App Real or Fake? Legitimacy Verification 2026",
        primaryKeyword: "habet app real or fake",
        secondaryKeywords: [
          "habet betting app real or fake",
          "is habet trusted",
          "habet app review",
          "habet app safe",
          "habet app legit",
          "habet app genuine",
          "habet app scam",
          "habet app verified",
        ],
        searchIntent: "informational",
        targetAudience: "Indian cricket betting enthusiasts",
        contentAngle: "Trust and legitimacy verification with evidence-based content",
      },
      {
        topic: "HABET Betting App Download Guide - Android & iOS 2026",
        primaryKeyword: "habet app download",
        secondaryKeywords: [
          "habet apk download",
          "habet betting app download apk",
          "ha bet app download",
          "habet app download play store",
          "habet app install",
          "habet apk",
          "download habet",
          "habet android download",
        ],
        searchIntent: "transactional",
        targetAudience: "Indian cricket betting enthusiasts",
        contentAngle: "Step-by-step download guide for Android and iOS",
      },
      {
        topic: "HABET vs Other Betting Apps - Complete Comparison 2026",
        primaryKeyword: "habet betting app india",
        secondaryKeywords: [
          "habet vs other apps",
          "best betting app india",
          "habet app features",
          "habet app comparison",
          "habet cricket app",
          "habet app review",
          "online betting india",
          "cricket betting app india",
        ],
        searchIntent: "informational",
        targetAudience: "Indian cricket betting enthusiasts",
        contentAngle: "Detailed comparison establishing HABET's advantages",
      },
      {
        topic: "How to Withdraw Money from HABET - Step-by-Step Guide 2026",
        primaryKeyword: "habet withdrawal",
        secondaryKeywords: [
          "habet withdraw money",
          "habet payment methods",
          "habet upi withdrawal",
          "habet bank transfer",
          "habet withdrawal time",
          "habet minimum withdrawal",
          "habet payout",
          "habet cashout",
        ],
        searchIntent: "transactional",
        targetAudience: "Indian cricket betting enthusiasts",
        contentAngle: "Action-oriented guide with step-by-step withdrawal instructions",
      },
      {
        topic: "HABET Cricket Betting Markets Explained - Complete Guide 2026",
        primaryKeyword: "habet cricket app",
        secondaryKeywords: [
          "cricket betting markets",
          "habet cricket betting",
          "ipl betting markets",
          "cricket live betting",
          "habet app cricket app download",
          "cricket odds explained",
          "habet cricket odds",
          "cricket betting guide india",
        ],
        searchIntent: "informational",
        targetAudience: "Indian cricket betting enthusiasts",
        contentAngle: "Educational content explaining all available cricket betting markets",
      },
      {
        topic: "HABET IPL Betting Bonus and Promotions 2026",
        primaryKeyword: "habet ipl bonus",
        secondaryKeywords: [
          "habet welcome bonus",
          "habet promotions",
          "ipl betting bonus",
          "habet deposit bonus",
          "habet free bets",
          "habet cashback",
          "habet referral bonus",
          "habet loyalty rewards",
        ],
        searchIntent: "transactional",
        targetAudience: "Indian cricket betting enthusiasts",
        contentAngle: "Promotional content highlighting HABET's bonus offers",
      },
    ];

    // Generate additional topics from GSC analysis (up to 4 more)
    const requiredPrimaryKeywords = new Set(requiredTopics.map(t => t.primaryKeyword));
    const gscTopics = seoOptimizer.generateTopicRecommendations(
      keywordAnalysis.filter(k => !requiredPrimaryKeywords.has(k.keyword)),
      4
    );

    // Combine required topics with GSC-derived additional topics
    topicRecommendations = [...requiredTopics, ...gscTopics];

    log(`\nGenerated ${topicRecommendations.length} topic recommendations (${requiredTopics.length} required + ${gscTopics.length} from GSC):`);
    for (const rec of topicRecommendations) {
      log(`  • [${rec.searchIntent}] ${rec.topic}`);
      log(`    Primary: "${rec.primaryKeyword}" | Secondary: ${rec.secondaryKeywords.slice(0, 3).join(", ")}...`);
    }

    logSuccess("Keyword analysis complete");
  } catch (error) {
    logError(`SEO analysis failed: ${error instanceof Error ? error.message : error}`);
    logWarning("Falling back to predefined topic list based on requirements...");

    // Fallback topics from requirements (6.1-6.7)
    topicRecommendations = [
      {
        topic: "Is HABET App Real or Fake? Legitimacy Verification 2026",
        primaryKeyword: "habet app real or fake",
        secondaryKeywords: [
          "habet betting app real or fake",
          "is habet trusted",
          "habet app review",
          "habet app safe",
          "habet app legit",
          "habet app genuine",
          "habet app scam",
          "habet app verified",
        ],
        searchIntent: "informational",
        targetAudience: "Indian cricket betting enthusiasts",
        contentAngle: "Trust and legitimacy verification with evidence-based content",
      },
      {
        topic: "HABET Betting App Download Guide - Android & iOS 2026",
        primaryKeyword: "habet app download",
        secondaryKeywords: [
          "habet apk download",
          "habet betting app download apk",
          "ha bet app download",
          "habet app download play store",
          "habet app install",
          "habet apk",
          "download habet",
          "habet android download",
        ],
        searchIntent: "transactional",
        targetAudience: "Indian cricket betting enthusiasts",
        contentAngle: "Step-by-step download guide for Android and iOS",
      },
      {
        topic: "HABET vs Other Betting Apps - Complete Comparison 2026",
        primaryKeyword: "habet betting app india",
        secondaryKeywords: [
          "habet vs other apps",
          "best betting app india",
          "habet app features",
          "habet app comparison",
          "habet cricket app",
          "habet app review",
          "online betting india",
          "cricket betting app india",
        ],
        searchIntent: "informational",
        targetAudience: "Indian cricket betting enthusiasts",
        contentAngle: "Detailed comparison establishing HABET's advantages",
      },
      {
        topic: "How to Withdraw Money from HABET - Step-by-Step Guide 2026",
        primaryKeyword: "habet withdrawal",
        secondaryKeywords: [
          "habet withdraw money",
          "habet payment methods",
          "habet upi withdrawal",
          "habet bank transfer",
          "habet withdrawal time",
          "habet minimum withdrawal",
          "habet payout",
          "habet cashout",
        ],
        searchIntent: "transactional",
        targetAudience: "Indian cricket betting enthusiasts",
        contentAngle: "Action-oriented guide with step-by-step withdrawal instructions",
      },
      {
        topic: "HABET Cricket Betting Markets Explained - Complete Guide 2026",
        primaryKeyword: "habet cricket app",
        secondaryKeywords: [
          "cricket betting markets",
          "habet cricket betting",
          "ipl betting markets",
          "cricket live betting",
          "habet app cricket app download",
          "cricket odds explained",
          "habet cricket odds",
          "cricket betting guide india",
        ],
        searchIntent: "informational",
        targetAudience: "Indian cricket betting enthusiasts",
        contentAngle: "Educational content explaining all available cricket betting markets",
      },
      {
        topic: "HABET IPL Betting Bonus and Promotions 2026",
        primaryKeyword: "habet ipl bonus",
        secondaryKeywords: [
          "habet welcome bonus",
          "habet promotions",
          "ipl betting bonus",
          "habet deposit bonus",
          "habet free bets",
          "habet cashback",
          "habet referral bonus",
          "habet loyalty rewards",
        ],
        searchIntent: "transactional",
        targetAudience: "Indian cricket betting enthusiasts",
        contentAngle: "Promotional content highlighting HABET's bonus offers",
      },
    ];

    log(`Using ${topicRecommendations.length} fallback topics`);
  }

  // Clean up temp file
  try {
    fs.unlinkSync(normalizedCSVPath);
  } catch {
    // Ignore cleanup errors
  }

  // ── Step 3: Generate blog posts ────────────────────────────────────────────
  logSection("Step 3: Generating Blog Posts with BlogGenerator");

  const blogGenerator = new BlogGenerator(BLOG_GENERATOR_CONFIG);
  const generatedSlugs: string[] = [];

  log(`Generating ${topicRecommendations.length} blog posts...`);
  log("(This may take several minutes due to Gemini AI API calls)\n");

  for (let i = 0; i < topicRecommendations.length; i++) {
    const rec = topicRecommendations[i];
    log(`[${i + 1}/${topicRecommendations.length}] Generating: "${rec.topic}"`);
    log(`  Primary keyword: "${rec.primaryKeyword}"`);

    try {
      const result: BlogGenerationResult = await blogGenerator.generateBlogPost({
        topic: rec.topic,
        primaryKeyword: rec.primaryKeyword,
        secondaryKeywords: rec.secondaryKeywords,
        searchIntent: rec.searchIntent,
      });

      if (result.success) {
        logSuccess(`Generated: ${result.slug} (${result.wordCount} words, ${result.internalLinkCount} links)`);
        generatedSlugs.push(result.slug);
        summary.generatedPosts.push({
          slug: result.slug,
          title: result.title,
          wordCount: result.wordCount,
          internalLinkCount: result.internalLinkCount,
          success: true,
        });
        summary.totalGenerated++;
      } else {
        logError(`Failed to generate: "${rec.topic}"`);
        if (result.validationErrors.length > 0) {
          for (const err of result.validationErrors.slice(0, 3)) {
            logError(`  • ${err}`);
          }
        }
        summary.generatedPosts.push({
          slug: result.slug || rec.primaryKeyword.replace(/\s+/g, "-"),
          title: rec.topic,
          wordCount: result.wordCount,
          internalLinkCount: result.internalLinkCount,
          success: false,
          errors: result.validationErrors,
        });
        summary.totalFailed++;
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logError(`Exception generating "${rec.topic}": ${errMsg}`);
      summary.generatedPosts.push({
        slug: rec.primaryKeyword.replace(/\s+/g, "-"),
        title: rec.topic,
        wordCount: 0,
        internalLinkCount: 0,
        success: false,
        errors: [errMsg],
      });
      summary.totalFailed++;
    }
  }

  log(`\nGeneration complete: ${summary.totalGenerated} succeeded, ${summary.totalFailed} failed`);

  // ── Step 4: Update existing blog posts with internal links ─────────────────
  logSection("Step 4: Updating Existing Blog Posts with Internal Links");

  const linkTargets = buildLinkTargets(generatedSlugs);
  const linkManager = new InternalLinkManager(LINK_MANAGER_CONFIG);

  log(`Built ${linkTargets.length} link targets (${generatedSlugs.length} new + existing)`);
  log(`Updating ${EXISTING_POSTS_TO_UPDATE.length} existing posts...\n`);

  for (const slug of EXISTING_POSTS_TO_UPDATE) {
    log(`Updating: ${slug}.md`);

    // Check if the file exists before attempting update
    const filePath = path.join(CONTENT_DIR, `${slug}.md`);
    if (!fs.existsSync(filePath)) {
      logWarning(`File not found: ${filePath} — skipping`);
      summary.updatedPosts.push({
        slug,
        success: false,
        error: "File not found",
      });
      summary.totalUpdateFailed++;
      continue;
    }

    try {
      await linkManager.updateExistingPost(slug, linkTargets);
      logSuccess(`Updated: ${slug}.md`);
      summary.updatedPosts.push({ slug, success: true });
      summary.totalUpdated++;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logError(`Failed to update ${slug}: ${errMsg}`);
      summary.updatedPosts.push({ slug, success: false, error: errMsg });
      summary.totalUpdateFailed++;
    }
  }

  // ── Step 5: Log all posts to content inventory ─────────────────────────────
  logSection("Step 5: Logging Posts to Content Inventory");

  const inventoryTracker = new ContentInventoryTracker(INVENTORY_PATH);

  log("Logging generated posts to content inventory...");

  for (const post of summary.generatedPosts) {
    if (!post.success || !post.slug) continue;

    try {
      // Read the generated file to get accurate metadata
      const filePath = path.join(CONTENT_DIR, `${post.slug}.md`);
      if (!fs.existsSync(filePath)) {
        logWarning(`Generated file not found for inventory logging: ${post.slug}`);
        continue;
      }

      // Find the matching topic recommendation for keyword data
      const rec = topicRecommendations.find(
        (r) =>
          r.primaryKeyword === post.slug.replace(/-/g, " ") ||
          summary.generatedPosts.find((p) => p.slug === post.slug)
      );

      // Check if already in inventory (avoid duplicate errors)
      const existingConflict = await inventoryTracker.checkKeywordConflict(
        rec?.primaryKeyword || post.slug
      );

      if (existingConflict) {
        logWarning(`Keyword already in inventory for: ${post.slug} — skipping`);
        continue;
      }

      const { v4: uuidv4 } = await import("uuid");

      await inventoryTracker.logPost({
        id: uuidv4(),
        slug: post.slug,
        title: post.title,
        primaryKeyword: rec?.primaryKeyword || post.slug.replace(/-/g, " "),
        secondaryKeywords: rec?.secondaryKeywords || [],
        wordCount: post.wordCount,
        internalLinkCount: post.internalLinkCount,
        createdAt: new Date().toISOString(),
        schemaType: "Article", // Will be overridden by assignSchemaType
      });

      log(`  Logged: ${post.slug}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      logWarning(`Could not log ${post.slug} to inventory: ${errMsg}`);
    }
  }

  // ── Step 6: Generate and print summary report ──────────────────────────────
  logSection("Step 6: Generating Summary Report");

  try {
    const inventorySummary = await inventoryTracker.generateSummary();

    console.log("\n📊 Content Inventory Summary:");
    console.log(`   Total Posts:          ${inventorySummary.totalPosts}`);
    console.log(`   Total Word Count:     ${inventorySummary.totalWordCount.toLocaleString()}`);
    console.log(`   Total Internal Links: ${inventorySummary.totalInternalLinks}`);
    console.log(`   Avg Word Count:       ${Math.round(inventorySummary.averageWordCount).toLocaleString()}`);
    console.log(`   Avg Links Per Post:   ${inventorySummary.averageLinksPerPost.toFixed(1)}`);

    if (inventorySummary.keywordCoverage.size > 0) {
      console.log("\n📌 Keyword Coverage Map:");
      inventorySummary.keywordCoverage.forEach((slug, keyword) => {
        console.log(`   "${keyword}" → /blog/${slug}`);
      });
    }

    logSuccess("Summary report generated");
  } catch (error) {
    logWarning(`Could not generate inventory summary: ${error instanceof Error ? error.message : error}`);
  }

  // Print the run summary
  printSummaryReport(summary);

  // Exit with error code if any critical failures
  if (summary.totalGenerated === 0 && topicRecommendations.length > 0) {
    logError("No blog posts were successfully generated.");
    process.exit(1);
  }

  log("✨ SEO Blog Generation Workflow Complete!\n");
}

// ── Entry Point ───────────────────────────────────────────────────────────────

main().catch((error) => {
  logError(`Fatal error: ${error instanceof Error ? error.message : error}`);
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
  process.exit(1);
});
