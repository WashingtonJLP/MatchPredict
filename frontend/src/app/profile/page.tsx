"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingCard } from "@/components/shared/loading-card";
import { PageHeader } from "@/components/shared/page-header";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  profileSchema,
  type ProfileFormData,
} from "@/features/auth/auth-schemas";
import { useMe, useUpdateProfile } from "@/hooks/use-user";

export default function ProfilePage() {
  const meQuery = useMe();
  const updateProfile = useUpdateProfile();
  const [success, setSuccess] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (meQuery.data) {
      reset({
        name: meQuery.data.name,
      });
    }
  }, [meQuery.data, reset]);

  async function onSubmit(data: ProfileFormData) {
    setSuccess(false);
    await updateProfile.mutateAsync(data);
    setSuccess(true);
  }

  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          title="Perfil"
          description="Gerencie as informacoes basicas exibidas na sua conta."
        />

        {meQuery.isLoading ? (
          <LoadingCard rows={5} />
        ) : meQuery.isError ? (
          <EmptyState
            icon={UserRound}
            title="Perfil indisponivel"
            description="Nao foi possivel carregar seus dados agora."
          />
        ) : meQuery.data ? (
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
            <aside className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <UserAvatar name={meQuery.data.name} size="lg" />
              <h2 className="mt-5 text-2xl font-bold text-slate-950">
                {meQuery.data.name}
              </h2>
              <p className="mt-2 flex items-center gap-2 text-base leading-7 text-slate-600">
                <Mail className="size-4" aria-hidden />
                {meQuery.data.email}
              </p>
            </aside>

            <form
              className="rounded-2xl border border-border bg-card p-8 shadow-sm"
              onSubmit={handleSubmit(onSubmit)}
            >
              <h2 className="text-2xl font-bold text-slate-950">
                Dados pessoais
              </h2>
              <p className="mt-3 max-w-[650px] text-base leading-7 text-slate-600">
                O e-mail e exibido como leitura porque o backend atual nao
                possui endpoint para altera-lo.
              </p>

              <div className="mt-8 space-y-5">
                <label className="block text-sm font-medium text-slate-700">
                  Nome
                  <input
                    type="text"
                    className="mt-2 h-12 w-full rounded-xl border border-input bg-white px-4 text-base outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
                    {...register("name")}
                  />
                  {errors.name ? (
                    <span className="mt-2 block text-sm text-red-600">
                      {errors.name.message}
                    </span>
                  ) : null}
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  E-mail
                  <input
                    type="email"
                    value={meQuery.data.email}
                    readOnly
                    className="mt-2 h-12 w-full rounded-xl border border-input bg-slate-50 px-4 text-base text-slate-500 outline-none"
                  />
                </label>

                {updateProfile.isError ? (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    Nao foi possivel atualizar o perfil.
                  </p>
                ) : null}
                {success ? (
                  <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    Perfil atualizado com sucesso.
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting || updateProfile.isPending}
                  className="h-12 rounded-xl bg-slate-950 px-6 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updateProfile.isPending ? "Salvando..." : "Salvar alteracoes"}
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
