"use client";

import {
  CircleDollarSign,
  ReceiptText,
  ShieldAlert,
  UsersRound,
  WalletCards,
} from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingCard } from "@/components/shared/loading-card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { buttonVariants } from "@/components/ui/button";
import {
  auditActionLabel,
  formatAdminCurrency,
  formatAdminDate,
  formatAdminPeriod,
} from "@/features/admin/admin-format";
import { useAdminDashboard } from "@/hooks/use-admin";
import { cn } from "@/lib/utils";

export default function AdminDashboardPage() {
  const dashboard = useAdminDashboard();

  if (dashboard.isLoading) {
    return <LoadingCard rows={8} />;
  }

  if (dashboard.isError || !dashboard.data) {
    return (
      <ErrorState
        icon={ShieldAlert}
        title="Administração indisponível"
        description="Não foi possível carregar o resumo. Tente novamente."
      />
    );
  }

  const data = dashboard.data;
  const currentPeriod = formatAdminPeriod(
    data.period.referenceYear,
    data.period.referenceMonth,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Administração"
        description={`Visão operacional de ${currentPeriod}. Os dados são consultados somente quando esta área é acessada.`}
      />

      <div className="flex flex-col gap-5">
      <section className="order-2 grid gap-4 sm:grid-cols-2 xl:order-1 xl:grid-cols-10">
        <div className="xl:col-span-2">
            <StatCard
              icon={UsersRound}
              title="Usuários cadastrados"
              value={data.registeredUsers}
              description="Total de contas preservadas no MatchPredict."
            />
          </div>
        <div className="xl:col-span-2">
            <StatCard
              icon={WalletCards}
              title="Participações ativas"
              value={data.activeParticipations}
              description={`Participações ativas em ${currentPeriod}.`}
            />
          </div>
        <div className="xl:col-span-2">
            <StatCard
              icon={ReceiptText}
              title="Pagamentos recebidos"
              value={data.receivedPayments}
              description="Confirmações com status PAID no mês civil atual."
            />
          </div>
        <div className="xl:col-span-4">
            <StatCard
              icon={CircleDollarSign}
              title="Valor recebido"
              value={
                <span className="whitespace-nowrap text-[clamp(1.75rem,2.2vw,2.25rem)]">
                  {formatAdminCurrency(data.receivedAmountCents)}
                </span>
              }
              description="Soma em centavos calculada no banco."
            />
          </div>
        </section>

        <section
          className={cn(
            "order-1 grid gap-5 rounded-2xl border p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center xl:order-2",
            data.financialReviews > 0
              ? "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
              : "border-border bg-card text-card-foreground",
          )}
        >
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100">
              <ShieldAlert className="size-6" aria-hidden />
            </span>
            <div>
              <h2 className="text-xl font-extrabold">Pendências financeiras</h2>
              <p className="mt-2 max-w-[70ch] text-sm font-medium leading-6 opacity-80 sm:text-base">
                {data.financialReviews > 0
                  ? `${data.financialReviews} pagamento(s) PAID não possuem participação ativa correspondente e exigem revisão humana.`
                  : "Nenhum pagamento PAID sem participação ativa foi identificado."}
              </p>
            </div>
          </div>
          <Link
            href="/admin/reviews"
            className={cn(
              buttonVariants({
                variant: data.financialReviews > 0 ? "default" : "outline",
              }),
              "w-full font-bold lg:w-auto",
            )}
          >
            Revisar pendências
          </Link>
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold text-foreground">
              Atividade administrativa recente
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Registro das ações sensíveis concluídas com sucesso.
            </p>
          </div>
        </div>

        {!data.recentActivity.length ? (
          <EmptyState
            icon={ShieldAlert}
            title="Nenhuma ação registrada"
            description="Desativações, reativações e exclusões aparecerão aqui."
          />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <ul className="divide-y divide-border">
              {data.recentActivity.map((log) => (
                <li
                  key={log.id}
                  className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-card-foreground">
                      {auditActionLabel[log.action]}
                    </p>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      Por {log.adminUser.name} · alvo {log.targetId}
                    </p>
                  </div>
                  <time
                    className="shrink-0 text-sm font-semibold text-muted-foreground"
                    dateTime={log.createdAt}
                  >
                    {formatAdminDate(log.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
