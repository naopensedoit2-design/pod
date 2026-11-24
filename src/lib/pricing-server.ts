import "server-only";
import type { PricingConfig } from "@/components/store/pricing";
import { effectivePixDiscount } from "./infinitepay";
import type { StoreSettings } from "./settings-schema";

export function getPricing(settings: StoreSettings): PricingConfig {
  return {
    pixDiscountPercent: effectivePixDiscount(settings),
    installmentsNoInterest: settings.sales.installmentsNoInterest,
    maxInstallments: settings.sales.maxInstallments,
    freeShippingThresholdCents: settings.sales.freeShippingThresholdCents,
  };
}
