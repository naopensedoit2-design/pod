import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPage, getPageSlugs } from "@/lib/catalog";

export async function generateStaticParams() {
  const slugs = await getPageSlugs();
  return slugs.length ? slugs.map((slug) => ({ slug })) : [{ slug: "sobre" }];
}

export async function generateMetadata({ params }: PageProps<"/p/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  return { title: page?.title ?? "Página" };
}

function Body({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="space-y-5 text-[15px] leading-relaxed text-neutral-700">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const isHeading = lines.length > 1 && lines[0].length < 60 && !/[.:;!?]$/.test(lines[0]);
        return (
          <div key={i}>
            {isHeading && <h2 className="font-wide mb-1 text-sm font-bold tracking-[0.12em] text-black uppercase">{lines[0]}</h2>}
            <p className="whitespace-pre-line">{isHeading ? lines.slice(1).join("\n") : block}</p>
          </div>
        );
      })}
    </div>
  );
}

async function PageContent({ params }: { params: PageProps<"/p/[slug]">["params"] }) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();
  return (
    <article className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="font-wide mb-8 text-2xl font-extrabold tracking-[0.1em] uppercase">{page.title}</h1>
      <Body text={page.body} />
    </article>
  );
}

export default function StaticPage(props: PageProps<"/p/[slug]">) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-14" />}>
      <PageContent params={props.params} />
    </Suspense>
  );
}
