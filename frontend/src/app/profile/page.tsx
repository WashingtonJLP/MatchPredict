"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingCard } from "@/components/shared/loading-card";
import { PageHeader } from "@/components/shared/page-header";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  profileSchema,
  type ProfileFormData,
} from "@/features/auth/auth-schemas";
import { useMe, useUpdateProfile } from "@/hooks/use-user";
import { getApiErrorMessage } from "@/lib/api-error";

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
    try {
      await updateProfile.mutateAsync(data);
      setSuccess(true);
      toast.success("Perfil atualizado.");
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Nao foi possivel atualizar o perfil."),
      );
    }
  }

  return (
    <DashboardShell>
      <div className="space-y-9">
        <PageHeader
          title="Perfil"
          description="Gerencie as informacoes basicas exibidas na sua conta."
        />

        {meQuery.isLoading ? (
          <LoadingCard rows={5} />
        ) : meQuery.isError ? (
          <ErrorState
            icon={UserRound}
            title="Perfil indisponivel"
            description="Nao foi possivel carregar seus dados agora."
          />
        ) : meQuery.data ? (
          <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr] lg:gap-6">
            <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm shadow-primary/5 sm:p-8">
              <UserAvatar name={meQuery.data.name} size="lg" />
              <h2 className="mt-5 break-words text-3xl font-extrabold leading-tight text-card-foreground">
                {meQuery.data.name}
              </h2>
              <p className="mt-3 flex min-w-0 items-center gap-2 text-base font-medium leading-7 text-muted-foreground">
                <Mail className="size-5 shrink-0" aria-hidden />
                <span className="min-w-0 break-words">{meQuery.data.email}</span>
              </p>
            </aside>

            <form
              className="rounded-2xl border border-border bg-card p-5 shadow-sm shadow-primary/5 sm:p-8"
              onSubmit={handleSubmit(onSubmit)}
            >
              <h2 className="text-2xl font-extrabold text-card-foreground sm:text-3xl">
                Dados pessoais
              </h2>
              <p className="mt-3 max-w-[650px] text-base leading-7 text-muted-foreground">
                O e-mail e exibido como leitura porque o backend atual nao
                possui endpoint para altera-lo.
              </p>

              <div className="mt-8 space-y-5">
                <label className="block text-sm font-medium text-foreground">
                  Nome
                  <input
                    type="text"
                    className="mt-2 h-[52px] w-full rounded-xl border border-input bg-background px-4 text-base text-foreground outline-none transition hover:border-border focus:border-ring focus:ring-4 focus:ring-ring/15"
                    {...register("name")}
                  />
                  {errors.name ? (
                    <span className="mt-2 block text-sm text-destructive">
                      {errors.name.message}
                    </span>
                  ) : null}
                </label>

                <label className="block text-sm font-medium text-foreground">
                  E-mail
                  <input
                    type="email"
                    value={meQuery.data.email}
                    readOnly
                    className="mt-2 h-[52px] w-full rounded-xl border border-input bg-muted px-4 text-base text-muted-foreground outline-none"
                  />
                </label>

                {updateProfile.isError ? (
                  <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    Nao foi possivel atualizar o perfil.
                  </p>
                ) : null}
                {success ? (
                  <p className="rounded-xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-accent">
                    Perfil atualizado com sucesso.
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting || updateProfile.isPending}
                  className="h-[52px] w-full rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/80 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
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
