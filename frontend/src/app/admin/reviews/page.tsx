"use client";

import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingCard } from "@/components/shared/loading-card";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { formatAdminCurrency, formatAdminDate, formatAdminPeriod } from "@/features/admin/admin-format";
import { AdminStatusBadge } from "@/features/admin/components/admin-status-badge";
import { useAdminFinancialReviews } from "@/hooks/use-admin";
import type { AdminFinancialReview } from "@/types/admin";

export default function AdminFinancialReviewsPage() {
  const [page, setPage] = useState(1);
  const reviews = useAdminFinancialReviews(page);
  const columns = [
    { key: "case", header: "Pendência", render: (item: AdminFinancialReview) => <div><AdminStatusBadge label="Revisão necessária" tone="warning" /><p className="mt-2 text-sm font-semibold text-muted-foreground">{item.reviewCode === "PAID_WITHOUT_PARTICIPATION" ? "Pagamento PAID sem participação" : "Participação associada não está ativa"}</p></div> },
    { key: "user", header: "Usuário", render: (item: AdminFinancialReview) => <div><Link href={`/admin/users/${item.user.id}`} className="font-extrabold text-foreground underline-offset-4 hover:underline">{item.user.name}</Link><p className="mt-1 break-all text-sm text-muted-foreground">{item.user.email}</p></div> },
    { key: "period", header: "Período", render: (item: AdminFinancialReview) => <span className="font-bold text-foreground">{formatAdminPeriod(item.period.referenceYear, item.period.referenceMonth)}</span> },
    { key: "amount", header: "Valor", render: (item: AdminFinancialReview) => <span className="whitespace-nowrap font-extrabold text-foreground tabular-nums">{formatAdminCurrency(item.amountCents)}</span> },
    { key: "provider", header: "Provedor", render: (item: AdminFinancialReview) => <span className="font-semibold text-foreground">{item.provider}</span> },
    { key: "paid", header: "Pago em", render: (item: AdminFinancialReview) => <span className="whitespace-nowrap text-sm font-semibold text-muted-foreground">{formatAdminDate(item.paidAt)}</span> },
  ];

  return (
    <div className="space-y-7">
      <PageHeader title="Pendências financeiras" description="Fila observacional para pagamentos confirmados sem participação ativa correspondente." />
      <section className="flex items-start gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
        <ShieldAlert className="mt-0.5 size-6 shrink-0" aria-hidden />
        <div><h2 className="font-extrabold">Revisão sem mutação financeira</h2><p className="mt-2 max-w-[75ch] text-sm font-medium leading-6">Esta versão não oferece “marcar como pago”, ativação manual, troca de Payment, estorno ou edição de valor. A lista identifica casos para investigação segura fora deste fluxo.</p></div>
      </section>
      {reviews.isLoading ? <LoadingCard rows={8} /> : reviews.isError ? (
        <ErrorState icon={ShieldAlert} title="Pendências indisponíveis" description="Não foi possível consultar a fila agora." />
      ) : !reviews.data?.data.length ? (
        <EmptyState icon={ShieldAlert} title="Nenhuma pendência identificada" description="Não há pagamentos PAID sem participação ativa correspondente." />
      ) : (
        <><DataTable columns={columns} data={reviews.data.data} getRowKey={(item) => item.id} /><Pagination itemLabel="pendências" page={reviews.data.meta.page} total={reviews.data.meta.total} totalPages={reviews.data.meta.totalPages} onPageChange={setPage} /></>
      )}
    </div>
  );
}
