"use client";

import { CircleDollarSign, ReceiptText, Search } from "lucide-react";
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
} from "@/features/admin/admin-format";
import { AdminStatusBadge } from "@/features/admin/components/admin-status-badge";
import { useAdminPayments, useAdminPeriods } from "@/hooks/use-admin";
import type { AdminPayment, PaymentStatus } from "@/types/admin";

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1);
  const [userInput, setUserInput] = useState("");
  const [user, setUser] = useState("");
  const [status, setStatus] = useState<"" | PaymentStatus>("");
  const [periodId, setPeriodId] = useState("");
  const periods = useAdminPeriods();
  const payments = useAdminPayments({
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
      render: (payment: AdminPayment) => (
        <div>
          <Link
            href={`/admin/users/${payment.user.id}`}
            className="font-extrabold text-foreground underline-offset-4 hover:underline"
          >
            {payment.user.name}
          </Link>
          <p className="mt-1 break-all text-sm text-muted-foreground">
            {payment.user.email}
          </p>
        </div>
      ),
    },
    {
      key: "period",
      header: "Período",
      render: (payment: AdminPayment) => (
        <span className="font-bold text-foreground">
          {formatAdminPeriod(
            payment.period.referenceYear,
            payment.period.referenceMonth,
          )}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Valor",
      render: (payment: AdminPayment) => (
        <span className="whitespace-nowrap font-extrabold text-foreground tabular-nums">
          {formatAdminCurrency(payment.amountCents)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (payment: AdminPayment) => (
        <AdminStatusBadge
          label={paymentStatusLabel[payment.status]}
          tone={
            payment.status === "PAID"
              ? "success"
              : payment.status === "PENDING"
                ? "warning"
                : payment.status === "FAILED"
                  ? "danger"
                  : "neutral"
          }
        />
      ),
    },
    {
      key: "method",
      header: "Método / provedor",
      render: (payment: AdminPayment) => (
        <div>
          <p className="font-bold text-foreground">{payment.method}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {payment.provider}
          </p>
        </div>
      ),
    },
    {
      key: "created",
      header: "Criado / pago",
      render: (payment: AdminPayment) => (
        <div className="whitespace-nowrap text-sm text-muted-foreground">
          <p>{formatAdminDate(payment.createdAt)}</p>
          <p className="mt-1 font-semibold">
            {payment.paidAt
              ? `Pago: ${formatAdminDate(payment.paidAt)}`
              : "Ainda não pago"}
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        title="Pagamentos"
        description="Consulta paginada sem QR Code, payload PIX, referências internas ou respostas brutas do provedor."
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
          {Object.entries(paymentStatusLabel).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
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

      {payments.isLoading ? (
        <LoadingCard rows={8} />
      ) : payments.isError ? (
        <ErrorState
          icon={CircleDollarSign}
          title="Pagamentos indisponíveis"
          description="Não foi possível carregar a lista agora."
        />
      ) : !payments.data?.data.length ? (
        <EmptyState
          icon={ReceiptText}
          title="Nenhum pagamento encontrado"
          description="Ajuste os filtros para tentar novamente."
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={payments.data.data}
            getRowKey={(payment) => payment.id}
          />
          <Pagination
            itemLabel="pagamentos"
            page={payments.data.meta.page}
            total={payments.data.meta.total}
            totalPages={payments.data.meta.totalPages}
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
