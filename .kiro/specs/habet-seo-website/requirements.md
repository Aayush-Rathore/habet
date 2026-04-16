# Requirements Document

## Introduction

This feature covers the complete build of the HABET Sports Betting App website — a modern, SEO-optimized Next.js 16 site targeting Indian sports betting users. The site must rank on Google's first page for HABET-related keywords, publish 3 AI-generated blog posts per day via the Gemini API, and follow EEAT (Experience, Expertise, Authority, Trust) principles throughout. The stack is Next.js 16 App Router, React 19, Tailwind CSS v4, TypeScript, and ShadCN UI. Reference designs exist as static HTML files in `/public/` and must be converted to React components — not served directly.

---

## Glossary

- **Website**: The Next.js 16 App Router application being built.
- **Download_CTA**: The primary call-to-action button linking to `https://invite.habet.online/?i=AX7JY162`.
- **Blog_System**: The AI-powered blog generation and display subsystem.
- **Gemini_API**: Google's Gemini generative AI API, accessed via `GEMINI_KEY` and `GEMINI_MODEL` environment variables.
- **Blog_Post**: A markdown file stored in `/content/blogs/` representing a single AI-generated article.
- **Slug**: A URL-safe, kebab-case identifier derived from a blog post title.
- **Sitemap**: The dynamically generated `sitemap.xml` file listing all indexable pages.
- **JSON-LD**: JavaScript Object Notation for Linked Data, used for structured data markup.
- **EEAT**: Google's quality framework — Experience, Expertise, Authority, Trust.
- **ShadCN_UI**: The component library used for UI primitives (Button, Card, Badge, Dialog).
- **Sticky_CTA**: A fixed-position download button visible on mobile viewports at all times.
- **Metadata_API**: Next.js built-in API for generating `<head>` metadata per page.
- **App_Screenshots**: The five JPEG images at `public/g1-ss1.jpeg` through `public/g1-ss5.jpeg`.

---

## Requirements

### Requirement 1: Project Foundation & Global Layout

**User Story:** As a site visitor, I want a consistent, branded layout across all pages, so that I recognize the HABET brand and can navigate easily.

#### Acceptance Criteria

1. THE Website SHALL render a shared navigation header on every page containing the HABET logo (`/logo.png`) and links to Home (`/`), About (`/about`), Disclaimer (`/disclaimer`), and Blog (`/blog`).
2. THE Website SHALL render a shared footer on every page containing the copyright notice "Copyright © 2026 habetsports.com — HABET is for 18+ users only. Online betting involves risk — play responsibly and only where it is legal."
3. THE Website SHALL apply a blue primary color scheme (`primary: blue`) and a border radius of `1rem` globally via ShadCN UI theme configuration.
4. THE Website SHALL use `next/font` to load the site's primary typeface with zero layout shift.
5. WHEN a user visits any page on a mobile viewport (width ≤ 768px), THE Website SHALL display a Sticky_CTA bar fixed to the bottom of the screen containing the Download_CTA button.
6. THE Website SHALL use `next/image` for all image rendering, with explicit `width`, `height`, and descriptive `alt` text on every image.
7. THE Website SHALL set `lang="en"` on the root `<html>` element.

---

### Requirement 2: Home Page (`/`)

**User Story:** As an Indian sports betting user searching for HABET, I want to land on a compelling home page that immediately shows me the app and a download button, so that I can download HABET quickly.

#### Acceptance Criteria

1. THE Website SHALL render a single `<h1>` on the home page with the text "HABET Sports Betting App 2026 – Live Odds & Fast Payouts".
2. THE Website SHALL include the primary keyword "HABET sports betting app" within the first 100 words of visible body text on the home page.
3. THE Website SHALL display the HABET logo (`/logo.png`) prominently at the top of the Hero section using `next/image`.
4. THE Website SHALL render the Download_CTA button in the Hero section with a CSS bounce animation and a pulse/glow visual effect.
5. THE Website SHALL display an app info table containing: App Name (HABET APK), App Size (66.54 MB), App Bonus (Rs. 500 New User Bonus), App Developer (HABET.COM).
6. THE Website SHALL display the five App_Screenshots in a responsive image gallery or carousel section.
7. THE Website SHALL include sections for: Key Features (Live Sports Betting, Casino & Live Games, Fast & Secure Transactions, Intuitive Mobile App), How to Download (Android & iOS steps), Withdrawal Methods (Bank Transfer, UPI, E-Wallets), and Why Choose HABET.
8. THE Website SHALL include a Disclaimer notice on the home page stating "HABET is for 18+ users only. Online betting involves risk — play responsibly and only where it is legal."
9. THE Website SHALL include at least two internal links from the home page to other pages (e.g., `/about`, `/blog`) using keyword-rich anchor text.
10. THE Website SHALL export a `generateMetadata` function for the home page returning: title "HABET Sports Betting App 2026 with Live Odds & Fast Payouts", description "HABET sports betting app offers live betting, casino games, competitive odds, and secure transactions in one platform.", canonical URL, OpenGraph tags, and Twitter Card tags.
11. THE Website SHALL embed a WebSite JSON-LD structured data block on the home page.

---

### Requirement 3: About Page (`/about`)

**User Story:** As a user wanting to learn about HABET, I want a dedicated About page that explains the app's features and how to download it, so that I trust the platform.

#### Acceptance Criteria

1. THE Website SHALL render a single `<h1>` on the About page with the text "HABET SPORTS APK Download 2026 – Live Sports Betting & Fast Withdrawal".
2. THE Website SHALL include the primary keyword "HABET SPORTS APK" within the first 100 words of visible body text on the About page.
3. THE Website SHALL convert the content from `public/about.html` into a React component, preserving all text content including the Hindi/English mixed sections.
4. THE Website SHALL include the following content sections on the About page: About HABET Sports APK (bilingual description), Key Features list (Live Cricket & Sports Betting, Multiple Sports Betting Options, Real Money Winning Games, Signup Bonus & Daily Offers, Safe & Secure & Trusted Platform, Fast Deposit & Instant Withdrawal, Android Compatible Sports APK), Why Choose HABET SPORTS APP, HABET SPORTS Download, and a Note section with the 18+ responsible gambling disclaimer.
5. THE Website SHALL display the Download_CTA button on the About page.
6. THE Website SHALL include at least two internal links from the About page to other pages using keyword-rich anchor text.
7. THE Website SHALL export a `generateMetadata` function for the About page returning: title "HABET SPORTS APK Download 2026 – Live Sports Betting & Fast Withdrawal", description "Download HABET SPORTS APK for live sports betting. Bet on cricket, football & more. Earn real cash with fast and secure withdrawals.", canonical URL, OpenGraph tags, and Twitter Card tags.

---

### Requirement 4: Disclaimer Page (`/disclaimer`)

**User Story:** As a user or regulator, I want a clear disclaimer page that explains the legal and responsible gambling terms, so that I understand the risks and legal context.

#### Acceptance Criteria

1. THE Website SHALL render a single `<h1>` on the Disclaimer page with the text "Disclaimer – HABET Betting App".
2. THE Website SHALL convert the content from `public/disclaimer.html` into a React component, preserving all text content including the Hindi-language note section.
3. THE Website SHALL include the following content on the Disclaimer page: the main disclaimer text (bilingual), a Note section in Hindi stating the 18+ age restriction and responsible gambling message, and the Download_CTA button.
4. THE Website SHALL include at least one internal link from the Disclaimer page to the Home page using keyword-rich anchor text.
5. THE Website SHALL export a `generateMetadata` function for the Disclaimer page returning: title "HABET Betting App 2026 – Live Sports Betting App in India", description "HABET Betting App ek online sports betting aur real money gaming platform hai. Yeh app sirf 18+ users ke liye hai.", canonical URL, OpenGraph tags, and Twitter Card tags.

---

### Requirement 5: Blog Listing Page (`/blog`)

**User Story:** As a user interested in sports betting tips, I want a blog listing page that shows all published articles, so that I can find and read relevant content.

#### Acceptance Criteria

1. THE Website SHALL render a single `<h1>` on the Blog listing page with the text "HABET Sports Betting Blog – Tips, Predictions & Guides".
2. THE Website SHALL read all Blog_Post markdown files from `/content/blogs/` at build time and display them as a grid of cards.
3. WHEN no Blog_Post files exist in `/content/blogs/`, THE Website SHALL display a placeholder message indicating that articles are coming soon.
4. THE Website SHALL display each blog card with: title, excerpt (first 160 characters of content), publication date, and a link to `/blog/[slug]`.
5. THE Website SHALL use ShadCN UI `Card` and `Badge` components for the blog listing cards.
6. THE Website SHALL include at least one internal link from the Blog listing page to the Home page using keyword-rich anchor text.
7. THE Website SHALL export a `generateMetadata` function for the Blog listing page returning: title "HABET Sports Betting Blog – Tips, Predictions & Guides", description "Read expert cricket betting tips, IPL predictions, and sports betting guides for Indian bettors on the HABET blog.", canonical URL, OpenGraph tags, and Twitter Card tags.

---

### Requirement 6: Dynamic Blog Post Page (`/blog/[slug]`)

**User Story:** As a user reading a blog article, I want a well-structured, SEO-optimized article page, so that I can find it on Google and get useful betting information.

#### Acceptance Criteria

1. THE Website SHALL render a single `<h1>` per blog post page using the blog post's title from its markdown frontmatter.
2. THE Website SHALL parse markdown files from `/content/blogs/[slug].md` and render the content as HTML using a markdown parser.
3. THE Website SHALL include the blog post's primary keyword within the first 100 words of the rendered article body.
4. THE Website SHALL render the blog post content with proper heading hierarchy (H1 for title, H2/H3 for sections).
5. THE Website SHALL include at least two internal links within each blog post body — one to the Home page and one to another related blog post — using keyword-rich anchor text.
6. THE Website SHALL display the blog post's publication date and a reading time estimate.
7. THE Website SHALL export a `generateMetadata` function per blog post returning: title from frontmatter, description from frontmatter excerpt, canonical URL, OpenGraph Article tags (including `publishedTime`, `modifiedTime`), and Twitter Card tags.
8. THE Website SHALL embed an Article JSON-LD structured data block on each blog post page.
9. WHEN a blog post includes a FAQ section in its markdown, THE Website SHALL embed a FAQPage JSON-LD structured data block on that page.
10. WHEN a user navigates to `/blog/[slug]` for a slug that does not exist, THE Website SHALL return a 404 response using Next.js `notFound()`.
11. THE Website SHALL use `generateStaticParams` to pre-render all known blog slugs at build time.

---

### Requirement 7: AI Blog Generation System

**User Story:** As the site owner, I want an API route that generates 3 new blog posts per day using the Gemini API, so that the site continuously publishes fresh, SEO-optimized content without manual effort.

#### Acceptance Criteria

1. THE Website SHALL expose a POST API route at `/api/generate-blogs` that triggers the generation of 3 new Blog_Post files.
2. WHEN the `/api/generate-blogs` route is called, THE Blog_System SHALL call the Gemini API using the `GEMINI_KEY` and `GEMINI_MODEL` environment variables.
3. THE Blog_System SHALL generate blog topics from a predefined pool of sports betting keywords including: cricket betting tips India, IPL match predictions, best sports betting app India 2026, HABET app kaise download kare, HABET live cricket betting, fantasy sports tips, kabaddi betting guide, football betting India, and sports betting strategies for beginners.
4. THE Blog_System SHALL generate each blog post with a minimum of 1500 words.
5. THE Blog_System SHALL structure each generated blog post with: an H1 title, at least 4 H2 section headings, at least 2 H3 sub-headings, a FAQ section with at least 3 question-answer pairs, and a conclusion section.
6. THE Blog_System SHALL write each generated blog post following EEAT principles: including specific data points, expert-sounding analysis, and actionable advice.
7. THE Blog_System SHALL save each generated blog post as a markdown file at `/content/blogs/[slug].md` with YAML frontmatter containing: `title`, `slug`, `date`, `excerpt`, `keywords`, `author`, and `readingTime`.
8. IF a blog post with the same slug already exists, THEN THE Blog_System SHALL generate a new unique slug by appending a timestamp suffix.
9. THE Blog_System SHALL include at least one internal link to the Home page (`/`) within each generated blog post body.
10. WHEN the `/api/generate-blogs` route completes successfully, THE Website SHALL return a JSON response containing the list of generated blog slugs and a success status.
11. IF the Gemini API call fails, THEN THE Blog_System SHALL return a 500 error response with a descriptive error message and SHALL NOT write any partial files.
12. THE `/api/generate-blogs` route SHALL accept an optional `Authorization` header check using a `CRON_SECRET` environment variable to prevent unauthorized triggering.

---

### Requirement 8: SEO Infrastructure

**User Story:** As the site owner, I want comprehensive SEO infrastructure so that Google can discover, crawl, and rank all pages effectively.

#### Acceptance Criteria

1. THE Website SHALL generate a dynamic `sitemap.xml` at `/sitemap.xml` that includes all static pages (`/`, `/about`, `/disclaimer`, `/blog`) and all Blog_Post slugs with their `lastModified` dates.
2. THE Website SHALL serve a `robots.txt` at `/robots.txt` that allows all crawlers and references the sitemap URL.
3. THE Website SHALL set a canonical URL `<link rel="canonical">` tag on every page via the Metadata_API.
4. THE Website SHALL include OpenGraph tags (`og:title`, `og:description`, `og:url`, `og:type`, `og:image`) on every page via the Metadata_API.
5. THE Website SHALL include Twitter Card tags (`twitter:card`, `twitter:title`, `twitter:description`) on every page via the Metadata_API.
6. THE Website SHALL embed a WebSite JSON-LD block on the home page with `name`, `url`, and `potentialAction` (SearchAction) properties.
7. THE Website SHALL embed an Article JSON-LD block on each blog post page with `headline`, `datePublished`, `dateModified`, `author`, `publisher`, and `description` properties.
8. WHEN a blog post contains a FAQ section, THE Website SHALL embed a FAQPage JSON-LD block with `mainEntity` containing each question-answer pair.
9. THE Website SHALL ensure every page has exactly one `<h1>` element.
10. THE Website SHALL ensure all images have non-empty, descriptive `alt` attributes.

---

### Requirement 9: Performance & Technical Quality

**User Story:** As a site visitor on a mobile device in India, I want the site to load quickly, so that I don't abandon it before seeing the download button.

#### Acceptance Criteria

1. THE Website SHALL use `next/image` for all images with lazy loading enabled by default (except the Hero logo which SHALL use `priority={true}`).
2. THE Website SHALL minimize client-side JavaScript by using React Server Components for all pages that do not require interactivity.
3. THE Website SHALL mark only components requiring browser APIs or event handlers as `"use client"` components.
4. THE Website SHALL not import any CSS framework other than Tailwind CSS v4 and ShadCN UI styles.
5. THE Website SHALL pass `next build` without TypeScript errors or ESLint errors.
6. THE Website SHALL store the Gemini API key exclusively in the `GEMINI_KEY` environment variable and SHALL NOT expose it to the client bundle.

---

### Requirement 10: Content Directory Structure

**User Story:** As a developer maintaining the site, I want a predictable content directory structure, so that I can manage blog posts and understand where generated files are stored.

#### Acceptance Criteria

1. THE Website SHALL store all blog post markdown files in the `/content/blogs/` directory.
2. THE Website SHALL use YAML frontmatter at the top of each markdown file with the fields: `title` (string), `slug` (string), `date` (ISO 8601 date string), `excerpt` (string, max 160 characters), `keywords` (array of strings), `author` (string), and `readingTime` (string, e.g., "8 min read").
3. THE Website SHALL include at least 3 seed blog posts in `/content/blogs/` at initial setup so the blog listing page is not empty on first deployment.
4. WHEN the Blog_System reads markdown files, THE Website SHALL parse the YAML frontmatter separately from the markdown body content.
