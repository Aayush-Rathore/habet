import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAllPosts } from "@/lib/blog";
import BlogCard from "@/components/blog/BlogCard";

const TITLE = "HABET Betting Blog – Tips, Predictions & Guides";
const DESCRIPTION =
  "Read expert cricket betting tips, IPL predictions, and sports betting guides for Indian bettors on the HABET blog.";
const CANONICAL = "https://habetapk.com/blog";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: CANONICAL,
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: CANONICAL,
    type: "website",
    images: [{ url: "https://habetapk.com/logo.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["https://habetapk.com/logo.jpg"],
  },
};

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <main className="container mx-auto px-4 py-10 max-w-5xl">
      {/* Logo */}
      <div className="flex justify-center mb-8">
        <Image
          src="/logo.jpg"
          alt="HABET APK Logo"
          width={120}
          height={120}
          className="rounded-xl"
        />
      </div>

      <h1 className="text-3xl font-bold mb-3">{TITLE}</h1>
      <p className="text-muted-foreground mb-6">
        Expert cricket betting tips, IPL predictions, and sports betting guides
        for Indian bettors. Visit our{" "}
        <Link href="/" className="text-primary underline font-medium">
          HABET APK homepage
        </Link>{" "}
        to download the app and start betting today, or learn{" "}
        <Link href="/about" className="text-primary underline font-medium">
          more about HABET APK
        </Link>
        .
      </p>

      {posts.length === 0 ? (
        <div className="rounded-lg border bg-muted/40 p-10 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            Articles coming soon — check back shortly for expert betting tips and
            predictions.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard
              key={post.frontmatter.slug}
              title={post.frontmatter.title}
              excerpt={post.frontmatter.excerpt}
              date={post.frontmatter.date}
              slug={post.frontmatter.slug}
            />
          ))}
        </div>
      )}
    </main>
  );
}
