import type { Metadata } from "next";

export const metadata: Metadata = { title: { default: "Painel", template: "%s · Painel" }, robots: { index: false, follow: false } };

// O painel depende da sessão (cookie) em toda página: pode bloquear no servidor.
export const instant = false;

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return <div className="min-h-dvh bg-neutral-50 text-neutral-900">{children}</div>;
}
