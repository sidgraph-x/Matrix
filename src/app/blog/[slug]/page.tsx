import { notFound } from "next/navigation";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import Link from "next/link";
import { Metadata } from "next";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} — Matrix`,
    description: post.description,
  };
}

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <div className="min-h-screen">
      {/* Back link */}
      <div className="max-w-[760px] mx-auto px-6 md:px-12 pt-24 pb-4">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 font-mono text-[12px] text-muted hover:text-accent transition-colors"
        >
          ← back to blog
        </Link>
      </div>

      {/* Post header */}
      <header className="max-w-[760px] mx-auto px-6 md:px-12 pb-10">
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono text-[10px] font-medium tracking-[0.1em] uppercase text-accent bg-accent-dim border border-accent/10 px-2.5 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <h1 className="font-display text-3xl md:text-5xl font-bold tracking-[-0.03em] leading-[1.1] mb-6">
          {post.title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-4 font-mono text-[12px] text-muted tracking-[0.05em]">
          {post.date && <span>{formatDate(post.date)}</span>}
          {post.author && (
            <>
              <span className="text-border-light">|</span>
              <span>{post.author}</span>
            </>
          )}
        </div>
      </header>

      {/* Divider */}
      <div className="max-w-[760px] mx-auto px-6 md:px-12">
        <div className="border-t border-border" />
      </div>

      {/* Content */}
      <article className="max-w-[760px] mx-auto px-6 md:px-12 py-10">
        <MarkdownRenderer content={post.content} />
      </article>

      {/* Footer nav */}
      <div className="max-w-[760px] mx-auto px-6 md:px-12 pb-20">
        <div className="border-t border-border pt-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 font-mono text-[13px] font-medium text-accent hover:text-foreground transition-colors"
          >
            ← all posts
          </Link>
        </div>
      </div>
    </div>
  );
}
