import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getAllSlugs, getPostBySlug } from "@/lib/blog";
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
    htmlContent.includes("## FAQ") ||
    htmlContent.includes("## Frequently Asked Questions") ||
    htmlContent.includes("<h2>FAQ</h2>") ||
    htmlContent.includes("<h2>Frequently Asked Questions</h2>")
  );
}

function extractFaqItems(
  htmlContent: string
): Array<{ question: string; answer: string }> {
  const items: Array<{ question: string; answer: string }> = [];

  // Match <strong>Q:</strong> ... <strong>A:</strong> patterns in rendered HTML
  const qaRegex =
    /<strong>Q:<\/strong>\s*([\s\S]*?)\s*<strong>A:<\/strong>\s*([\s\S]*?)(?=<strong>Q:<\/strong>|$)/g;
  let match;
  while ((match = qaRegex.exec(htmlContent)) !== null) {
    const question = match[1].replace(/<[^>]+>/g, "").trim();
    const answer = match[2].replace(/<[^>]+>/g, "").trim();
    if (question && answer) {
      items.push({ question, answer });
    }
  }

  // Fallback: extract from list items inside FAQ section
  if (items.length === 0) {
    const faqSectionRegex =
      /<h2[^>]*>(?:FAQ|Frequently Asked Questions)<\/h2>([\s\S]*?)(?=<h2|$)/i;
    const sectionMatch = faqSectionRegex.exec(htmlContent);
    if (sectionMatch) {
      const liRegex = /<li>([\s\S]*?)<\/li>/g;
      let liMatch;
      while ((liMatch = liRegex.exec(sectionMatch[1])) !== null) {
        const text = liMatch[1].replace(/<[^>]+>/g, "").trim();
        if (text) {
          items.push({ question: text, answer: "See full article for details." });
        }
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
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const { frontmatter, htmlContent = "" } = post;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: frontmatter.title,
    datePublished: frontmatter.date,
    dateModified: frontmatter.date,
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

      <header className="mb-8">
        <h1 className="text-3xl font-bold leading-tight mb-4">
          {frontmatter.title}
        </h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <time dateTime={frontmatter.date}>{formattedDate}</time>
          <span>·</span>
          <span>{frontmatter.readingTime}</span>
          <span>·</span>
          <span>By {frontmatter.author}</span>
        </div>
      </header>

      <BlogPostContent html={htmlContent} />

      {/* Internal Links Footer */}
      <footer className="mt-12 pt-8 border-t border-border">
        <div className="bg-muted/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Explore More</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <a href="/" className="text-primary hover:underline font-medium">
              Download HABET APK
            </a>
            <a href="/blog" className="text-primary hover:underline font-medium">
              All Betting Tips
            </a>
            <a href="/about" className="text-primary hover:underline font-medium">
              About HABET
            </a>
            <a href="/disclaimer" className="text-primary hover:underline font-medium">
              Disclaimer
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
