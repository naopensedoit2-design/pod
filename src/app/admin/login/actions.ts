"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession, verifyLogin } from "@/lib/auth";

const attempts = new Map<string, { count: number; until: number }>();

export async function loginAction(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const key = email.toLowerCase();
  const now = Date.now();
  const a = attempts.get(key);
  if (a && a.until > now && a.count >= 5) return { error: "Muitas tentativas. Aguarde alguns minutos." };

  const admin = await verifyLogin(email, password);
  if (!admin) {
    const next = a && a.until > now ? { count: a.count + 1, until: a.until } : { count: 1, until: now + 10 * 60_000 };
    attempts.set(key, next);
    return { error: "E-mail ou senha incorretos." };
  }
  attempts.delete(key);
  await createSession(admin);
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}
