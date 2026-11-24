"use client";

import { useState, useTransition } from "react";
import { buttonClass } from "@/components/admin/ui";
import { importYouDrawProductAction } from "../actions";

export function ImportButton({ ydId }: { ydId: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <div>
      <button
        type="button"
        disabled={pending}
        className={buttonClass("primary", "sm")}
        onClick={() =>
          start(async () => {
            setError("");
            const res = await importYouDrawProductAction(ydId);
            if (res && !res.ok) setError(res.error);
          })
        }
      >
        {pending ? "Importando…" : "Importar"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
