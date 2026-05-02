import type { MetadataRoute } from "next"
import { getAllPosts } from "@/lib/blog"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts()
  const BASE_URL = "https://habetapk.com"
  const SITE_LASTMOD = new Date("2026-05-02T00:00:00.000Z")

  const staticRoutes = ["/", "/habet-apk", "/about", "/disclaimer", "/blog"].map(route => ({
    url: `${BASE_URL}${route}`,
    lastModified: SITE_LASTMOD,
    changeFrequency: "weekly" as const,
    priority: route === "/" ? 1.0 : route === "/habet-apk" ? 0.9 : 0.8,
  }))

  const blogRoutes = posts.map(post => ({
    url: `${BASE_URL}/blog/${post.frontmatter.slug}`,
    lastModified: new Date(post.frontmatter.date),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...blogRoutes]
}
