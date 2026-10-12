"use client";

import { Search, UserRoundSearch, UsersRound } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";

import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingCard } from "@/components/shared/loading-card";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { buttonVariants } from "@/components/ui/button";
import {
  formatAdminCurrency,
  formatAdminDate,
  paymentStatusLabel,
  participationStatusLabel,
} from "@/features/admin/admin-format";
import { AdminStatusBadge } from "@/features/admin/components/admin-status-badge";
import { useAdminUsers } from "@/hooks/use-admin";
import { cn } from "@/lib/utils";
import type { AdminUserSummary, PaymentStatus } from "@/types/admin";

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"" | "USER" | "ADMIN">("");
  const [accountStatus, setAccountStatus] = useState<"" | "ACTIVE" | "DISABLED">("");
  const users = useAdminUsers({
    page,
    limit: 20,
    search: search || undefined,
    role: role || undefined,
    accountStatus: accountStatus || undefined,
  });

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  const columns = [
    {
      key: "user",
      header: "Usuário",
      render: (user: AdminUserSummary) => (
        <div className="min-w-0">
          <Link href={`/admin/users/${user.id}`} className="font-extrabold text-foreground underline-offset-4 hover:underline">
            {user.name}
          </Link>
          <p className="mt-1 break-all text-sm text-muted-foreground">{user.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Papel",
      render: (user: AdminUserSummary) => (
        <AdminStatusBadge label={user.role} tone={user.role === "ADMIN" ? "info" : "neutral"} />
      ),
    },
    {
      key: "account",
      header: "Conta",
      render: (user: AdminUserSummary) => (
        <AdminStatusBadge
          label={user.disabledAt ? "Desativada" : "Ativa"}
          tone={user.disabledAt ? "danger" : "success"}
        />
      ),
    },
    {
      key: "participation",
      header: "Participação atual",
      render: (user: AdminUserSummary) =>
        user.currentParticipation ? (
          <AdminStatusBadge
            label={participationStatusLabel[user.currentParticipation.status]}
            tone={user.currentParticipation.status === "ACTIVE" ? "success" : "neutral"}
          />
        ) : (
          <span className="text-sm text-muted-foreground">Sem participação</span>
        ),
    },
    {
      key: "payment",
      header: "Pagamento atual",
      render: (user: AdminUserSummary) =>
        user.currentPayment ? (
          <div>
            <AdminStatusBadge
              label={paymentStatusLabel[user.currentPayment.status]}
              tone={paymentTone(user.currentPayment.status)}
            />
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              {formatAdminCurrency(user.currentPayment.amountCents)}
            </p>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">Sem pagamento</span>
        ),
    },
    {
      key: "createdAt",
      header: "Cadastro",
      render: (user: AdminUserSummary) => (
        <span className="whitespace-nowrap text-sm font-semibold text-muted-foreground">
          {formatAdminDate(user.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        title="Usuários"
        description="Localize contas, revise o estado mensal e abra o contexto antes de qualquer ação sensível."
      />

      <form onSubmit={submitSearch} className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[minmax(16rem,1fr)_12rem_12rem_auto]">
        <label className="text-sm font-bold text-foreground">
          Nome ou e-mail
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              maxLength={100}
              placeholder="Buscar usuário"
              className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3 text-foreground focus:border-ring focus:ring-3 focus:ring-ring/15"
            />
          </div>
        </label>
        <FilterSelect label="Papel" value={role} onChange={(value) => { setRole(value as typeof role); setPage(1); }}>
          <option value="">Todos</option>
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </FilterSelect>
        <FilterSelect label="Situação" value={accountStatus} onChange={(value) => { setAccountStatus(value as typeof accountStatus); setPage(1); }}>
          <option value="">Todas</option>
          <option value="ACTIVE">Ativas</option>
          <option value="DISABLED">Desativadas</option>
        </FilterSelect>
        <button type="submit" className={cn(buttonVariants(), "mt-auto h-11 font-bold")}>Buscar</button>
      </form>

      {users.isLoading ? (
        <LoadingCard rows={8} />
      ) : users.isError ? (
        <ErrorState icon={UserRoundSearch} title="Usuários indisponíveis" description="Não foi possível carregar a lista agora." />
      ) : !users.data?.data.length ? (
        <EmptyState icon={UsersRound} title="Nenhum usuário encontrado" description="Ajuste a busca ou os filtros para tentar novamente." />
      ) : (
        <>
          <DataTable columns={columns} data={users.data.data} getRowKey={(user) => user.id} />
          <Pagination
            itemLabel="usuários"
            page={users.data.meta.page}
            total={users.data.meta.total}
            totalPages={users.data.meta.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

function FilterSelect({
  children,
  label,
  onChange,
  value,
}: {
  children: React.ReactNode;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="text-sm font-bold text-foreground">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-foreground focus:border-ring focus:ring-3 focus:ring-ring/15"
      >
        {children}
      </select>
    </label>
  );
}

function paymentTone(status: PaymentStatus) {
  if (status === "PAID") return "success" as const;
  if (status === "PENDING") return "warning" as const;
  if (status === "FAILED") return "danger" as const;
  return "neutral" as const;
}
