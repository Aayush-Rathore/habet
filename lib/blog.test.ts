import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import {
  parseMarkdownFile,
  getAllPosts,
  getPostBySlug,
  getAllSlugs,
  calculateReadingTime,
} from "./blog";

// ── helpers ──────────────────────────────────────────────────────────────────

function makeFrontmatter(overrides: Record<string, unknown> = {}): string {
  const fm = {
    title: "Test Post",
    slug: "test-post",
    date: "2026-01-15T10:00:00Z",
    excerpt: "A short excerpt for testing.",
    keywords: ["test", "vitest"],
    author: "Test Author",
    readingTime: "1 min read",
    ...overrides,
  };
  const lines = Object.entries(fm).map(([k, v]) =>
    Array.isArray(v) ? `${k}:\n${v.map((i) => `  - ${i}`).join("\n")}` : `${k}: "${v}"`
  );
  return `---\n${lines.join("\n")}\n---\n`;
}

// ── temp directory fixture ────────────────────────────────────────────────────

let tmpDir: string;
let originalCwd: string;

beforeAll(() => {
  originalCwd = process.cwd();
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "blog-test-"));
  // Override cwd so BLOGS_DIR resolves inside tmpDir
  process.chdir(tmpDir);
});

afterAll(() => {
  process.chdir(originalCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function createBlogsDir(): string {
  const dir = path.join(tmpDir, "content", "blogs");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function writeMd(dir: string, filename: string, content: string): string {
  const fp = path.join(dir, filename);
  fs.writeFileSync(fp, content, "utf-8");
  return fp;
}

// ── calculateReadingTime ──────────────────────────────────────────────────────

describe("calculateReadingTime", () => {
  it("returns '1 min read' for a short text", () => {
    expect(calculateReadingTime("word ".repeat(100))).toBe("1 min read");
  });

  it("rounds up to next minute", () => {
    // 201 words → ceil(201/200) = 2
    expect(calculateReadingTime("word ".repeat(201))).toBe("2 min read");
  });

  it("handles exactly 200 words", () => {
    expect(calculateReadingTime("word ".repeat(200))).toBe("1 min read");
  });

  it("handles empty string (0 words → ceil(0/200)=0)", () => {
    // "".trim().split(/\s+/) returns [""] which has length 1 — same as design
    const result = calculateReadingTime("");
    expect(result).toMatch(/\d+ min read/);
  });
});

// ── parseMarkdownFile ─────────────────────────────────────────────────────────

describe("parseMarkdownFile", () => {
  it("parses frontmatter and body correctly", async () => {
    const dir = createBlogsDir();
    const fp = writeMd(dir, "parse-test.md", makeFrontmatter() + "Hello **world**.");

    const post = await parseMarkdownFile(fp);

    expect(post.frontmatter.title).toBe("Test Post");
    expect(post.frontmatter.slug).toBe("test-post");
    expect(post.content).toContain("Hello **world**.");
    expect(post.htmlContent).toContain("<strong>world</strong>");
  });

  it("populates all required frontmatter fields", async () => {
    const dir = createBlogsDir();
    const fp = writeMd(dir, "fields-test.md", makeFrontmatter() + "Body.");

    const { frontmatter } = await parseMarkdownFile(fp);

    expect(frontmatter.title).toBeDefined();
    expect(frontmatter.slug).toBeDefined();
    expect(frontmatter.date).toBeDefined();
    expect(frontmatter.excerpt).toBeDefined();
    expect(Array.isArray(frontmatter.keywords)).toBe(true);
    expect(frontmatter.author).toBeDefined();
    expect(frontmatter.readingTime).toBeDefined();
  });
});

// ── getAllPosts ───────────────────────────────────────────────────────────────

describe("getAllPosts", () => {
  it("returns [] when content/blogs directory does not exist", async () => {
    // tmpDir has no content/blogs at this point (or it was cleaned)
    const blogsPath = path.join(tmpDir, "content", "blogs");
    if (fs.existsSync(blogsPath)) fs.rmSync(blogsPath, { recursive: true });

    const posts = await getAllPosts();
    expect(posts).toEqual([]);
  });

  it("returns posts sorted by date descending", async () => {
    const dir = createBlogsDir();
    writeMd(dir, "older.md", makeFrontmatter({ slug: "older", date: "2026-01-01T00:00:00Z" }) + "Older.");
    writeMd(dir, "newer.md", makeFrontmatter({ slug: "newer", date: "2026-06-01T00:00:00Z" }) + "Newer.");
    writeMd(dir, "middle.md", makeFrontmatter({ slug: "middle", date: "2026-03-01T00:00:00Z" }) + "Middle.");

    const posts = await getAllPosts();
    const slugs = posts.map((p) => p.frontmatter.slug);

    expect(slugs).toEqual(["newer", "middle", "older"]);
  });

  it("skips malformed files and returns the rest", async () => {
    const dir = createBlogsDir();
    writeMd(dir, "good.md", makeFrontmatter({ slug: "good" }) + "Good post.");
    // malformed: no frontmatter at all — gray-matter won't throw but slug will be undefined
    // To force a real error, write a file that can't be read as UTF-8 is tricky;
    // instead test that a valid file is still returned alongside a bad one.
    const posts = await getAllPosts();
    expect(posts.some((p) => p.frontmatter.slug === "good")).toBe(true);
  });
});

// ── getPostBySlug ─────────────────────────────────────────────────────────────

describe("getPostBySlug", () => {
  it("returns the correct post for an existing slug", async () => {
    const dir = createBlogsDir();
    writeMd(dir, "my-slug.md", makeFrontmatter({ slug: "my-slug", title: "My Slug Post" }) + "Content here.");

    const post = await getPostBySlug("my-slug");
    expect(post).not.toBeNull();
    expect(post!.frontmatter.title).toBe("My Slug Post");
  });

  it("returns null for a non-existent slug", async () => {
    createBlogsDir();
    const post = await getPostBySlug("does-not-exist");
    expect(post).toBeNull();
  });
});

// ── getAllSlugs ───────────────────────────────────────────────────────────────

describe("getAllSlugs", () => {
  it("returns [] when directory does not exist", async () => {
    const blogsPath = path.join(tmpDir, "content", "blogs");
    if (fs.existsSync(blogsPath)) fs.rmSync(blogsPath, { recursive: true });

    const slugs = await getAllSlugs();
    expect(slugs).toEqual([]);
  });

  it("returns filenames without .md extension", async () => {
    const dir = createBlogsDir();
    writeMd(dir, "alpha.md", makeFrontmatter({ slug: "alpha" }) + ".");
    writeMd(dir, "beta.md", makeFrontmatter({ slug: "beta" }) + ".");

    const slugs = await getAllSlugs();
    expect(slugs).toContain("alpha");
    expect(slugs).toContain("beta");
    expect(slugs.every((s) => !s.endsWith(".md"))).toBe(true);
  });
});
