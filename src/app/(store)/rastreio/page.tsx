import type { Metadata } from "next";
import { TrackForm } from "./track-form";

export const metadata: Metadata = { title: "Rastreie seu pedido" };

export default function TrackingPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-14">
      <h1 className="font-wide text-2xl font-extrabold tracking-[0.1em] uppercase">Rastreie seu pedido</h1>
      <p className="mt-2 text-sm text-neutral-600">Digite o número do pedido (está no e-mail de confirmação) e o e-mail usado na compra.</p>
      <TrackForm />
    </div>
  );
}
