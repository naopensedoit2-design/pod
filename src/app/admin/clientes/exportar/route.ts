import { desc, sql } from "drizzle-orm";
import { db } from "@/db";
import { subscribers } from "@/db/schema";
import { getAdmin } from "@/lib/auth";

const csv = (rows: (string | number | null)[][]) =>
  "﻿" + rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")).join("\n");

export async function GET(req: Request) {
  if (!(await getAdmin())) return new Response("Não autorizado", { status: 401 });
  const tipo = new URL(req.url).searchParams.get("tipo");
  let body: string;
  if (tipo === "leads") {
    const rows = await db.query.subscribers.findMany({ orderBy: [desc(subscribers.createdAt)] });
    body = csv([["email", "origem", "data"], ...rows.map((r) => [r.email, r.source, r.createdAt.toISOString()])]);
  } else {
    const rows = await db.execute<{ email: string; name: string; phone: string; city: string; state: string; orders: number; spent: number }>(sql`
      select lower(email) as email, max(name) as name, max(phone) as phone, max(city) as city, max(state) as state,
        count(*) filter (where payment_status = 'paid')::int as orders,
        coalesce(sum(coalesce(paid_amount_cents, total_cents)) filter (where payment_status = 'paid'), 0)::int as spent
      from orders group by lower(email) order by spent desc`);
    body = csv([
      ["email", "nome", "telefone", "cidade", "uf", "pedidos_pagos", "total_gasto"],
      ...[...rows].map((r) => [r.email, r.name, r.phone, r.city, r.state, r.orders, (r.spent / 100).toFixed(2).replace(".", ",")]),
    ]);
  }
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${tipo === "leads" ? "leads" : "clientes"}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
