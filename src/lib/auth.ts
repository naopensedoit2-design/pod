import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { count, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";

export const SESSION_COOKIE = "loja_admin";
const MAX_AGE = 60 * 60 * 24 * 7;

function secretKey() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error("Defina AUTH_SECRET (mínimo 16 caracteres) nas variáveis de ambiente.");
  return new TextEncoder().encode(s);
}

export type AdminSession = { id: number; email: string; name: string };

export async function createSession(admin: AdminSession) {
  const token = await new SignJWT({ email: admin.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(admin.id))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function getAdmin(): Promise<AdminSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const id = Number(payload.sub);
    if (!Number.isFinite(id)) return null;
    const admin = await db.query.adminUsers.findFirst({
      where: eq(adminUsers.id, id),
      columns: { id: true, email: true, name: true },
    });
    return admin ?? null;
  } catch {
    return null;
  }
}

/** Use no topo de páginas e em TODA server action do painel. */
export async function requireAdmin(): Promise<AdminSession> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 11);
}

/**
 * Login. Enquanto não existir nenhum administrador, o primeiro acesso com
 * ADMIN_EMAIL + ADMIN_PASSWORD (variáveis de ambiente) cria a conta.
 */
export async function verifyLogin(emailRaw: string, password: string): Promise<AdminSession | null> {
  const email = emailRaw.trim().toLowerCase();
  const user = await db.query.adminUsers.findFirst({ where: eq(sql`lower(${adminUsers.email})`, email) });
  if (user) {
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return null;
    await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id));
    return { id: user.id, email: user.email, name: user.name };
  }

  const [{ total }] = await db.select({ total: count() }).from(adminUsers);
  const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const envPassword = process.env.ADMIN_PASSWORD;
  if (total === 0 && envEmail && envPassword && email === envEmail && password === envPassword) {
    const [created] = await db
      .insert(adminUsers)
      .values({ email, name: "Administrador", passwordHash: await hashPassword(password), lastLoginAt: new Date() })
      .returning({ id: adminUsers.id, email: adminUsers.email, name: adminUsers.name });
    return created;
  }
  return null;
}
