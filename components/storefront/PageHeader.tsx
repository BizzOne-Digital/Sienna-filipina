export function PageHeader({ eyebrow, heading, intro, children }: { eyebrow?: string; heading: string; intro?: string; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-cream/70 to-ivory">
      <div className="container-site py-14 text-center sm:py-20">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mx-auto mt-3 max-w-3xl text-[2.6rem] text-espresso sm:text-6xl">{heading}</h1>
        {intro && <p className="mx-auto mt-5 max-w-xl text-[1.02rem] leading-relaxed text-cocoa">{intro}</p>}
        {children}
      </div>
    </section>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-lg border border-dashed border-line bg-[#fffdfa] px-6 py-14 text-center">
      <h2 className="text-3xl">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-cocoa">{text}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/** Renders admin-written article text: blank lines split paragraphs, "## " / "### " headings, "- " bullets. */
export function RichText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="prose-sf">
      {blocks.map((b, i) => {
        if (b.startsWith("### ")) return <h3 key={i}>{b.slice(4)}</h3>;
        if (b.startsWith("## ")) return <h2 key={i}>{b.slice(3)}</h2>;
        const lines = b.split("\n");
        if (lines.every((l) => l.trim().startsWith("- "))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{l.trim().slice(2)}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{lines.join(" ")}</p>;
      })}
    </div>
  );
}
