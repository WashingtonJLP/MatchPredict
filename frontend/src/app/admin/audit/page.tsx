"use client";

import { ScrollText, ShieldAlert } from "lucide-react";
import { useState } from "react";

import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingCard } from "@/components/shared/loading-card";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import {
  auditActionLabel,
  formatAdminDate,
} from "@/features/admin/admin-format";
import { useAdminAuditLogs } from "@/hooks/use-admin";
import type { AdminAuditLog } from "@/types/admin";

export default function AdminAuditPage() {
  const [page, setPage] = useState(1);
  const audit = useAdminAuditLogs(page);
  const columns = [
    {
      key: "action",
      header: "Ação",
      render: (log: AdminAuditLog) => (
        <span className="font-extrabold text-foreground">
          {auditActionLabel[log.action]}
        </span>
      ),
    },
    {
      key: "admin",
      header: "Administrador",
      render: (log: AdminAuditLog) => (
        <div>
          <p className="font-bold text-foreground">{log.adminUser.name}</p>
          <p className="mt-1 break-all text-sm text-muted-foreground">
            {log.adminUser.email}
          </p>
        </div>
      ),
    },
    {
      key: "target",
      header: "Alvo",
      render: (log: AdminAuditLog) => (
        <div>
          <p className="font-bold text-foreground">{log.targetType}</p>
          <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
            {log.targetId}
          </p>
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Data",
      render: (log: AdminAuditLog) => (
        <time
          className="whitespace-nowrap text-sm font-semibold text-muted-foreground"
          dateTime={log.createdAt}
        >
          {formatAdminDate(log.createdAt)}
        </time>
      ),
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        title="Auditoria"
        description="Histórico paginado das ações administrativas sensíveis concluídas com sucesso."
      />

      {audit.isLoading ? (
        <LoadingCard rows={8} />
      ) : audit.isError ? (
        <ErrorState
          icon={ShieldAlert}
          title="Auditoria indisponível"
          description="Não foi possível carregar os registros agora."
        />
      ) : !audit.data?.data.length ? (
        <EmptyState
          icon={ScrollText}
          title="Nenhuma ação registrada"
          description="Desativações, reativações e exclusões concluídas aparecerão aqui."
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={audit.data.data}
            getRowKey={(log) => log.id}
          />
          <Pagination
            itemLabel="registros"
            page={audit.data.meta.page}
            total={audit.data.meta.total}
            totalPages={audit.data.meta.totalPages}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
