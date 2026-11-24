"use client";

import Script from "next/script";
import { useEffect } from "react";

type Win = Window & {
  fbq?: (...args: unknown[]) => void;
  gtag?: (...args: unknown[]) => void;
  ttq?: { track: (event: string, data?: unknown) => void; page: () => void };
};

/** Dispara eventos de conversão nos pixels configurados (Meta, GA4, TikTok). */
export function track(
  event: "AddToCart" | "InitiateCheckout" | "Purchase" | "ViewContent" | "Lead",
  data: { value?: number; currency?: string; contentIds?: (string | number)[]; contentName?: string } = {},
) {
  if (typeof window === "undefined") return;
  const w = window as Win;
  const value = data.value != null ? Number((data.value / 100).toFixed(2)) : undefined;
  const payload = { value, currency: "BRL", content_ids: data.contentIds?.map(String), content_name: data.contentName, content_type: "product" };
  try {
    w.fbq?.("track", event, payload);
    const ga: Record<string, string> = {
      AddToCart: "add_to_cart",
      InitiateCheckout: "begin_checkout",
      Purchase: "purchase",
      ViewContent: "view_item",
      Lead: "generate_lead",
    };
    w.gtag?.("event", ga[event], { value, currency: "BRL" });
    const tt: Record<string, string> = {
      AddToCart: "AddToCart",
      InitiateCheckout: "InitiateCheckout",
      Purchase: "CompletePayment",
      ViewContent: "ViewContent",
      Lead: "SubmitForm",
    };
    w.ttq?.track(tt[event], payload);
  } catch {
    // pixel bloqueado pelo navegador: ignore
  }
}

/** Guarda a origem da visita (utm_*) para atribuir a venda no pedido. */
export function readUtm(): Record<string, string> | undefined {
  try {
    const raw = localStorage.getItem("loja-utm");
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { at: number; data: Record<string, string> };
    if (Date.now() - parsed.at > 30 * 24 * 3600_000) return undefined;
    return parsed.data;
  } catch {
    return undefined;
  }
}

function UtmCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const data: Record<string, string> = {};
      for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid", "ttclid"]) {
        const v = params.get(key);
        if (v) data[key] = v.slice(0, 200);
      }
      if (Object.keys(data).length) localStorage.setItem("loja-utm", JSON.stringify({ at: Date.now(), data }));
    } catch {
      // armazenamento indisponível
    }
  }, []);
  return null;
}

export function TrackingScripts({ metaPixelId, ga4Id, tiktokPixelId }: { metaPixelId: string; ga4Id: string; tiktokPixelId: string }) {
  const meta = metaPixelId.replace(/\D/g, "");
  const ga = ga4Id.replace(/[^A-Z0-9-]/gi, "");
  const tt = tiktokPixelId.replace(/[^A-Z0-9]/gi, "");
  return (
    <>
      <UtmCapture />
      {meta && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${meta}');fbq('track','PageView');`}
        </Script>
      )}
      {ga && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('js',new Date());gtag('config','${ga}');`}
          </Script>
        </>
      )}
      {tt && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${tt}');ttq.page();}(window,document,'ttq');`}
        </Script>
      )}
    </>
  );
}
