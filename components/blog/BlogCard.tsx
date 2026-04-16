import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BlogCardProps {
  title: string;
  excerpt: string;
  date: string;
  slug: string;
}

export default function BlogCard({ title, excerpt, date, slug }: BlogCardProps) {
  const formattedDate = new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link href={`/blog/${slug}`} className="block hover:no-underline group">
      <Card className="h-full transition-shadow group-hover:shadow-md">
        <CardHeader>
          <div className="mb-2">
            <Badge variant="secondary">{formattedDate}</Badge>
          </div>
          <CardTitle className="text-lg leading-snug group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3">{excerpt}</p>
          <span className="mt-3 inline-block text-sm font-medium text-primary">
            Read more →
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
