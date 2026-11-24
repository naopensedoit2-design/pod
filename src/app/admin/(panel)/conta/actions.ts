"use server";

import bcrypt from "bcryptjs";
import { refresh } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { hashPassword, requireAdmin } from "@/lib/auth";

type Result = { ok: boolean; message: string } | null;

export async function changePasswordAction(_prev: Result, fd: FormData): Promise<Result> {
  const admin = await requireAdmin();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (next.length < 8) return { ok: false, message: "A nova senha precisa ter pelo menos 8 caracteres." };
  const user = await db.query.adminUsers.findFirst({ where: eq(adminUsers.id, admin.id) });
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) return { ok: false, message: "Senha atual incorreta." };
  await db.update(adminUsers).set({ passwordHash: await hashPassword(next) }).where(eq(adminUsers.id, admin.id));
  return { ok: true, message: "Senha alterada." };
}

export async function addAdminAction(_prev: Result, fd: FormData): Promise<Result> {
  await requireAdmin();
  const parsed = z
    .object({ email: z.string().trim().toLowerCase().email(), name: z.string().trim().default(""), password: z.string().min(8) })
    .safeParse({ email: fd.get("email"), name: fd.get("name") ?? "", password: fd.get("password") });
  if (!parsed.success) return { ok: false, message: "Informe e-mail válido e senha com 8+ caracteres." };
  const exists = await db.query.adminUsers.findFirst({ where: eq(sql`lower(${adminUsers.email})`, parsed.data.email) });
  if (exists) return { ok: false, message: "Já existe um administrador com esse e-mail." };
  await db.insert(adminUsers).values({ email: parsed.data.email, name: parsed.data.name, passwordHash: await hashPassword(parsed.data.password) });
  refresh();
  return { ok: true, message: "Administrador criado." };
}

export async function removeAdminAction(id: number) {
  const admin = await requireAdmin();
  if (id === admin.id) return { ok: false, message: "Você não pode remover a si mesmo." };
  await db.delete(adminUsers).where(eq(adminUsers.id, id));
  refresh();
  return { ok: true, message: "Removido." };
}
