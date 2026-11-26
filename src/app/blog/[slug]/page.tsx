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
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="wrap pt-[clamp(48px,8vw,96px)] pb-[clamp(80px,10vw,140px)]">
      <div className="mx-auto max-w-[720px]">
        <Link href="/blog" className="text-[14px] text-mute underline-offset-4 hover:text-ink hover:underline">All writing</Link>
        <header className="flex flex-col gap-6 pt-10 pb-10">
          <h1 className="serif m-0 text-[clamp(40px,5.4vw,64px)] leading-[1.05]">{post.title}</h1>
          {post.description && <p className="m-0 text-[20px] leading-[1.55] text-ink-3">{post.description}</p>}
          <p className="m-0 flex flex-wrap gap-x-4 gap-y-1 border-t border-ink pt-4 text-[14px] text-mute">
            {post.date && <span>{formatDate(post.date)}</span>}
            {post.author && <span>{post.author}</span>}
            {post.tags.length > 0 && <span>{post.tags.join(", ")}</span>}
          </p>
        </header>
        <MarkdownRenderer content={post.content} />
        <div className="mt-16 border-t border-rule pt-8">
          <Link href="/blog" className="btn btn-line">Back to all writing</Link>
        </div>
      </div>
    </article>
  );
}
