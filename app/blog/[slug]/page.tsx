import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getAllSlugs, getAllPosts, getPostBySlug } from "@/lib/blog";
import BlogPostContent from "@/components/blog/BlogPostContent";
import JsonLd from "@/components/shared/JsonLd";

const BASE_URL = "https://habetapk.com";

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const { frontmatter } = post;
  const canonical = `${BASE_URL}/blog/${frontmatter.slug}`;

  return {
    title: frontmatter.title,
    description: frontmatter.excerpt,
    alternates: { canonical },
    openGraph: {
      title: frontmatter.title,
      description: frontmatter.excerpt,
      url: canonical,
      type: "article",
      publishedTime: frontmatter.date,
      modifiedTime: frontmatter.date,
      images: [{ url: `${BASE_URL}/logo.jpg` }],
    },
    twitter: {
      card: "summary_large_image",
      title: frontmatter.title,
      description: frontmatter.excerpt,
      images: [`${BASE_URL}/logo.jpg`],
    },
  };
}

function hasFaqSection(htmlContent: string): boolean {
  return (
    /<h2[^>]*>\s*(?:FAQ|Frequently Asked Questions)\s*<\/h2>/i.test(
      htmlContent
    )
  );
}

function extractFaqItems(
  htmlContent: string
): Array<{ question: string; answer: string }> {
  const items: Array<{ question: string; answer: string }> = [];

  // Extract the FAQ section HTML
  const faqSectionRegex =
    /<h2[^>]*>\s*(?:FAQ|Frequently Asked Questions)\s*<\/h2>([\s\S]*?)(?=<h2|$)/i;
  const sectionMatch = faqSectionRegex.exec(htmlContent);
  if (!sectionMatch) return items;

  const sectionHtml = sectionMatch[1];

  // Match bold Q: ... bold A: ... patterns
  const qaRegex =
    /<strong>Q:\s*<\/strong>([\s\S]*?)<strong>A:\s*<\/strong>([\s\S]*?)(?=<strong>Q:|<\/p>\s*<p>\s*<strong>Q:|$)/gi;
  let match;
  while ((match = qaRegex.exec(sectionHtml)) !== null) {
    const question = match[1].replace(/<[^>]+>/g, "").trim();
    const answer = match[2].replace(/<[^>]+>/g, "").trim();
    if (question && answer) items.push({ question, answer });
  }

  // Fallback: paragraph-level Q/A detection
  if (items.length === 0) {
    const paraRegex = /<p>([\s\S]*?)<\/p>/g;
    let paraMatch;
    let pendingQ: string | null = null;
    while ((paraMatch = paraRegex.exec(sectionHtml)) !== null) {
      const text = paraMatch[1].replace(/<[^>]+>/g, "").trim();
      if (text.startsWith("Q:")) {
        pendingQ = text.replace(/^Q:\s*/, "");
      } else if (text.startsWith("A:") && pendingQ) {
        items.push({ question: pendingQ, answer: text.replace(/^A:\s*/, "") });
        pendingQ = null;
      }
    }
  }

  return items;
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [post, allPosts] = await Promise.all([
    getPostBySlug(slug),
    getAllPosts(),
  ]);

  if (!post) {
    notFound();
  }

  const { frontmatter, htmlContent = "" } = post;

  // Related posts: other posts (exclude current), up to 5
  const relatedPosts = allPosts
    .filter((p) => p.frontmatter.slug !== slug)
    .slice(0, 5);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: frontmatter.title,
    datePublished: frontmatter.date,
    dateModified: (frontmatter as unknown as Record<string, string>).lastUpdated ?? frontmatter.date,
    author: { "@type": "Organization", name: "HABET Sports Team" },
    publisher: {
      "@type": "Organization",
      name: "habetapk.com",
      url: BASE_URL,
    },
    description: frontmatter.excerpt,
  };

  const showFaq = hasFaqSection(htmlContent);
  const faqItems = showFaq ? extractFaqItems(htmlContent) : [];

  const faqSchema =
    showFaq && faqItems.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }
      : null;

  const formattedDate = new Date(frontmatter.date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="container mx-auto px-4 py-10 max-w-3xl">
      <JsonLd data={articleSchema} />
      {faqSchema && <JsonLd data={faqSchema} />}

      {/* Logo */}
      <div className="flex justify-center mb-8">
        <Image
          src="/logo.jpg"
          alt="HABET APK Logo"
          width={100}
          height={100}
          className="rounded-xl"
        />
      </div>

      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground mb-6 flex items-center gap-1.5">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-foreground transition-colors">
          Blog
        </Link>
        <span>/</span>
        <span className="text-foreground truncate max-w-[200px]">
          {frontmatter.title}
        </span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl font-bold leading-tight mb-4">
          {frontmatter.title}
        </h1>
        <p className="text-muted-foreground text-base mb-4 leading-relaxed">
          {frontmatter.excerpt}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground border-t border-border pt-4">
          <time dateTime={frontmatter.date}>{formattedDate}</time>
          <span aria-hidden>·</span>
          <span>{frontmatter.readingTime}</span>
          <span aria-hidden>·</span>
          <span>By {frontmatter.author}</span>
        </div>
      </header>

      {/* Main content */}
      <BlogPostContent html={htmlContent} />

      {/* Related Articles */}
      {relatedPosts.length > 0 && (
        <section className="mt-12 pt-8 border-t border-border">
          <h2 className="text-xl font-bold mb-5">Related Articles</h2>
          <ul className="space-y-3">
            {relatedPosts.map((p) => (
              <li key={p.frontmatter.slug}>
                <Link
                  href={`/blog/${p.frontmatter.slug}`}
                  className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 hover:border-primary/50 hover:bg-card/80 transition-colors"
                >
                  <span className="mt-0.5 text-primary text-lg leading-none">→</span>
                  <div>
                    <span className="font-medium text-sm group-hover:text-primary transition-colors leading-snug block">
                      {p.frontmatter.title}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5 block line-clamp-1">
                      {p.frontmatter.excerpt}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Site links footer */}
      <footer className="mt-10 pt-8 border-t border-border">
        <div className="bg-muted/30 rounded-lg p-5">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Quick Links
          </h3>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
            >
              ↓ Download HABET APK
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
            >
              📰 All Articles
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
            >
              ℹ About HABET
            </Link>
            <Link
              href="/disclaimer"
              className="inline-flex items-center gap-1 text-primary font-medium hover:underline"
            >
              ⚠ Disclaimer
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
