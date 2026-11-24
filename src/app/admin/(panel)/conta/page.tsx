import type { Metadata } from "next";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { ActionButton } from "@/components/admin/action-button";
import { ActionForm } from "@/components/admin/form-state";
import { Card, Field, PageHeader, inputClass } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { addAdminAction, changePasswordAction, removeAdminAction } from "./actions";

export const metadata: Metadata = { title: "Minha conta" };

export default async function AccountPage() {
  const me = await requireAdmin();
  const admins = await db.query.adminUsers.findMany({ orderBy: [asc(adminUsers.id)], columns: { id: true, email: true, name: true, lastLoginAt: true } });
  return (
    <>
      <PageHeader title="Minha conta" description={me.email} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Trocar senha">
          <ActionForm action={changePasswordAction} submitLabel="Salvar nova senha" resetOnSuccess>
            <div className="space-y-3">
              <Field label="Senha atual">
                <input name="current" type="password" autoComplete="current-password" required className={inputClass} />
              </Field>
              <Field label="Nova senha (mín. 8 caracteres)">
                <input name="next" type="password" autoComplete="new-password" required minLength={8} className={inputClass} />
              </Field>
            </div>
          </ActionForm>
        </Card>
        <Card title="Administradores">
          <ul className="mb-5 divide-y text-sm">
            {admins.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                <div>
                  <p className="font-medium">{a.email}</p>
                  <p className="text-xs text-neutral-500">Último acesso: {formatDateTime(a.lastLoginAt)}</p>
                </div>
                {a.id !== me.id && (
                  <ActionButton action={removeAdminAction.bind(null, a.id)} variant="danger" confirm={`Remover o acesso de ${a.email}?`}>
                    Remover
                  </ActionButton>
                )}
              </li>
            ))}
          </ul>
          <ActionForm action={addAdminAction} submitLabel="Adicionar administrador" resetOnSuccess>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="E-mail">
                <input name="email" type="email" required className={inputClass} />
              </Field>
              <Field label="Senha inicial">
                <input name="password" type="password" required minLength={8} className={inputClass} />
              </Field>
            </div>
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
