import Link from "next/link";

interface BlogCardProps {
  slug: string;
  title: string;
  date: string;
  author: string;
  description: string;
  tags: string[];
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BlogCard({
  slug,
  title,
  date,
  author,
  description,
  tags,
}: BlogCardProps) {
  return (
    <Link href={`/blog/${slug}`} className="group block">
      <article className="relative bg-surface border border-border p-8 transition-all duration-300 hover:bg-elevated hover:border-border-light">
        {/* Green left accent on hover */}
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[10px] font-medium tracking-[0.1em] uppercase text-accent bg-accent-dim border border-accent/10 px-2.5 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h2 className="font-display text-xl md:text-2xl font-bold leading-tight tracking-[-0.02em] mb-3 group-hover:text-accent transition-colors">
          {title}
        </h2>

        {/* Description */}
        <p className="text-sm text-secondary leading-relaxed mb-6 line-clamp-3">
          {description}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-4 font-mono text-[11px] text-muted tracking-[0.05em]">
          {date && <span>{formatDate(date)}</span>}
          {author && (
            <>
              <span className="text-border-light">|</span>
              <span>{author}</span>
            </>
          )}
          <span className="ml-auto text-accent/50 group-hover:text-accent transition-colors">
            read →
          </span>
        </div>
      </article>
    </Link>
  );
}
