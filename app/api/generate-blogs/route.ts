import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { generateBlogPost } from "@/lib/gemini";
import { getAllSlugs, calculateReadingTime } from "@/lib/blog";
import { generateUniqueSlug } from "@/lib/slugify";

const KEYWORD_POOL = [
  "cricket betting tips India",
  "IPL match predictions",
  "best sports betting app India 2026",
  "HABET app kaise download kare",
  "HABET live cricket betting",
  "fantasy sports tips",
  "kabaddi betting guide",
  "football betting India",
  "sports betting strategies for beginners",
];

/**
 * Pure helper to validate Authorization header.
 * Returns true only if header === `Bearer ${secret}`.
 */
export function checkAuthorization(
  header: string | null,
  secret: string
): boolean {
  return header === `Bearer ${secret}`;
}

function extractTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "Untitled";
}

function extractExcerpt(markdown: string): string {
  // Strip the H1 line and find the first non-empty paragraph
  const lines = markdown.split("\n");
  const bodyLines: string[] = [];
  let pastH1 = false;

  for (const line of lines) {
    if (!pastH1 && /^#\s/.test(line)) {
      pastH1 = true;
      continue;
    }
    if (pastH1) {
      bodyLines.push(line);
    }
  }

  const body = bodyLines.join("\n");

  // Find first non-empty paragraph (skip headings and blank lines)
  const paragraphMatch = body.match(/^(?!#)(.+)/m);
  if (!paragraphMatch) return "";

  // Strip markdown: remove bold, italic, links, inline code
  const stripped = paragraphMatch[1]
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .replace(/[*_`~]/g, "")                   // bold/italic/code
    .trim();

  return stripped.slice(0, 160);
}

function selectTopics(pool: string[], count: number): string[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET ?? "";
  const authHeader = request.headers.get("Authorization");

  if (!checkAuthorization(authHeader, cronSecret)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const existingSlugs = await getAllSlugs();
    const topics = selectTopics(KEYWORD_POOL, 3);

    // Collect all posts in memory before writing any files (atomicity)
    const posts: Array<{ slug: string; title: string; content: string }> = [];
    const usedSlugs = [...existingSlugs];

    for (const topic of topics) {
      const markdown = await generateBlogPost(topic, [topic]);
      const title = extractTitle(markdown);
      const slug = generateUniqueSlug(title, usedSlugs);
      usedSlugs.push(slug);

      const excerpt = extractExcerpt(markdown);
      const readingTime = calculateReadingTime(markdown);
      const date = new Date().toISOString();

      const frontmatter = [
        "---",
        `title: "${title.replace(/"/g, '\\"')}"`,
        `slug: "${slug}"`,
        `date: "${date}"`,
        `excerpt: "${excerpt.replace(/"/g, '\\"')}"`,
        "keywords:",
        `  - ${topic}`,
        `author: "HABET Sports Team"`,
        `readingTime: "${readingTime}"`,
        "---",
        "",
      ].join("\n");

      const fileContent = frontmatter + markdown;
      posts.push({ slug, title, content: fileContent });
    }

    // All generation succeeded — now write all files
    const blogsDir = path.join(process.cwd(), "content", "blogs");
    await fs.promises.mkdir(blogsDir, { recursive: true });

    for (const post of posts) {
      const filePath = path.join(blogsDir, `${post.slug}.md`);
      await fs.promises.writeFile(filePath, post.content, "utf-8");
    }

    return NextResponse.json({
      success: true,
      generated: posts.map(({ slug, title }) => ({ slug, title })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
