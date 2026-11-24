import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage() {
  const settings = await getSettings();
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={settings.brand.logoUrl} alt={settings.brand.name} className="mx-auto mb-8 h-14 w-auto" />
        <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold">Painel da loja</h1>
          <p className="mt-1 text-sm text-neutral-500">Entre com seu e-mail e senha de administrador.</p>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
