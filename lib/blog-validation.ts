/**
 * Validates that a blog post markdown string contains all required structural elements:
 * - At least 1 H1 (# heading)
 * - At least 4 H2 (## headings)
 * - At least 2 H3 (### headings)
 * - A FAQ section (## FAQ or ## Frequently Asked Questions)
 * - A conclusion section (## Conclusion or ## Summary)
 */
export function validateBlogStructure(content: string): boolean {
  const lines = content.split("\n")

  let h1Count = 0
  let h2Count = 0
  let h3Count = 0
  let hasFaq = false
  let hasConclusion = false

  for (const line of lines) {
    const trimmed = line.trim()

    if (/^### /.test(trimmed)) {
      h3Count++
    } else if (/^## /.test(trimmed)) {
      h2Count++
      const heading = trimmed.replace(/^## /, "").trim().toLowerCase()
      if (heading === "faq" || heading === "frequently asked questions") {
        hasFaq = true
      }
      if (heading === "conclusion" || heading === "summary") {
        hasConclusion = true
      }
    } else if (/^# /.test(trimmed)) {
      h1Count++
    }
  }

  return (
    h1Count >= 1 &&
    h2Count >= 4 &&
    h3Count >= 2 &&
    hasFaq &&
    hasConclusion
  )
}

/**
 * Counts the number of words in a markdown string by splitting on whitespace.
 */
export function countWords(markdown: string): number {
  const trimmed = markdown.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

/**
 * Checks whether a markdown string contains an internal link to the given path.
 *
 * For path "/", matches any of:
 *   [text](/)
 *   [text](https://habetapk.com/)
 *   [text](https://habetapk.com)
 *
 * For other paths, matches [text](/path) or [text](https://habetapk.com/path).
 */
export function containsInternalLink(content: string, path: string): boolean {
  if (path === "/") {
    // Match [text](/), [text](https://habetapk.com/), or [text](https://habetapk.com)
    return /\[[^\]]+\]\(\s*(?:\/|https:\/\/habetapk\.com\/?)\s*\)/.test(content)
  }

  // Normalize path to ensure it starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  const escapedPath = normalizedPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

  const relativePattern = new RegExp(`\\[[^\\]]+\\]\\(\\s*${escapedPath}\\s*\\)`)
  const absolutePattern = new RegExp(
    `\\[[^\\]]+\\]\\(\\s*https://habetapk\\.com${escapedPath}\\s*\\)`
  )

  return relativePattern.test(content) || absolutePattern.test(content)
}

/**
 * Validates that the primary keyword appears within the first 100 words of the content.
 * 
 * This function:
 * 1. Extracts the first 100 words from the content
 * 2. Performs a case-insensitive search for the primary keyword
 * 3. Returns true if the keyword is found, false otherwise
 * 
 * @param content - The blog post content (markdown string)
 * @param primaryKeyword - The primary keyword to search for
 * @returns true if the keyword appears in the first 100 words, false otherwise
 */
export function validatePrimaryKeywordPlacement(
  content: string,
  primaryKeyword: string
): boolean {
  if (!content || !primaryKeyword) {
    return false
  }

  // Trim the keyword to remove leading/trailing whitespace
  const trimmedKeyword = primaryKeyword.trim()
  if (!trimmedKeyword) {
    return false
  }

  // Clean the content: remove markdown formatting but keep the text
  const cleanContent = content
    .replace(/^#+\s+/gm, "") // Remove heading markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Remove links, keep text
    .replace(/[*_~`]/g, "") // Remove formatting characters
    .trim()

  // Split into words and take first 100
  const words = cleanContent.split(/\s+/).filter((word) => word.length > 0)
  const first100Words = words.slice(0, 100).join(" ")

  // Case-insensitive search for the primary keyword
  const keywordRegex = new RegExp(
    trimmedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "i"
  )

  return keywordRegex.test(first100Words)
}

/**
 * Checks if a keyword indicates download intent.
 * 
 * Download-intent keywords include phrases like:
 * - "download"
 * - "apk"
 * - "install"
 * - "get app"
 * 
 * @param keyword - The keyword to check
 * @returns true if the keyword indicates download intent, false otherwise
 */
export function isDownloadIntentKeyword(keyword: string): boolean {
  if (!keyword) {
    return false
  }

  const downloadPatterns = [
    /\bdownload\b/i,
    /\bapk\b/i,
    /\binstall\b/i,
    /\bget\s+app\b/i,
  ]

  return downloadPatterns.some((pattern) => pattern.test(keyword))
}

/**
 * Validates that a blog post targeting download-intent keywords contains
 * at least one CTA link to the download page.
 * 
 * This function:
 * 1. Checks if the primary keyword indicates download intent
 * 2. If yes, verifies that the content contains at least one link to the homepage (/)
 *    which serves as the download page
 * 3. Returns true if the CTA link is present or if the keyword doesn't indicate download intent
 * 
 * @param content - The blog post content (markdown string)
 * @param primaryKeyword - The primary keyword to check for download intent
 * @returns true if CTA link is present (when needed) or not needed, false otherwise
 */
export function validateCallToAction(
  content: string,
  primaryKeyword: string
): boolean {
  if (!content || !primaryKeyword) {
    return false
  }

  // Check if the keyword indicates download intent
  if (!isDownloadIntentKeyword(primaryKeyword)) {
    // No CTA required for non-download-intent keywords
    return true
  }

  // For download-intent keywords, verify at least one link to the homepage (download page)
  return containsInternalLink(content, "/")
}

/**
 * Validates that all date references in the content are consistent with the frontmatter date field's year.
 * 
 * This function:
 * 1. Extracts the year from the frontmatter date field (ISO 8601 format)
 * 2. Searches the content for year references (4-digit numbers that look like years)
 * 3. Checks if all year references match the frontmatter year
 * 4. Returns true if all dates are consistent or no date references found, false otherwise
 * 
 * @param content - The blog post content (markdown string)
 * @param frontmatterDate - The date from frontmatter in ISO 8601 format (e.g., "2026-01-20T10:00:00Z")
 * @returns true if all date references are consistent with frontmatter year, false otherwise
 */
export function validateDateConsistency(
  content: string,
  frontmatterDate: string
): boolean {
  if (!content || !frontmatterDate) {
    return false
  }

  // Extract year from frontmatter date - must be strict ISO 8601 format (YYYY-MM-DD...)
  // The date must start with YYYY- (year followed by hyphen separator)
  const frontmatterYearMatch = frontmatterDate.match(/^(\d{4})-/)
  if (!frontmatterYearMatch) {
    return false
  }
  const frontmatterYear = frontmatterYearMatch[1]

  // Find all 4-digit year references in content (2000-2099 range to avoid false positives)
  const yearPattern = /\b(20\d{2})\b/g
  const yearMatches = content.match(yearPattern)

  // If no year references found, consider it consistent
  if (!yearMatches || yearMatches.length === 0) {
    return true
  }

  // Check if all year references match the frontmatter year
  return yearMatches.every((year) => year === frontmatterYear)
}
