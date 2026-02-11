import { getAllPosts } from "@/lib/blog";
import BlogCard from "@/components/BlogCard";

export const metadata = {
  title: "Blog — Matrix",
  description: "Research, announcements, and technical deep-dives from Matrix.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="max-w-[1000px] mx-auto px-6 md:px-12 pt-28 pb-12">
        <div className="font-mono text-[11px] font-medium tracking-[0.15em] uppercase text-accent mb-4">
          // blog
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-[-0.03em] mb-4">
          Research &amp; Updates
        </h1>
        <p className="font-mono text-[15px] text-secondary max-w-[500px] leading-relaxed">
          Technical deep-dives, announcements, and insights from the Matrix team.
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Posts */}
      <div className="max-w-[1000px] mx-auto px-6 md:px-12 py-12">
        {posts.length === 0 ? (
          <div className="font-mono text-sm text-muted py-20 text-center">
            <span className="text-accent">$</span> ls ./blog
            <br />
            <span className="text-muted">no posts found.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-px bg-border">
            {posts.map((post) => (
              <BlogCard
                key={post.slug}
                slug={post.slug}
                title={post.title}
                date={post.date}
                author={post.author}
                description={post.description}
                tags={post.tags}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
