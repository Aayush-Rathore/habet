# Design Document: HABET SEO Website

## Overview

The HABET SEO Website is a Next.js 16 App Router application targeting Indian sports betting users. Its primary goals are:

1. **Conversion** — drive downloads of the HABET app via a prominent, animated CTA button linking to `https://invite.habet.online/?i=AX7JY162`.
2. **SEO ranking** — achieve first-page Google rankings for HABET-related keywords through EEAT-compliant content, structured data, and a continuously updated AI-generated blog.
3. **Performance** — fast load times on mobile networks in India via Server Components, `next/image`, and minimal client JS.

The site has five route segments: `/` (home), `/about`, `/disclaimer`, `/blog` (listing), `/blog/[slug]` (post), plus two special routes: `/api/generate-blogs` (AI generation endpoint), `/sitemap.xml`, and `/robots.txt`.

The reference HTML files in `/public/` (home.html, about.html, disclaimer.html) are design references only — they are **not** served as pages. Their content is converted to React components.

---

## Architecture

### Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 16 App Router | SSG/SSR, Metadata API, sitemap/robots conventions |
| UI Library | React 19 | Server Components by default |
| Styling | Tailwind CSS v4 | Utility-first, zero runtime CSS |
| Component Library | ShadCN UI (blue theme, radius 1rem) | Accessible primitives, tree-shakeable |
| Markdown Parsing | `gray-matter` + `remark` + `remark-html` | gray-matter for YAML frontmatter, remark for MD→HTML |
| AI Generation | `@google/generative-ai` SDK | Official Gemini SDK, server-only |
| Font | `next/font/google` (Inter) | Zero layout shift, self-hosted |

### Rendering Strategy

```
Route                  Rendering       Reason
─────────────────────────────────────────────────────────────
/                      SSG             Static content, revalidate on blog updates
/about                 SSG             Static content
/disclaimer            SSG             Static content
/blog                  SSG + ISR       Reads /content/blogs/ at build time
/blog/[slug]           SSG             generateStaticParams pre-renders all slugs
/api/generate-blogs    Runtime (POST)  Calls Gemini API, writes files
/sitemap.xml           Dynamic         Reads blog slugs at request time
/robots.txt            Static          Fixed content
```

All page routes are React Server Components by default. Only the mobile sticky CTA and screenshot carousel (if interactive) are `"use client"` components.

### ShadCN UI Setup

ShadCN UI is installed via `npx shadcn@latest init` with the following `components.json` configuration:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "blue",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

The `globals.css` file will contain the ShadCN CSS variable definitions for the blue theme and `--radius: 1rem`. ShadCN components used: `Button`, `Card`, `CardContent`, `CardHeader`, `CardTitle`, `Badge`.

---

## Components and Interfaces

### Directory Structure

```
habet/
├── app/
│   ├── globals.css                    # Tailwind + ShadCN CSS vars + custom keyframes
│   ├── layout.tsx                     # Root layout: font, html lang, Header, Footer, StickyCTA
│   ├── page.tsx                       # Home page (SSG)
│   ├── about/
│   │   └── page.tsx                   # About page (SSG)
│   ├── disclaimer/
│   │   └── page.tsx                   # Disclaimer page (SSG)
│   ├── blog/
│   │   ├── page.tsx                   # Blog listing (SSG + ISR)
│   │   └── [slug]/
│   │       └── page.tsx               # Blog post (SSG)
│   ├── api/
│   │   └── generate-blogs/
│   │       └── route.ts               # POST /api/generate-blogs
│   ├── sitemap.ts                     # Dynamic sitemap.xml
│   └── robots.ts                      # robots.txt
├── components/
│   ├── layout/
│   │   ├── Header.tsx                 # Server Component — nav + logo
│   │   ├── Footer.tsx                 # Server Component — copyright
│   │   └── StickyCTA.tsx              # "use client" — mobile fixed CTA bar
│   ├── home/
│   │   ├── HeroSection.tsx            # Server Component — logo + animated download btn
│   │   ├── AppInfoTable.tsx           # Server Component — app details table
│   │   ├── ScreenshotsGallery.tsx     # "use client" — carousel/lightbox
│   │   ├── FeaturesSection.tsx        # Server Component
│   │   ├── HowToDownload.tsx          # Server Component
│   │   ├── WithdrawalMethods.tsx      # Server Component
│   │   ├── WhyChooseHabet.tsx         # Server Component
│   │   └── HomeFAQ.tsx                # Server Component — FAQ accordion (static)
│   ├── blog/
│   │   ├── BlogCard.tsx               # Server Component — ShadCN Card
│   │   └── BlogPostContent.tsx        # Server Component — renders HTML from remark
│   ├── shared/
│   │   ├── DownloadButton.tsx         # Server Component — animated CTA anchor
│   │   ├── DisclaimerNotice.tsx       # Server Component — 18+ notice
│   │   └── JsonLd.tsx                 # Server Component — injects JSON-LD script tag
│   └── ui/                            # ShadCN generated components
│       ├── button.tsx
│       ├── card.tsx
│       └── badge.tsx
├── lib/
│   ├── blog.ts                        # Blog file system utilities (server-only)
│   ├── gemini.ts                      # Gemini API client (server-only)
│   ├── slugify.ts                     # Slug generation utility
│   └── utils.ts                       # ShadCN cn() utility
├── content/
│   └── blogs/
│       ├── cricket-betting-tips-india-2026.md
│       ├── habet-app-download-guide.md
│       └── ipl-betting-predictions-2026.md
├── public/
│   ├── logo.png
│   ├── g1-ss1.jpeg … g1-ss5.jpeg
│   ├── home.html                      # Reference only — not served as a route
│   ├── about.html                     # Reference only
│   └── disclaimer.html                # Reference only
├── components.json                    # ShadCN config
└── .env                               # GEMINI_KEY, GEMINI_MODEL, CRON_SECRET
```

### Component Details

#### `app/layout.tsx` — Root Layout (Server Component)
- Loads Inter font via `next/font/google`
- Sets `<html lang="en">`
- Renders `<Header />`, `{children}`, `<Footer />`, `<StickyCTA />`
- Exports global `metadata` with site-level defaults

#### `components/layout/Header.tsx` — Server Component
- Logo: `<Image src="/logo.png" ... priority />` wrapped in `<Link href="/">`
- Nav links: Home, About, Disclaimer, Blog
- Responsive: hamburger menu on mobile (uses ShadCN `Button` variant="ghost")
- No `"use client"` needed — nav links are plain anchors

#### `components/layout/StickyCTA.tsx` — Client Component
```typescript
"use client"
// Fixed bottom bar, visible only on md:hidden (mobile)
// Contains <DownloadButton /> with text "Download HABET App"
// Uses CSS: fixed bottom-0 left-0 right-0 z-50 md:hidden
```

#### `components/shared/DownloadButton.tsx` — Server Component
```typescript
// <a href="https://invite.habet.online/?i=AX7JY162" ...>
// className: animate-bounce + custom glow/pulse keyframes
// Renders as a styled anchor — no client JS needed
```

#### `components/shared/JsonLd.tsx` — Server Component
```typescript
// Accepts a `data` prop (object) and renders:
// <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
```

#### `components/home/ScreenshotsGallery.tsx` — Client Component
```typescript
"use client"
// Simple horizontal scroll or lightbox for 5 screenshots
// Uses next/image for each screenshot
// Minimal JS: CSS scroll-snap or a lightweight carousel
```

#### `components/blog/BlogCard.tsx` — Server Component
```typescript
// Props: { title, excerpt, date, slug }
// Uses ShadCN <Card>, <CardHeader>, <CardTitle>, <CardContent>, <Badge>
// Links to /blog/[slug]
```

---

## Data Models

### Blog Post Frontmatter

Every markdown file in `/content/blogs/` must have this YAML frontmatter:

```typescript
interface BlogFrontmatter {
  title: string;           // e.g. "Cricket Betting Tips India 2026"
  slug: string;            // e.g. "cricket-betting-tips-india-2026"
  date: string;            // ISO 8601: "2026-02-09T10:00:00Z"
  excerpt: string;         // Max 160 chars — used as meta description
  keywords: string[];      // e.g. ["cricket betting", "IPL tips", "HABET"]
  author: string;          // e.g. "HABET Sports Team"
  readingTime: string;     // e.g. "8 min read"
}
```

### Blog Post (parsed)

```typescript
interface BlogPost {
  frontmatter: BlogFrontmatter;
  content: string;         // Raw markdown body (after frontmatter stripped)
  htmlContent?: string;    // Rendered HTML (populated by remark pipeline)
}
```

### `lib/blog.ts` — Blog Utilities

```typescript
// All functions are server-only (use Node.js fs module)

// Returns all posts sorted by date descending
export async function getAllPosts(): Promise<BlogPost[]>

// Returns a single post by slug, or null if not found
export async function getPostBySlug(slug: string): Promise<BlogPost | null>

// Returns all slugs (for generateStaticParams)
export async function getAllSlugs(): Promise<string[]>

// Parses a markdown file: gray-matter for frontmatter, remark for HTML
async function parseMarkdownFile(filePath: string): Promise<BlogPost>
```

**Data flow for blog reading:**
```
Build time:
  fs.readdirSync('/content/blogs/')
    → gray-matter(fileContent) → { data: frontmatter, content: markdownBody }
    → remark().use(remarkHtml).process(markdownBody) → htmlContent
    → BlogPost[]

Runtime (blog post page):
  getPostBySlug(slug) → BlogPost | null
  → if null: notFound()
  → else: render BlogPostContent with htmlContent
```

### Gemini API Request/Response

```typescript
// lib/gemini.ts
interface GenerateBlogRequest {
  topic: string;           // Selected from keyword pool
  keywords: string[];      // 3-5 target keywords
}

interface GenerateBlogResult {
  slug: string;
  filePath: string;
  frontmatter: BlogFrontmatter;
  markdownContent: string;
}
```

### API Route Request/Response

```typescript
// POST /api/generate-blogs
// Headers: Authorization: Bearer <CRON_SECRET>

// Success response (200):
interface GenerateBlogsResponse {
  success: true;
  generated: Array<{ slug: string; title: string }>;
}

// Error response (401 | 500):
interface GenerateBlogsError {
  success: false;
  error: string;
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Blog frontmatter round-trip

*For any* valid blog post markdown file written to `/content/blogs/`, parsing it with `gray-matter` and then re-serializing the frontmatter fields should produce an object structurally equivalent to the original `BlogFrontmatter` — all required fields (`title`, `slug`, `date`, `excerpt`, `keywords`, `author`, `readingTime`) are present and have the correct types.

**Validates: Requirements 10.2, 10.4**

### Property 2: Slug uniqueness on collision

*For any* set of blog generation calls where a slug already exists on disk, the Blog_System shall produce a new slug that does not collide with any existing slug in `/content/blogs/`.

**Validates: Requirements 7.8**

### Property 3: Generated blog post structure invariant

*For any* blog post generated by the Gemini API pipeline, the resulting markdown content shall contain at least one H1 (`# `), at least four H2 (`## `) headings, at least two H3 (`### `) headings, a FAQ section, and a conclusion section.

**Validates: Requirements 7.5**

### Property 4: Blog post word count minimum

*For any* blog post generated by the Gemini API pipeline, the word count of the markdown body (excluding frontmatter) shall be at least 1500 words.

**Validates: Requirements 7.4**

### Property 5: Internal link presence in generated posts

*For any* blog post generated by the Gemini API pipeline, the markdown body shall contain at least one markdown link pointing to `/` (the home page).

**Validates: Requirements 7.9**

### Property 6: CRON_SECRET authorization

*For any* POST request to `/api/generate-blogs` that does not include a valid `Authorization: Bearer <CRON_SECRET>` header, the route shall return a 401 response and shall not write any files to disk.

**Validates: Requirements 7.12**

### Property 7: Partial failure atomicity

*For any* Gemini API call that throws an error during blog generation, the route shall return a 500 response and shall not write any partial markdown files to `/content/blogs/`.

**Validates: Requirements 7.11**

---

## Error Handling

### Blog File System Errors

| Scenario | Handling |
|---|---|
| `/content/blogs/` directory does not exist | `getAllPosts()` returns `[]`; blog listing shows "coming soon" message |
| Markdown file has malformed frontmatter | `parseMarkdownFile` throws; caught in `getAllPosts`, post is skipped with console warning |
| Slug not found | `getPostBySlug` returns `null`; page calls `notFound()` → 404 |

### API Route Errors

| Scenario | HTTP Status | Behavior |
|---|---|---|
| Missing/invalid `Authorization` header | 401 | Return `{ success: false, error: "Unauthorized" }` — no file writes |
| Gemini API key missing | 500 | Return `{ success: false, error: "GEMINI_KEY not configured" }` |
| Gemini API call fails (network/quota) | 500 | Return `{ success: false, error: "<message>" }` — no partial files written |
| Slug collision | — | Append `-<timestamp>` suffix and retry slug uniqueness check |
| File write failure | 500 | Return `{ success: false, error: "Failed to write blog file" }` |

### Client-Side Errors

The `StickyCTA` and `ScreenshotsGallery` are the only client components. Both are wrapped in React error boundaries at the layout level to prevent hydration errors from breaking the full page.

---

## Testing Strategy

### Assessment: Is Property-Based Testing Applicable?

This feature is primarily a **content-rendering website** with two areas of logic:

1. **Blog file system utilities** (`lib/blog.ts`) — pure parsing functions with clear input/output behavior. PBT applies here.
2. **Gemini API integration** (`lib/gemini.ts`, `app/api/generate-blogs/route.ts`) — involves external API calls and file I/O. The *validation logic* (structure checking, slug generation) is testable with PBT using mocks; the actual API call is tested with integration tests.
3. **Page rendering** — React Server Components rendering static/markdown content. Snapshot tests and example-based tests are more appropriate than PBT.
4. **SEO metadata** — deterministic per-page metadata. Example-based tests.

**PBT library choice:** `fast-check` (TypeScript-native, excellent Next.js ecosystem support).

### Unit Tests (Example-Based)

**`lib/blog.ts`**
- `getAllPosts()` returns posts sorted by date descending
- `getPostBySlug('existing-slug')` returns the correct post
- `getPostBySlug('nonexistent')` returns `null`
- `parseMarkdownFile` correctly separates frontmatter from body

**`lib/slugify.ts`**
- Converts title to kebab-case slug
- Handles special characters and Hindi text gracefully
- Appends timestamp suffix on collision

**`app/api/generate-blogs/route.ts`**
- Returns 401 when `Authorization` header is missing
- Returns 401 when `Authorization` header has wrong secret
- Returns 500 when Gemini API throws
- Returns 200 with slug list on success (mocked Gemini)
- Does not write files on Gemini failure

**SEO Metadata**
- Home page `generateMetadata` returns correct title, description, canonical, OG, Twitter tags
- Blog post `generateMetadata` returns `og:type: "article"` with `publishedTime`
- Sitemap includes all static pages and all blog slugs

### Property-Based Tests (fast-check)

**Feature: habet-seo-website, Property 1: Blog frontmatter round-trip**
```typescript
// For any valid BlogFrontmatter object, serializing to YAML frontmatter
// and parsing back with gray-matter produces an equivalent object.
// Minimum 100 iterations.
```

**Feature: habet-seo-website, Property 2: Slug uniqueness on collision**
```typescript
// For any set of existing slugs and any new title, generateUniqueSlug()
// always returns a slug not present in the existing set.
// Minimum 100 iterations.
```

**Feature: habet-seo-website, Property 3: Generated blog post structure invariant**
```typescript
// For any mock Gemini response string, validateBlogStructure(content)
// correctly identifies whether H1/H2/H3/FAQ/conclusion requirements are met.
// Minimum 100 iterations with varied markdown structures.
```

**Feature: habet-seo-website, Property 4: Blog post word count minimum**
```typescript
// For any markdown string, countWords(markdown) returns a value
// consistent with the actual word count (within ±5 words of manual count).
// Minimum 100 iterations.
```

**Feature: habet-seo-website, Property 5: Internal link presence**
```typescript
// For any generated markdown body, containsInternalLink(content, '/')
// correctly returns true iff the content contains a markdown link to '/'.
// Minimum 100 iterations.
```

**Feature: habet-seo-website, Property 6: CRON_SECRET authorization**
```typescript
// For any string that is not equal to CRON_SECRET, the auth check
// function returns false. For the exact CRON_SECRET value, returns true.
// Minimum 100 iterations with random string generation.
```

**Feature: habet-seo-website, Property 7: Partial failure atomicity**
```typescript
// For any simulated Gemini failure at any point in the 3-post generation loop,
// no files are written to disk (verified via mocked fs.writeFile).
// Minimum 100 iterations with failure injected at random positions.
```

### Integration Tests

- `GET /sitemap.xml` returns valid XML containing all static routes and blog slugs
- `GET /robots.txt` returns correct content with sitemap reference
- `POST /api/generate-blogs` with valid secret writes 3 markdown files (uses real Gemini API in CI with `GEMINI_KEY`)
- Blog listing page renders cards for all files in `/content/blogs/`
- Blog post page renders correct H1 from frontmatter title

### Snapshot Tests

- Home page renders without errors (React Testing Library + `@testing-library/jest-dom`)
- Blog card renders title, excerpt, date, and link correctly
- JSON-LD output for home page matches expected WebSite schema shape
- JSON-LD output for blog post matches expected Article schema shape

---

## Implementation Notes

### CSS Animation for Download Button

The animated download button uses a combination of Tailwind built-in utilities and custom keyframes defined in `globals.css`:

```css
/* globals.css — custom keyframes */
@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 8px 2px rgba(59, 130, 246, 0.6);
  }
  50% {
    box-shadow: 0 0 20px 6px rgba(59, 130, 246, 0.9);
  }
}

@keyframes btn-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
```

The `DownloadButton` component applies both animations via a combined CSS custom property in `globals.css` to avoid Tailwind conflicts:

```css
/* globals.css */
.btn-download {
  animation: btn-bounce 1.5s ease-in-out infinite, glow-pulse 2s ease-in-out infinite;
}
```

```tsx
<a className="btn-download ...">Download HABET App</a>
```

Since this is a plain `<a>` tag with CSS animations, it requires no `"use client"` directive.

### Mobile Sticky CTA

`StickyCTA` is a `"use client"` component because it uses `useEffect` to add a scroll listener that hides the bar when the hero's own download button is visible in the viewport (using `IntersectionObserver`). This prevents duplicate CTAs from showing simultaneously on mobile.

```typescript
"use client"
import { useEffect, useState } from "react"

export function StickyCTA() {
  const [visible, setVisible] = useState(false)
  
  useEffect(() => {
    const hero = document.getElementById("hero-download-btn")
    if (!hero) { setVisible(true); return }
    
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.5 }
    )
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])
  
  if (!visible) return null
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t p-3">
      <DownloadButton className="w-full" />
    </div>
  )
}
```

### Gemini API Integration

`lib/gemini.ts` is a server-only module (never imported in client components):

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialized once per module load
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY!)
const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL! })

export async function generateBlogPost(topic: string, keywords: string[]): Promise<string>
```

The prompt instructs Gemini to:
1. Write in English with natural Hindi phrases where appropriate (for Indian audience)
2. Include specific data points (match statistics, odds ranges, payout percentages)
3. Structure with H1, 4+ H2s, 2+ H3s, FAQ section (3+ Q&A pairs), conclusion
4. Include at least one internal link to `https://habetsports.com/` (rendered as `/` in markdown)
5. Minimum 1500 words
6. Follow EEAT principles

### Sitemap Generation

`app/sitemap.ts` uses Next.js App Router conventions:

```typescript
import type { MetadataRoute } from "next"
import { getAllPosts } from "@/lib/blog"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts()
  const BASE_URL = "https://habetsports.com"
  
  const staticRoutes = ["/", "/about", "/disclaimer", "/blog"].map(route => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "/" ? 1.0 : 0.8,
  }))
  
  const blogRoutes = posts.map(post => ({
    url: `${BASE_URL}/blog/${post.frontmatter.slug}`,
    lastModified: new Date(post.frontmatter.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))
  
  return [...staticRoutes, ...blogRoutes]
}
```

### Internal Linking Strategy

Blog posts generated by Gemini are prompted to include internal links. The strategy:

- **Home page** (`/`): Every generated post links to home with anchor text like "download HABET app" or "HABET sports betting app"
- **Related posts**: The generation prompt includes the titles of the 2 most recent existing posts so Gemini can reference them with `/blog/<slug>` links
- **Static pages**: About and Disclaimer pages include keyword-rich links back to home and blog

### Seed Blog Posts

Three seed posts are committed to `/content/blogs/` at initial setup:

1. **`cricket-betting-tips-india-2026.md`**
   - Title: "Cricket Betting Tips India 2026 – Win More with HABET"
   - Keywords: cricket betting tips India, IPL betting, HABET cricket
   - ~1600 words, includes FAQ section

2. **`habet-app-download-guide.md`**
   - Title: "HABET App Download Guide 2026 – Android & iOS Step-by-Step"
   - Keywords: HABET app download, HABET APK, HABET kaise download kare
   - ~1500 words, includes FAQ section

3. **`ipl-betting-predictions-2026.md`**
   - Title: "IPL Betting Predictions 2026 – Expert Tips & HABET Odds"
   - Keywords: IPL betting predictions, IPL 2026 tips, best IPL betting app
   - ~1700 words, includes FAQ section

### JSON-LD Structured Data

**Home page** — WebSite schema:
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "habetsports.com",
  "url": "https://habetsports.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://habetsports.com/blog?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

**Blog post** — Article schema:
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "<title from frontmatter>",
  "datePublished": "<date from frontmatter>",
  "dateModified": "<date from frontmatter>",
  "author": { "@type": "Organization", "name": "HABET Sports Team" },
  "publisher": { "@type": "Organization", "name": "habetsports.com", "url": "https://habetsports.com" },
  "description": "<excerpt from frontmatter>"
}
```

**Blog post with FAQ** — FAQPage schema (appended alongside Article):
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "<question text>",
      "acceptedAnswer": { "@type": "Answer", "text": "<answer text>" }
    }
  ]
}
```

FAQ items are extracted from the markdown by parsing `## FAQ` section headings and `**Q:** / **A:**` patterns.

### Markdown Parsing Pipeline

```
/content/blogs/[slug].md
  → fs.readFileSync()
  → gray-matter(content)
      → data: BlogFrontmatter
      → content: string (markdown body)
  → remark()
      .use(remarkHtml, { sanitize: false })
      .process(content)
  → String(result) → htmlContent
  → <BlogPostContent html={htmlContent} />
      → <article dangerouslySetInnerHTML={{ __html: html }} />
```

`sanitize: false` is safe here because the content source is our own generated markdown files, not user input.

### Reading Time Calculation

```typescript
// lib/blog.ts
export function calculateReadingTime(markdown: string): string {
  const wordsPerMinute = 200
  const wordCount = markdown.trim().split(/\s+/).length
  const minutes = Math.ceil(wordCount / wordsPerMinute)
  return `${minutes} min read`
}
```

This is called during blog generation and stored in frontmatter so it's available without re-parsing at render time.
