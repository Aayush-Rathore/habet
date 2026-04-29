/**
 * scripts/fix-blog-links.ts
 *
 * Cleans up malformed nested markdown links in all blog posts.
 *
 * Patterns fixed:
 *   [[[text](url1)](url2)](url3)  →  [text](url3)   (outermost URL wins)
 *   [[text](url1)](url2)          →  [text](url2)   (outermost URL wins)
 *
 * Run with:  npx tsx scripts/fix-blog-links.ts
 */

import fs from "fs";
import path from "path";

const BLOGS_DIR = path.join(process.cwd(), "content", "blogs");

/**
 * Repeatedly unwrap nested markdown links until none remain.
 *
 * Handles patterns like:
 *   [[text](url1)](url2)           →  [text](url2)
 *   [[text](url1) extra](url2)     →  [text extra](url2)
 *   [[[text](url1)](url2)](url3)   →  [text](url3)
 */
function fixNestedLinks(content: string): string {
  // Pattern: [ [innerText](innerUrl) optionalExtraText ](outerUrl)
  // Captures: group1 = full bracket content, group2 = outerUrl
  const nestedLinkPattern = /\[(\[[^\]]*\]\([^)]*\)[^\]]*)\]\(([^)]*)\)/g;

  let prev = "";
  let result = content;

  // Iterate until no more nested links exist (handles triple/quadruple nesting)
  while (result !== prev) {
    prev = result;
    result = result.replace(nestedLinkPattern, (_, innerContent, outerUrl) => {
      // Strip the inner link syntax, keeping the text + any trailing text
      // [text](url) extra  →  text extra
      const innerText = innerContent
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .trim();
      return `[${innerText}](${outerUrl})`;
    });
  }

  return result;
}

/**
 * After unwrapping, some links may have empty or whitespace-only anchor text.
 * Replace those with a sensible fallback based on the URL.
 */
function fixEmptyAnchorText(content: string): string {
  return content.replace(/\[(\s*)\]\(([^)]+)\)/g, (_, text, url) => {
    if (text.trim()) return `[${text}](${url})`;
    // Derive label from URL
    if (url === "/") return `[HABET](${url})`;
    const slug = url.split("/").pop() ?? url;
    const label = slug
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c: string) => c.toUpperCase());
    return `[${label}](${url})`;
  });
}

function processFile(filePath: string): { changed: boolean; fixes: number } {
  const original = fs.readFileSync(filePath, "utf-8");

  let fixed = fixNestedLinks(original);
  fixed = fixEmptyAnchorText(fixed);

  if (fixed === original) return { changed: false, fixes: 0 };

  // Count how many links were fixed (rough estimate)
  const originalNested = (original.match(/\[\[/g) ?? []).length;
  const fixedNested = (fixed.match(/\[\[/g) ?? []).length;
  const fixes = originalNested - fixedNested;

  fs.writeFileSync(filePath, fixed, "utf-8");
  return { changed: true, fixes };
}

function main() {
  if (!fs.existsSync(BLOGS_DIR)) {
    console.error(`Blogs directory not found: ${BLOGS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(BLOGS_DIR).filter((f) => f.endsWith(".md"));
  let totalFixed = 0;

  for (const file of files) {
    const filePath = path.join(BLOGS_DIR, file);
    const { changed, fixes } = processFile(filePath);
    if (changed) {
      console.log(`✅ Fixed ${fixes} nested link(s) in: ${file}`);
      totalFixed++;
    } else {
      console.log(`   No changes needed:  ${file}`);
    }
  }

  console.log(`\nDone. Fixed ${totalFixed} file(s).`);
}

main();
