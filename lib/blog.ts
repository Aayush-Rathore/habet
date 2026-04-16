import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";

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

export async function parseMarkdownFile(filePath: string): Promise<BlogPost> {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  const result = await remark()
    .use(remarkHtml, { sanitize: false })
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
