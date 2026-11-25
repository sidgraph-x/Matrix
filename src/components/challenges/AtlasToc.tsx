"use client";

export default function AtlasToc({ items }: { items: { id: string; title: string }[] }) {
  const go = (id: string) => {
    const t = document.getElementById(id);
    if (t) t.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  };
  return (
    <nav className="toc" aria-label="On this page">
      <h2>On this page</h2>
      {items.map((x) => (
        <button key={x.id} type="button" onClick={() => go(`s-${x.id}`)}>{x.title}</button>
      ))}
    </nav>
  );
}
