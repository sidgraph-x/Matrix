import Link from "next/link";
import { getAllPosts } from "@/lib/blog";

export const metadata = {
  title: "Blog — Matrix",
  description: "Research notes, theses and announcements from Matrix.",
};

function fmt(d: string) {
  return d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
}

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="wrap pt-[clamp(56px,9vw,112px)] pb-[clamp(80px,10vw,140px)]">
      <header className="flex flex-col gap-5 pb-14">
        <h1 className="serif m-0 text-[clamp(44px,6vw,80px)] leading-[1.02]">Writing</h1>
        <p className="m-0 max-w-[560px] text-[19px] leading-[1.6] text-ink-3">
          Research notes, theses and announcements on energy, compute and personal intelligence.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="border-t border-ink py-16 text-[17px] text-ink-3">Nothing published yet. The first notes are on their way.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col p-0">
          {posts.map((p) => (
            <li key={p.slug} className="border-b border-rule first:border-t first:border-ink">
              <Link href={`/blog/${p.slug}`} className="group grid gap-x-10 gap-y-3 py-9 text-ink no-underline md:grid-cols-[200px_minmax(0,1fr)]">
                <span className="flex flex-col gap-1 pt-2 text-[14px] text-mute">
                  <span>{fmt(p.date)}</span>
                  {p.author && <span>{p.author}</span>}
                </span>
                <span className="flex flex-col gap-3">
                  <span className="serif text-[clamp(28px,3vw,38px)] leading-[1.12] group-hover:text-ember-deep">{p.title}</span>
                  <span className="max-w-[68ch] text-[16px] leading-[1.6] text-ink-3">{p.description}</span>
                  {p.tags.length > 0 && <span className="text-[13px] text-mute">{p.tags.join(", ")}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
