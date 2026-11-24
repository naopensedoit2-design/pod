import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/format";

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border border-neutral-200 bg-white", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-3.5">
          {title && <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>}
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

const buttonStyles = {
  primary: "bg-neutral-900 text-white hover:bg-neutral-700",
  secondary: "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
  brand: "bg-brand text-white hover:opacity-90",
};

export function buttonClass(variant: keyof typeof buttonStyles = "primary", size: "sm" | "md" = "md") {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
    size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
    buttonStyles[variant],
  );
}

export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  external,
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof buttonStyles;
  size?: "sm" | "md";
  external?: boolean;
}) {
  if (external)
    return (
      <a href={href} target="_blank" rel="noreferrer" className={buttonClass(variant, size)}>
        {children}
      </a>
    );
  return (
    <Link href={href} className={buttonClass(variant, size)}>
      {children}
    </Link>
  );
}

const pill: Record<string, string> = {
  gray: "bg-neutral-100 text-neutral-700",
  green: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  yellow: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-1 ring-red-200",
  blue: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  purple: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
};

export function Pill({ tone = "gray", children }: { tone?: keyof typeof pill; children: ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", pill[tone])}>{children}</span>;
}

export const STATUS_TONE: Record<string, keyof typeof pill> = {
  pending_payment: "yellow",
  paid: "green",
  in_production: "blue",
  shipped: "purple",
  delivered: "gray",
  canceled: "red",
  refunded: "red",
};

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1 block text-xs font-medium text-neutral-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-neutral-500">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900";

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-neutral-300 bg-white px-6 py-14 text-center">
      <p className="font-medium text-neutral-900">{title}</p>
      {children && <div className="mt-2 text-sm text-neutral-500">{children}</div>}
    </div>
  );
}

export function Notice({ tone = "yellow", children }: { tone?: "yellow" | "red" | "green" | "blue"; children: ReactNode }) {
  const tones = {
    yellow: "border-amber-200 bg-amber-50 text-amber-900",
    red: "border-red-200 bg-red-50 text-red-800",
    green: "border-emerald-200 bg-emerald-50 text-emerald-900",
    blue: "border-sky-200 bg-sky-50 text-sky-900",
  };
  return <div className={cn("rounded-md border px-4 py-3 text-sm", tones[tone])}>{children}</div>;
}
