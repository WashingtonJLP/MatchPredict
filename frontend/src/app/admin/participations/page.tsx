"use client";

import { Search, UserCheck, WalletCards } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingCard } from "@/components/shared/loading-card";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { Button } from "@/components/ui/button";
import {
  formatAdminCurrency,
  formatAdminDate,
  formatAdminPeriod,
  paymentStatusLabel,
  participationStatusLabel,
} from "@/features/admin/admin-format";
import { AdminStatusBadge } from "@/features/admin/components/admin-status-badge";
import { useAdminParticipations, useAdminPeriods } from "@/hooks/use-admin";
import type { AdminParticipation, ParticipationStatus } from "@/types/admin";

export default function AdminParticipationsPage() {
  const [page, setPage] = useState(1);
  const [userInput, setUserInput] = useState("");
  const [user, setUser] = useState("");
  const [status, setStatus] = useState<"" | ParticipationStatus>("");
  const [periodId, setPeriodId] = useState("");
  const periods = useAdminPeriods();
  const participations = useAdminParticipations({
    page,
    limit: 20,
    user: user || undefined,
    status: status || undefined,
    periodId: periodId || undefined,
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setUser(userInput.trim());
  }

  const columns = [
    {
      key: "user",
      header: "Usuário",
      render: (item: AdminParticipation) => (
        <div>
          <Link
            href={`/admin/users/${item.user.id}`}
            className="font-extrabold text-foreground underline-offset-4 hover:underline"
          >
            {item.user.name}
          </Link>
          <p className="mt-1 break-all text-sm text-muted-foreground">
            {item.user.email}
          </p>
        </div>
      ),
    },
    {
      key: "period",
      header: "Período",
      render: (item: AdminParticipation) => (
        <span className="font-bold text-foreground">
          {formatAdminPeriod(
            item.period.referenceYear,
            item.period.referenceMonth,
          )}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item: AdminParticipation) => (
        <AdminStatusBadge
          label={participationStatusLabel[item.status]}
          tone={item.status === "ACTIVE" ? "success" : "neutral"}
        />
      ),
    },
    {
      key: "payment",
      header: "Pagamento associado",
      render: (item: AdminParticipation) =>
        item.payment ? (
          <div>
            <AdminStatusBadge
              label={paymentStatusLabel[item.payment.status]}
              tone={item.payment.status === "PAID" ? "success" : "warning"}
            />
            <p className="mt-1 text-sm font-semibold text-muted-foreground">
              {formatAdminCurrency(item.payment.amountCents)}
            </p>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Sem pagamento</span>
        ),
    },
    {
      key: "activated",
      header: "Ativação",
      render: (item: AdminParticipation) => (
        <span className="whitespace-nowrap text-sm font-semibold text-muted-foreground">
          {formatAdminDate(item.activatedAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        title="Participações"
        description="Estado mensal, pagamento associado e data de ativação sem carregar relações desnecessárias."
      />
      <form
        onSubmit={submit}
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[minmax(16rem,1fr)_12rem_14rem_auto]"
      >
        <label className="text-sm font-bold text-foreground">
          Usuário
          <div className="relative mt-2">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              value={userInput}
              onChange={(event) => setUserInput(event.target.value)}
              maxLength={100}
              placeholder="Nome ou e-mail"
              className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 focus:border-ring focus:ring-3 focus:ring-ring/15"
            />
          </div>
        </label>
        <SelectFilter
          label="Status"
          value={status}
          onChange={(value) => {
            setStatus(value as typeof status);
            setPage(1);
          }}
        >
          <option value="">Todos</option>
          <option value="ACTIVE">Ativa</option>
          <option value="CANCELLED">Cancelada</option>
        </SelectFilter>
        <SelectFilter
          disabled={periods.isLoading || periods.isError}
          label="Período"
          value={periodId}
          onChange={(value) => {
            setPeriodId(value);
            setPage(1);
          }}
        >
          <option value="">
            {periods.isLoading
              ? "Carregando períodos…"
              : periods.isError
                ? "Períodos indisponíveis"
                : "Todos"}
          </option>
          {periods.data?.map((period) => (
            <option key={period.id} value={period.id}>
              {formatAdminPeriod(period.referenceYear, period.referenceMonth)}
            </option>
          ))}
        </SelectFilter>
        <Button type="submit" className="mt-auto h-11 font-bold">
          Buscar
        </Button>
      </form>
      {periods.isError ? (
        <p className="-mt-4 text-sm font-semibold text-destructive">
          O filtro de período está indisponível. Os demais filtros continuam
          funcionando.
        </p>
      ) : null}
      {participations.isLoading ? (
        <LoadingCard rows={8} />
      ) : participations.isError ? (
        <ErrorState
          icon={UserCheck}
          title="Participações indisponíveis"
          description="Não foi possível carregar a lista agora."
        />
      ) : !participations.data?.data.length ? (
        <EmptyState
          icon={WalletCards}
          title="Nenhuma participação encontrada"
          description="Ajuste os filtros para tentar novamente."
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={participations.data.data}
            getRowKey={(item) => item.id}
          />
          <Pagination
            itemLabel="participações"
            page={participations.data.meta.page}
            total={participations.data.meta.total}
            totalPages={participations.data.meta.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

function SelectFilter({
  children,
  disabled = false,
  label,
  onChange,
  value,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="text-sm font-bold text-foreground">
      {label}
      <select
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 disabled:cursor-not-allowed disabled:opacity-60 focus:border-ring focus:ring-3 focus:ring-ring/15"
      >
        {children}
      </select>
    </label>
  );
}
