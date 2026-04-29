interface BlogPostContentProps {
  html: string;
}

export default function BlogPostContent({ html }: BlogPostContentProps) {
  return (
    <>
      {/* Scoped styles for blog content */}
      <style>{`
        /* ── Internal links ─────────────────────────────────────────────── */
        .blog-content a.internal-link {
          display: inline-flex;
          align-items: center;
          gap: 0.2em;
          color: hsl(var(--primary, 221 83% 53%));
          font-weight: 500;
          text-decoration: none;
          border-bottom: 1.5px solid currentColor;
          padding-bottom: 1px;
          transition: opacity 0.15s;
        }
        .blog-content a.internal-link::before {
          content: "→ ";
          font-size: 0.85em;
          opacity: 0.7;
        }
        .blog-content a.internal-link:hover {
          opacity: 0.75;
        }

        /* ── External links ─────────────────────────────────────────────── */
        .blog-content a.external-link {
          color: hsl(var(--primary, 221 83% 53%));
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .blog-content a.external-link:hover {
          opacity: 0.8;
        }

        /* ── Headings ───────────────────────────────────────────────────── */
        .blog-content h1 {
          font-size: 1.875rem;
          font-weight: 700;
          line-height: 1.25;
          margin-top: 0;
          margin-bottom: 1.25rem;
          color: inherit;
        }
        .blog-content h2 {
          font-size: 1.5rem;
          font-weight: 700;
          line-height: 1.3;
          margin-top: 2.5rem;
          margin-bottom: 0.875rem;
          padding-bottom: 0.4rem;
          border-bottom: 2px solid oklch(1 0 0 / 10%);
          color: inherit;
        }
        .blog-content h3 {
          font-size: 1.2rem;
          font-weight: 600;
          line-height: 1.4;
          margin-top: 1.75rem;
          margin-bottom: 0.6rem;
          color: inherit;
        }
        .blog-content h4 {
          font-size: 1.05rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          color: inherit;
        }

        /* ── Paragraphs ─────────────────────────────────────────────────── */
        .blog-content p {
          margin-bottom: 1.1rem;
          line-height: 1.75;
          color: inherit;
        }

        /* ── Lists ──────────────────────────────────────────────────────── */
        .blog-content ul {
          list-style: disc;
          padding-left: 1.5rem;
          margin-bottom: 1.1rem;
        }
        .blog-content ol {
          list-style: decimal;
          padding-left: 1.5rem;
          margin-bottom: 1.1rem;
        }
        .blog-content li {
          margin-bottom: 0.35rem;
          line-height: 1.7;
        }
        .blog-content li > p {
          margin-bottom: 0.35rem;
        }

        /* ── Strong / em ────────────────────────────────────────────────── */
        .blog-content strong {
          font-weight: 700;
          color: inherit;
        }
        .blog-content em {
          font-style: italic;
        }

        /* ── Blockquote ─────────────────────────────────────────────────── */
        .blog-content blockquote {
          border-left: 4px solid oklch(0.488 0.243 264.376 / 50%);
          padding: 0.75rem 1.25rem;
          margin: 1.5rem 0;
          background: oklch(1 0 0 / 4%);
          border-radius: 0 0.375rem 0.375rem 0;
          font-style: italic;
          color: oklch(0.708 0 0);
        }

        /* ── Code ───────────────────────────────────────────────────────── */
        .blog-content code {
          font-family: var(--font-mono, monospace);
          font-size: 0.875em;
          background: oklch(1 0 0 / 8%);
          padding: 0.15em 0.4em;
          border-radius: 0.25rem;
        }
        .blog-content pre {
          background: oklch(0.145 0 0);
          border: 1px solid oklch(1 0 0 / 10%);
          border-radius: 0.5rem;
          padding: 1rem 1.25rem;
          overflow-x: auto;
          margin-bottom: 1.25rem;
        }
        .blog-content pre code {
          background: none;
          padding: 0;
          font-size: 0.875rem;
        }

        /* ── Tables ─────────────────────────────────────────────────────── */
        .blog-content table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1.25rem;
          font-size: 0.9rem;
        }
        .blog-content th {
          background: oklch(1 0 0 / 6%);
          font-weight: 600;
          text-align: left;
          padding: 0.6rem 0.875rem;
          border: 1px solid oklch(1 0 0 / 12%);
        }
        .blog-content td {
          padding: 0.55rem 0.875rem;
          border: 1px solid oklch(1 0 0 / 10%);
          vertical-align: top;
        }
        .blog-content tr:nth-child(even) td {
          background: oklch(1 0 0 / 3%);
        }

        /* ── Horizontal rule ────────────────────────────────────────────── */
        .blog-content hr {
          border: none;
          border-top: 1px solid oklch(1 0 0 / 10%);
          margin: 2rem 0;
        }

        /* ── Heading anchor links (from rehype-slug) ────────────────────── */
        .blog-content h2 a,
        .blog-content h3 a,
        .blog-content h4 a {
          color: inherit;
          text-decoration: none;
          border-bottom: none;
        }
        .blog-content h2 a::before,
        .blog-content h3 a::before,
        .blog-content h4 a::before {
          content: none;
        }
      `}</style>

      <article
        className="blog-content text-base leading-relaxed"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
