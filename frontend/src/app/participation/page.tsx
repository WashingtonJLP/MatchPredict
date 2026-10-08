"use client";

import {
  CheckCircle2,
  Clock3,
  Copy,
  History,
  QrCode,
  ShieldCheck,
  TriangleAlert,
  WalletCards,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { toast } from "sonner";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingCard } from "@/components/shared/loading-card";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  useCreatePixPayment,
  useCurrentPixPayment,
  useCurrentParticipation,
  useMyPayments,
  usePaymentStatus,
  useRefreshParticipationData,
} from "@/hooks/use-payments";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { toPixQrCodeImageSrc } from "@/features/participation/pix-qr-code";
import type {
  CurrentParticipation,
  PaymentHistoryItem,
  PaymentStatus,
  PixPayment,
} from "@/types/payment";

const statusLabels: Record<PaymentStatus, string> = {
  PAID: "Pago",
  PENDING: "Pendente",
  EXPIRED: "Expirado",
  CANCELLED: "Cancelado",
  FAILED: "Falhou",
};

const statusClasses: Record<PaymentStatus, string> = {
  PAID:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  EXPIRED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-muted text-muted-foreground",
  FAILED: "bg-destructive/10 text-destructive",
};

export default function ParticipationPage() {
  const participationQuery = useCurrentParticipation();
  const currentPixQuery = useCurrentPixPayment();
  const paymentsQuery = useMyPayments();
  const createPix = useCreatePixPayment();
  const refreshParticipationData = useRefreshParticipationData();
  const [pixPayment, setPixPayment] = useState<PixPayment | null>(null);
  const [pixError, setPixError] = useState<string | null>(null);
  const [pixScrollRequest, setPixScrollRequest] = useState(0);
  const pixPaymentPanelRef = useRef<HTMLElement>(null);
  const displayedPixPayment = pixPayment ?? currentPixQuery.data ?? null;
  const paymentStatusQuery = usePaymentStatus(
    displayedPixPayment?.id ?? null,
    displayedPixPayment?.status === "PENDING",
  );
  const effectivePixStatus =
    paymentStatusQuery.data?.status ?? displayedPixPayment?.status ?? null;

  useEffect(() => {
    const status = paymentStatusQuery.data?.status;

    if (
      !status ||
      !displayedPixPayment ||
      status === displayedPixPayment.status
    ) {
      return;
    }

    setPixPayment({ ...displayedPixPayment, status });

    if (status === "PAID") {
      toast.success("Pagamento confirmado. Sua participação está ativa.");
      void refreshParticipationData();
    } else if (status === "EXPIRED") {
      toast.warning("Este PIX expirou. Gere uma nova cobrança para participar.");
      void refreshParticipationData();
    }
  }, [
    paymentStatusQuery.data?.status,
    displayedPixPayment,
    refreshParticipationData,
  ]);

  useEffect(() => {
    if (pixScrollRequest === 0) {
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      const panel = pixPaymentPanelRef.current;

      if (!panel) {
        return;
      }

      panel.focus({ preventScroll: true });
      panel.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [pixScrollRequest]);

  async function handleCreatePix() {
    setPixError(null);

    try {
      const payment = await createPix.mutateAsync();
      setPixPayment(payment);
      setPixScrollRequest((request) => request + 1);
      void refreshParticipationData();
    } catch (error) {
      setPixError(
        getApiErrorMessage(
          error,
          "Não foi possível gerar o PIX agora. Tente novamente.",
        ),
      );
    }
  }

  async function handleCopyPix() {
    if (!displayedPixPayment?.pixCopyPaste) {
      return;
    }

    try {
      await navigator.clipboard.writeText(displayedPixPayment.pixCopyPaste);
      toast.success("Código PIX copiado.");
    } catch {
      toast.error("Não foi possível copiar. Selecione o código manualmente.");
    }
  }

  return (
    <DashboardShell>
      <div className="min-w-0 space-y-9">
        <PageHeader
          title="Minha participação"
          description="Acompanhe sua participação mensal, pague via PIX e consulte seu histórico."
        />

        {participationQuery.isLoading ? (
          <LoadingCard rows={5} />
        ) : participationQuery.isError ? (
          <ErrorState
            icon={WalletCards}
            title="Participação indisponível"
            description="Não foi possível consultar sua participação agora. Tente novamente em instantes."
          />
        ) : participationQuery.data ? (
          <section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.72fr)]">
            <CurrentParticipationCard
              participation={participationQuery.data}
              isCreatingPix={createPix.isPending}
              pixError={pixError}
              onCreatePix={handleCreatePix}
            />

            <div className="min-w-0 rounded-2xl bg-primary p-6 text-primary-foreground shadow-lg shadow-primary/15 sm:p-8">
              <ShieldCheck className="size-9 text-accent" aria-hidden />
              <h2 className="mt-5 text-2xl font-extrabold">
                Uma participação, o mês inteiro
              </h2>
              <p className="mt-3 max-w-[52ch] text-base leading-7 text-primary-foreground/80">
                A confirmação do PIX habilita seus palpites para as partidas cujo
                kickoff pertence ao período mensal indicado. As regras de
                fechamento no início de cada partida continuam iguais.
              </p>
            </div>
          </section>
        ) : null}

        {displayedPixPayment ? (
          <PixPaymentPanel
            sectionRef={pixPaymentPanelRef}
            payment={displayedPixPayment}
            status={effectivePixStatus ?? displayedPixPayment.status}
            onCopy={handleCopyPix}
            onCreateAnother={handleCreatePix}
            isCreatingPix={createPix.isPending}
          />
        ) : null}

        <PaymentHistorySection
          isLoading={paymentsQuery.isLoading}
          isError={paymentsQuery.isError}
          payments={paymentsQuery.data ?? []}
        />
      </div>
    </DashboardShell>
  );
}

type CurrentParticipationCardProps = {
  participation: CurrentParticipation;
  isCreatingPix: boolean;
  pixError: string | null;
  onCreatePix: () => void;
};

function CurrentParticipationCard({
  participation,
  isCreatingPix,
  pixError,
  onCreatePix,
}: CurrentParticipationCardProps) {
  const periodLabel = formatPeriod(
    participation.period.referenceYear,
    participation.period.referenceMonth,
  );

  return (
    <div className="min-w-0 rounded-2xl border border-border bg-card p-6 shadow-sm shadow-primary/5 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-card-foreground sm:text-3xl">
            {periodLabel}
          </h2>
          <p className="mt-2 text-base leading-7 text-muted-foreground">
            Vigência até {formatPeriodEnd(participation.period.endsAt)}.
          </p>
        </div>
        <span
          className={cn(
            "inline-flex min-h-9 w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide",
            participation.active
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
              : "bg-muted text-muted-foreground",
          )}
        >
          {participation.active ? (
            <CheckCircle2 className="size-4" aria-hidden />
          ) : (
            <Clock3 className="size-4" aria-hidden />
          )}
          {participation.active ? "Participação ativa" : "Participação inativa"}
        </span>
      </div>

      <div className="mt-7 flex flex-col gap-5 border-t border-border pt-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-muted-foreground">Valor mensal</p>
          <p className="mt-1 text-3xl font-black text-card-foreground tabular-nums">
            {formatMoney(participation.period.participationFeeCents)}
          </p>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            Pagamento único via PIX para este período.
          </p>
        </div>

        {!participation.active ? (
          <Button
            type="button"
            size="lg"
            className="w-full rounded-xl font-bold sm:w-auto"
            onClick={onCreatePix}
            disabled={isCreatingPix}
          >
            <QrCode className="size-5" aria-hidden />
            {isCreatingPix ? "Gerando PIX..." : "Participar dos palpites"}
          </Button>
        ) : null}
      </div>

      {pixError ? (
        <div
          className="mt-5 flex items-start gap-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive"
          role="alert"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{pixError}</span>
        </div>
      ) : null}
    </div>
  );
}

type PixPaymentPanelProps = {
  sectionRef: RefObject<HTMLElement | null>;
  payment: PixPayment;
  status: PaymentStatus;
  onCopy: () => void;
  onCreateAnother: () => void;
  isCreatingPix: boolean;
};

function PixPaymentPanel({
  sectionRef,
  payment,
  status,
  onCopy,
  onCreateAnother,
  isCreatingPix,
}: PixPaymentPanelProps) {
  const isPending = status === "PENDING";
  const isPaid = status === "PAID";
  const isExpired = status === "EXPIRED";
  const isCancelled = status === "CANCELLED";
  const isFailed = status === "FAILED";
  const canRetry = isExpired || isCancelled || isFailed;
  const qrCodeImageSrc = toPixQrCodeImageSrc(payment.pixQrCode);

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      aria-labelledby="pix-payment-title"
      className="scroll-mt-24 rounded-2xl border border-border bg-card p-6 shadow-sm shadow-primary/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/20 sm:p-8"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2
            id="pix-payment-title"
            className="text-2xl font-extrabold text-card-foreground"
          >
            Pagamento via PIX
          </h2>
          <p className="mt-2 text-base leading-7 text-muted-foreground">
            {isPending
              ? "Aguardando confirmação automática do pagamento."
              : isPaid
                ? "Pagamento confirmado e participação ativada."
                : "Esta cobrança não está mais disponível para pagamento."}
          </p>
        </div>
        <PaymentStatusBadge status={status} />
      </div>

      {isPending ? (
        <div className="mt-7 grid gap-7 border-t border-border pt-7 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
          <div className="flex aspect-square items-center justify-center rounded-2xl bg-background p-4 ring-1 ring-border">
            {qrCodeImageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrCodeImageSrc}
                alt="QR Code PIX"
                className="size-full object-contain [image-rendering:pixelated]"
              />
            ) : (
              <div className="max-w-48 text-center text-muted-foreground">
                <QrCode className="mx-auto size-12" aria-hidden />
                <p className="mt-3 text-sm leading-6">
                  Use o código copia e cola ao lado para pagar.
                </p>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-bold text-foreground">PIX copia e cola</p>
            <textarea
              readOnly
              value={payment.pixCopyPaste ?? ""}
              aria-label="Código PIX copia e cola"
              className="mt-2 min-h-32 w-full resize-none rounded-xl border border-input bg-background p-4 text-sm leading-6 text-foreground outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
            />
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                Expira em {formatDateTime(payment.expiresAt)}.
              </p>
              <Button
                type="button"
                variant="outline"
                className="rounded-xl font-bold"
                onClick={onCopy}
                disabled={!payment.pixCopyPaste}
              >
                <Copy className="size-4" aria-hidden />
                Copiar código PIX
              </Button>
            </div>
          </div>
        </div>
      ) : isPaid ? (
        <div className="mt-7 flex items-start gap-4 rounded-2xl bg-accent/10 p-5 text-foreground">
          <CheckCircle2 className="mt-0.5 size-7 shrink-0 text-accent" aria-hidden />
          <div>
            <p className="font-bold">Participação ativa</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Você já pode registrar e alterar palpites deste período até o
              kickoff de cada partida.
            </p>
          </div>
        </div>
      ) : canRetry ? (
        <div className="mt-7 flex flex-col gap-4 rounded-2xl bg-muted p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-foreground">
              {isExpired
                ? "Pagamento expirado"
                : isCancelled
                  ? "Pagamento cancelado"
                  : "Pagamento não concluído"}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {isFailed
                ? "Não foi possível confirmar esta cobrança. Gere um novo PIX para tentar novamente."
                : "Gere um novo PIX para participar deste período."}
            </p>
          </div>
          <Button
            type="button"
            className="rounded-xl font-bold"
            onClick={onCreateAnother}
            disabled={isCreatingPix}
          >
            Gerar novo PIX
          </Button>
        </div>
      ) : null}
    </section>
  );
}

type PaymentHistorySectionProps = {
  isLoading: boolean;
  isError: boolean;
  payments: PaymentHistoryItem[];
};

function PaymentHistorySection({
  isLoading,
  isError,
  payments,
}: PaymentHistorySectionProps) {
  return (
    <section>
      <div className="flex items-center gap-3">
        <History className="size-6 text-accent" aria-hidden />
        <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">
          Histórico de pagamentos
        </h2>
      </div>

      {isLoading ? (
        <div className="mt-5">
          <LoadingCard rows={4} />
        </div>
      ) : isError ? (
        <div className="mt-5">
          <ErrorState
            icon={History}
            title="Histórico indisponível"
            description="Não foi possível carregar seus pagamentos agora."
          />
        </div>
      ) : payments.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-border bg-card p-6 text-center shadow-sm shadow-primary/5 sm:p-8">
          <WalletCards
            className="mx-auto size-9 text-muted-foreground"
            aria-hidden
          />
          <p className="mt-4 font-bold text-card-foreground">
            Nenhum pagamento registrado
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Suas cobranças PIX aparecerão aqui sem substituir meses anteriores.
          </p>
        </div>
      ) : (
        <div className="mt-5 min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-primary/5">
          <ul className="divide-y divide-border">
            {payments.map((payment) => (
              <li
                key={payment.id}
                className="flex min-w-0 flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
              >
                <div className="min-w-0">
                  <p className="text-lg font-extrabold text-card-foreground">
                    {formatPeriod(
                      payment.period.referenceYear,
                      payment.period.referenceMonth,
                    )}
                  </p>
                  <p className="mt-1 break-words text-sm text-muted-foreground">
                    Criado em {formatDateTime(payment.createdAt)}
                    {payment.paidAt
                      ? ` · Pago em ${formatDateTime(payment.paidAt)}`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <p className="text-lg font-black text-card-foreground tabular-nums">
                    {formatMoney(payment.amountCents)}
                  </p>
                  <PaymentStatusBadge status={payment.status} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide",
        statusClasses[status],
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

function formatMoney(amountCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amountCents / 100);
}

function formatPeriod(year: number, month: number) {
  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 15)));

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatPeriodEnd(endsAt: string) {
  const inclusiveEnd = new Date(new Date(endsAt).getTime() - 1);

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(inclusiveEnd);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}
