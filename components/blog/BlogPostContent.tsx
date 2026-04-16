interface BlogPostContentProps {
  html: string;
}

export default function BlogPostContent({ html }: BlogPostContentProps) {
  return (
    <article
      className="prose prose-slate max-w-none text-base leading-relaxed
        prose-headings:font-semibold prose-headings:text-foreground
        prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
        prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
        prose-p:mb-4 prose-p:text-foreground/90
        prose-a:text-primary prose-a:underline hover:prose-a:text-primary/80
        prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4
        prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4
        prose-li:mb-1
        prose-strong:font-semibold prose-strong:text-foreground
        prose-blockquote:border-l-4 prose-blockquote:border-primary/40
        prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
