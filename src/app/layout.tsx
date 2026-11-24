import "@fontsource-variable/inter";
import "@fontsource-variable/archivo/wdth.css";
import "./globals.css";
import type { CSSProperties } from "react";
import type { Metadata, Viewport } from "next";
import { getSettings } from "@/lib/settings";

function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: s.seo.title, template: `%s | ${s.brand.name}` },
    description: s.seo.description,
    icons: { icon: s.brand.faviconUrl },
    openGraph: {
      siteName: s.brand.name,
      title: s.seo.title,
      description: s.seo.description,
      locale: "pt_BR",
      type: "website",
      images: s.seo.ogImageUrl ? [s.seo.ogImageUrl] : [s.brand.emblemUrl],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { theme } = await getSettings();
  const style = {
    "--brand-primary": theme.primary,
    "--brand-secondary": theme.secondary,
    "--brand-accent": theme.accent,
    "--brand-bg": theme.background,
    "--brand-surface": theme.surface,
    "--brand-text": theme.text,
    "--brand-button": theme.button,
    "--brand-button-text": theme.buttonText,
  } as CSSProperties;

  return (
    <html lang="pt-BR" style={style}>
      <body className="min-h-dvh font-sans antialiased">{children}</body>
    </html>
  );
}
