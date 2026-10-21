"use client";

import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  CircleDollarSign,
  ShieldAlert,
  Trash2,
  UserRound,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";
import { toast } from "sonner";

import { ErrorState } from "@/components/shared/error-state";
import { LoadingCard } from "@/components/shared/loading-card";
import { PageHeader } from "@/components/shared/page-header";
import { AdminAvatarModeration } from "@/features/admin/components/admin-avatar-moderation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogCloseButton } from "@/components/ui/dialog";
import {
  formatAdminCurrency,
  formatAdminDate,
  formatAdminPeriod,
  paymentStatusLabel,
  participationStatusLabel,
} from "@/features/admin/admin-format";
import { AdminStatusBadge } from "@/features/admin/components/admin-status-badge";
import {
  createSingleFlight,
  isExactDeleteConfirmation,
} from "@/features/admin/single-flight";
import {
  useAdminDeletionImpact,
  useAdminUser,
  useDeleteAdminUser,
  useDisableAdminUser,
  useReactivateAdminUser,
} from "@/hooks/use-admin";
import { getApiErrorMessage } from "@/lib/api-error";

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = params.id;
  const user = useAdminUser(userId);
  const [disableOpen, setDisableOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const impact = useAdminDeletionImpact(userId, deleteOpen);
  const deleteUser = useDeleteAdminUser();
  const disableUser = useDisableAdminUser();
  const reactivateUser = useReactivateAdminUser();
  const disableFlight = useRef(createSingleFlight()).current;
  const deleteFlight = useRef(createSingleFlight()).current;

  if (user.isLoading) return <LoadingCard rows={10} />;
  if (user.isError || !user.data) {
    return (
      <ErrorState
        icon={UserRound}
        title="Usuário indisponível"
        description="O usuário não existe ou não pôde ser carregado."
      />
    );
  }

  const data = user.data;
  const accountMutationPending =
    disableUser.isPending || reactivateUser.isPending;

  async function changeAccountStatus() {
    if (!data.disabledAt) {
      setDisableOpen(true);
      return;
    }

    try {
      await reactivateUser.mutateAsync(userId);
      toast.success("Conta reativada e auditoria registrada.");
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, "Não foi possível alterar a conta."),
      );
    }
  }

  async function confirmDisable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await disableFlight.run(async () => {
      try {
        await disableUser.mutateAsync(userId);
        setDisableOpen(false);
        toast.success("Conta desativada e auditoria registrada.");
      } catch (error) {
        toast.error(
          getApiErrorMessage(error, "Não foi possível desativar a conta."),
        );
      }
    });
  }

  async function confirmDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isExactDeleteConfirmation(confirmation) || !impact.data?.canDelete) {
      return;
    }

    await deleteFlight.run(async () => {
      try {
        await deleteUser.mutateAsync(userId);
        toast.success("Usuário de teste excluído e auditoria registrada.");
        router.replace("/admin/users");
      } catch (error) {
        toast.error(getApiErrorMessage(error, "A exclusão foi bloqueada."));
        await impact.refetch();
      }
    });
  }

  return (
    <div className="space-y-8">
      <Link
        href="/admin/users"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Voltar para usuários
      </Link>

      <PageHeader
        title={data.name}
        description="Dados explícitos e histórico necessário para uma decisão administrativa segura."
        action={
          <AdminStatusBadge
            label={data.disabledAt ? "Conta desativada" : "Conta ativa"}
            tone={data.disabledAt ? "danger" : "success"}
          />
        }
      />

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <article className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <AdminAvatarModeration user={data} />
            <dl className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
              <Detail label="E-mail" value={data.email} />
              <Detail label="Papel" value={data.role} />
              <Detail
                label="Cadastro"
                value={formatAdminDate(data.createdAt)}
              />
              <Detail
                label="Última atualização"
                value={formatAdminDate(data.updatedAt)}
              />
            </dl>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-5 sm:grid-cols-5">
            <Count label="Palpites" value={data._count.predictions} />
            <Count label="Standings" value={data._count.standings} />
            <Count label="Participações" value={data._count.participations} />
            <Count label="Pagamentos" value={data._count.payments} />
            <Count label="Ações admin" value={data._count.adminAuditLogs} />
          </div>
        </article>

        <aside className="rounded-2xl border border-destructive/25 bg-card p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-extrabold text-card-foreground">
            Gestão da conta
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Desativar preserva todo o histórico. Excluir é reservado a contas de
            teste elegíveis.
          </p>
          <div className="mt-5 grid gap-3">
            <Button
              variant="outline"
              disabled={data.role === "ADMIN" || accountMutationPending}
              onClick={changeAccountStatus}
              className="justify-start font-bold"
            >
              {data.disabledAt ? (
                <CheckCircle2 className="size-4" aria-hidden />
              ) : (
                <Ban className="size-4" aria-hidden />
              )}
              {accountMutationPending
                ? data.disabledAt
                  ? "Reativando…"
                  : "Desativando…"
                : data.disabledAt
                  ? "Reativar conta"
                  : "Desativar conta"}
            </Button>
            <Button
              variant="destructive"
              disabled={data.role === "ADMIN"}
              onClick={() => {
                setConfirmation("");
                setDeleteOpen(true);
              }}
              className="justify-start font-bold"
            >
              <Trash2 className="size-4" aria-hidden />
              Analisar exclusão definitiva
            </Button>
          </div>
          {data.role === "ADMIN" ? (
            <p className="mt-4 rounded-xl bg-muted px-3 py-3 text-sm font-semibold text-muted-foreground">
              Contas ADMIN não podem ser desativadas ou excluídas por este
              fluxo.
            </p>
          ) : null}
        </aside>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <HistoryPanel icon={WalletCards} title="Histórico de participações">
          {!data.participations.length ? (
            <EmptyLine text="Nenhuma participação registrada." />
          ) : (
            data.participations.map((participation) => (
              <div
                key={participation.id}
                className="flex flex-col gap-2 border-b border-border py-4 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-bold text-foreground">
                    {formatAdminPeriod(
                      participation.period.referenceYear,
                      participation.period.referenceMonth,
                    )}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ativada em {formatAdminDate(participation.activatedAt)}
                  </p>
                </div>
                <AdminStatusBadge
                  label={participationStatusLabel[participation.status]}
                  tone={
                    participation.status === "ACTIVE" ? "success" : "neutral"
                  }
                />
              </div>
            ))
          )}
        </HistoryPanel>

        <HistoryPanel icon={CircleDollarSign} title="Histórico de pagamentos">
          {!data.payments.length ? (
            <EmptyLine text="Nenhum pagamento registrado." />
          ) : (
            data.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col gap-2 border-b border-border py-4 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-bold text-foreground">
                    {formatAdminCurrency(payment.amountCents)} ·{" "}
                    {formatAdminPeriod(
                      payment.period.referenceYear,
                      payment.period.referenceMonth,
                    )}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Criado em {formatAdminDate(payment.createdAt)}
                  </p>
                </div>
                <AdminStatusBadge
                  label={paymentStatusLabel[payment.status]}
                  tone={
                    payment.status === "PAID"
                      ? "success"
                      : payment.status === "PENDING"
                        ? "warning"
                        : "neutral"
                  }
                />
              </div>
            ))
          )}
        </HistoryPanel>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-extrabold text-card-foreground">
          Classificação e desempenho
        </h2>
        {!data.standings.length ? (
          <EmptyLine text="Nenhum standing registrado." />
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.standings.map((standing) => (
              <article key={standing.id} className="rounded-xl bg-muted p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-extrabold text-foreground">
                    {standing.season.name}
                  </p>
                  {standing.season.isActive ? (
                    <AdminStatusBadge label="Atual" tone="success" />
                  ) : null}
                </div>
                <p className="mt-4 text-3xl font-extrabold text-foreground tabular-nums">
                  #{standing.position}
                </p>
                <p className="mt-2 text-sm font-semibold text-muted-foreground">
                  {standing.totalPoints} pontos · {standing.exactScores} exatos
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <Dialog
        open={disableOpen}
        onOpenChange={setDisableOpen}
        titleId="disable-user-title"
        className="max-w-lg"
      >
        <form onSubmit={confirmDisable}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="disable-user-title"
                className="text-2xl font-extrabold text-popover-foreground"
              >
                Desativar conta de {data.name}?
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                A pessoa perderá o acesso imediatamente, inclusive em sessões já
                abertas. Palpites, pagamentos, participações e demais históricos
                serão preservados. A conta poderá ser reativada posteriormente.
              </p>
            </div>
            <DialogCloseButton onClick={() => setDisableOpen(false)} />
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              data-dialog-initial-focus
              variant="outline"
              disabled={disableUser.isPending}
              onClick={() => setDisableOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={disableUser.isPending}
            >
              <Ban className="size-4" aria-hidden />
              {disableUser.isPending ? "Desativando…" : "Desativar conta"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        titleId="delete-user-title"
        className="max-w-xl"
      >
        <form onSubmit={confirmDelete}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id="delete-user-title"
                className="text-2xl font-extrabold text-popover-foreground"
              >
                Excluir definitivamente?
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Esta ação é irreversível e só é liberada após nova análise do
                backend.
              </p>
            </div>
            <DialogCloseButton onClick={() => setDeleteOpen(false)} />
          </div>

          <div className="mt-5 rounded-xl bg-muted p-4">
            <p className="font-extrabold text-foreground">{data.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {maskEmail(data.email)}
            </p>
          </div>

          {impact.isLoading ? (
            <div className="mt-5">
              <LoadingCard rows={4} />
            </div>
          ) : impact.isError || !impact.data ? (
            <p className="mt-5 rounded-xl bg-destructive/10 p-4 text-sm font-semibold text-destructive">
              A análise de impacto falhou. A exclusão permanece bloqueada.
            </p>
          ) : (
            <>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
                <Count
                  label="Palpites"
                  value={impact.data.counts.predictions}
                />
                <Count label="Standings" value={impact.data.counts.standings} />
                <Count
                  label="Participações"
                  value={impact.data.counts.participations}
                />
                <Count label="Pagamentos" value={impact.data.counts.payments} />
                <Count
                  label="Ações admin"
                  value={impact.data.counts.adminAuditLogs}
                />
              </div>

              {impact.data.blockers.length ? (
                <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                  <p className="flex items-center gap-2 font-extrabold">
                    <ShieldAlert className="size-5" aria-hidden />
                    Exclusão bloqueada
                  </p>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">
                    {impact.data.blockers.map((blocker) => (
                      <li key={blocker.code}>{blocker.message}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <label className="mt-5 block text-sm font-bold text-foreground">
                  Digite <span className="text-destructive">EXCLUIR</span> para
                  confirmar
                  <input
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    autoComplete="off"
                    className="mt-2 h-12 w-full rounded-xl border border-destructive/40 bg-background px-4 font-bold tracking-wide text-foreground focus:border-destructive focus:ring-3 focus:ring-destructive/15"
                  />
                </label>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  data-dialog-initial-focus
                  variant="outline"
                  onClick={() => setDeleteOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={
                    !impact.data.canDelete ||
                    !isExactDeleteConfirmation(confirmation) ||
                    deleteUser.isPending
                  }
                >
                  <Trash2 className="size-4" aria-hidden />
                  {deleteUser.isPending
                    ? "Excluindo…"
                    : "Excluir definitivamente"}
                </Button>
              </div>
            </>
          )}
        </form>
      </Dialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-bold text-foreground sm:text-base">
        {value}
      </dd>
    </div>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted px-3 py-3 text-center">
      <p className="text-2xl font-extrabold text-foreground tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function HistoryPanel({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode;
  icon: typeof WalletCards;
  title: string;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-foreground">
          <Icon className="size-5" aria-hidden />
        </span>
        <h2 className="text-xl font-extrabold text-card-foreground">{title}</h2>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function EmptyLine({ text }: { text: string }) {
  return (
    <p className="mt-4 rounded-xl bg-muted px-4 py-4 text-sm font-semibold text-muted-foreground">
      {text}
    </p>
  );
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"•".repeat(Math.max(3, local.length - visible.length))}@${domain}`;
}
