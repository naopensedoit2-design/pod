"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingBag,
  Tags,
  Ticket,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { logoutAction } from "@/app/admin/login/actions";
import { cn } from "@/lib/format";

const ITEMS = [
  { href: "/admin", label: "Painel", icon: BarChart3, exact: true },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/admin/produtos", label: "Produtos", icon: Package },
  { href: "/admin/categorias", label: "Categorias", icon: Tags },
  { href: "/admin/cupons", label: "Cupons", icon: Ticket },
  { href: "/admin/banners", label: "Banners", icon: ImageIcon },
  { href: "/admin/paginas", label: "Páginas", icon: FileText },
  { href: "/admin/clientes", label: "Clientes e leads", icon: Users },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
  { href: "/admin/conta", label: "Minha conta", icon: UserCog },
];

export function AdminNav({ logoUrl, storeName, adminEmail }: { logoUrl: string; storeName: string; adminEmail: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-1 flex-col gap-0.5 px-3 py-4">
      {ITEMS.map((it) => {
        const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
        const Icon = it.icon;
        return (
          <Link
            key={it.href}
            href={it.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition",
              active ? "bg-neutral-900 font-medium text-white" : "text-neutral-700 hover:bg-neutral-100",
            )}
          >
            <Icon size={17} strokeWidth={1.8} />
            {it.label}
          </Link>
        );
      })}
      <div className="mt-auto space-y-0.5 border-t border-neutral-100 pt-3">
        <a href="/" target="_blank" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100">
          <ExternalLink size={17} strokeWidth={1.8} /> Ver loja
        </a>
        <form action={logoutAction}>
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100">
            <LogOut size={17} strokeWidth={1.8} /> Sair
          </button>
        </form>
        <p className="truncate px-3 pt-2 text-xs text-neutral-400">{adminEmail}</p>
      </div>
    </nav>
  );

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:hidden">
        <button type="button" onClick={() => setOpen(true)} aria-label="Abrir menu" className="p-1">
          <Menu size={22} />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt={storeName} className="h-8 w-auto" />
        <span className="w-6" />
      </header>

      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-neutral-200 bg-white lg:flex">
        <Link href="/admin" className="flex h-16 items-center gap-2 border-b border-neutral-100 px-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt={storeName} className="h-9 w-auto" />
          <span className="text-xs font-medium text-neutral-400">admin</span>
        </Link>
        {nav}
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
            <div className="flex h-14 items-center justify-between border-b px-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt={storeName} className="h-8 w-auto" />
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar menu">
                <X size={20} />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}
    </>
  );
}
