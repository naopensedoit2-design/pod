import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { getPricing } from "@/lib/pricing-server";
import { isPaymentTestMode } from "@/lib/infinitepay";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

export default async function CheckoutPage() {
  const settings = await getSettings();
  return <CheckoutForm pricing={getPricing(settings)} testMode={isPaymentTestMode(settings)} />;
}
