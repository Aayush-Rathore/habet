import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import type { Root } from "hast";
import { visit } from "unist-util-visit";

export interface BlogFrontmatter {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  keywords: string[];
  author: string;
  readingTime: string;
}

export interface BlogPost {
  frontmatter: BlogFrontmatter;
  content: string;
  htmlContent?: string;
}

function getBlogsDir(): string {
  return path.join(process.cwd(), "content", "blogs");
}

/**
 * Rehype plugin: classify internal vs external links and add appropriate
 * attributes and styling classes.
 *
 * Internal links (starting with /) get:
 *   - class="internal-link"  (styled as a pill/badge in CSS)
 *   - no rel/target changes
 *
 * External links get:
 *   - target="_blank" rel="noopener noreferrer"
 *   - class="external-link"
 */
function rehypeClassifyLinks() {
  return (tree: Root) => {
    visit(tree, "element", (node) => {
      if (node.tagName !== "a") return;

      const href = (node.properties?.href as string) ?? "";

      if (href.startsWith("/") && !href.startsWith("//")) {
        // Internal link
        const existing = (node.properties?.className as string[]) ?? [];
        node.properties = {
          ...node.properties,
          className: [...existing, "internal-link"],
        };
      } else if (href.startsWith("http") || href.startsWith("//")) {
        // External link
        const existing = (node.properties?.className as string[]) ?? [];
        node.properties = {
          ...node.properties,
          className: [...existing, "external-link"],
          target: "_blank",
          rel: "noopener noreferrer",
        };
      }
    });
  };
}

export async function parseMarkdownFile(filePath: string): Promise<BlogPost> {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  const result = await remark()
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeClassifyLinks)
    .use(rehypeStringify)
    .process(content);

  return {
    frontmatter: data as BlogFrontmatter,
    content,
    htmlContent: String(result),
  };
}

export async function getAllPosts(): Promise<BlogPost[]> {
  const BLOGS_DIR = getBlogsDir();
  if (!fs.existsSync(BLOGS_DIR)) {
    return [];
  }

  const files = fs.readdirSync(BLOGS_DIR).filter((f) => f.endsWith(".md"));
  const posts: BlogPost[] = [];

  for (const file of files) {
    try {
      const post = await parseMarkdownFile(path.join(BLOGS_DIR, file));
      posts.push(post);
    } catch (err) {
      console.warn(`Skipping malformed blog file: ${file}`, err);
    }
  }

  return posts.sort(
    (a, b) =>
      new Date(b.frontmatter.date).getTime() -
      new Date(a.frontmatter.date).getTime()
  );
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const filePath = path.join(getBlogsDir(), `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return await parseMarkdownFile(filePath);
  } catch {
    return null;
  }
}

export async function getAllSlugs(): Promise<string[]> {
  const BLOGS_DIR = getBlogsDir();
  if (!fs.existsSync(BLOGS_DIR)) {
    return [];
  }
  return fs
    .readdirSync(BLOGS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export function calculateReadingTime(markdown: string): string {
  const wordsPerMinute = 200;
  const wordCount = markdown.trim().split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return `${minutes} min read`;
}
