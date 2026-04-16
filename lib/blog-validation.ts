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
 *   [text](https://habetsports.com/)
 *   [text](https://habetsports.com)
 *
 * For other paths, matches [text](/path) or [text](https://habetsports.com/path).
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
