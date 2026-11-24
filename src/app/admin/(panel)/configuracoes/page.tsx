import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { isEmailConfigured } from "@/lib/email";
import { getSettingsFresh } from "@/lib/settings";
import { getBaseUrl } from "@/lib/site-url";
import { isYouDrawConfigured } from "@/lib/youdraw";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const [settings, baseUrl] = await Promise.all([getSettingsFresh(), getBaseUrl()]);
  return (
    <>
      <PageHeader title="Configurações" description="Marca, aparência, regras de venda e integrações. Mude a loja inteira daqui para testar uma ideia nova." />
      <SettingsForm
        initial={settings}
        env={{
          infinitepayApiKey: Boolean(process.env.INFINITEPAY_API_KEY),
          infinitepayHandleEnv: process.env.INFINITEPAY_HANDLE ?? "",
          youdraw: isYouDrawConfigured(),
          youdrawWebhook: Boolean(process.env.YOUDRAW_WEBHOOK_SECRET),
          email: isEmailConfigured(),
          cron: Boolean(process.env.CRON_SECRET),
          testMode: process.env.PAYMENTS_TEST_MODE === "true",
        }}
        baseUrl={baseUrl}
      />
    </>
  );
}
