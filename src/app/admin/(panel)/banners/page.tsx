import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { banners } from "@/db/schema";
import { Card, PageHeader, Pill } from "@/components/admin/ui";
import { BannerEditor } from "./banner-editor";

export const metadata: Metadata = { title: "Banners" };

export default async function BannersPage() {
  const rows = await db.query.banners.findMany({ orderBy: [asc(banners.sortOrder), asc(banners.id)] });
  return (
    <>
      <PageHeader title="Banners da home" description="O carrossel do topo da página inicial. Use imagem própria ou só texto com cores da marca." />
      <div className="space-y-4">
        {rows.map((b) => (
          <Card
            key={b.id}
            title={
              <span className="flex items-center gap-2">
                {b.title || "Banner com imagem"} <Pill tone={b.isActive ? "green" : "gray"}>{b.isActive ? "ativo" : "inativo"}</Pill>
              </span>
            }
          >
            <details>
              <summary className="cursor-pointer text-sm text-neutral-600">Editar</summary>
              <div className="mt-4">
                <BannerEditor
                  initial={{
                    id: b.id,
                    eyebrow: b.eyebrow,
                    title: b.title,
                    subtitle: b.subtitle,
                    ctaLabel: b.ctaLabel,
                    href: b.href,
                    imageDesktop: b.imageDesktop,
                    imageMobile: b.imageMobile,
                    bgColor: b.bgColor,
                    textColor: b.textColor,
                    isActive: b.isActive,
                    sortOrder: b.sortOrder,
                  }}
                />
              </div>
            </details>
          </Card>
        ))}
        <Card title="Novo banner">
          <BannerEditor
            initial={{
              eyebrow: "",
              title: "",
              subtitle: "",
              ctaLabel: "",
              href: "/produtos",
              imageDesktop: null,
              imageMobile: null,
              bgColor: "#C4252F",
              textColor: "#FFFFFF",
              isActive: true,
              sortOrder: rows.length,
            }}
          />
        </Card>
      </div>
    </>
  );
}
