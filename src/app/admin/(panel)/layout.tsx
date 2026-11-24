import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { AdminNav } from "@/components/admin/nav";

// Depende da sessão (cookie): pode bloquear no servidor.
export const instant = false;

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const [admin, settings] = await Promise.all([requireAdmin(), getSettings()]);
  return (
    <div className="lg:flex">
      <AdminNav logoUrl={settings.brand.logoUrl} storeName={settings.brand.name} adminEmail={admin.email} />
      <main className="min-w-0 flex-1 px-4 py-6 lg:px-8 lg:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
