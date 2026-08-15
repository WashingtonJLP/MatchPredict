"use client";

import { Mail, Trophy, UserRound } from "lucide-react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { LoadingCard } from "@/components/shared/loading-card";
import { PageHeader } from "@/components/shared/page-header";
import { SectionTitle } from "@/components/shared/section-title";
import { StatCard } from "@/components/shared/stat-card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useStandings } from "@/hooks/use-standings";
import { useMe } from "@/hooks/use-user";
import { useAuth } from "@/providers/auth-provider";
import type { Standing } from "@/types/standing";

export default function DashboardPage() {
  const { user: authUser } = useAuth();
  const meQuery = useMe();
  const standingsQuery = useStandings();
  const user = meQuery.data ?? authUser;

  return (
    <DashboardShell>
      <div className="space-y-8">
        <PageHeader
          title="Dashboard"
          description="Acompanhe seu perfil e a classificacao geral da temporada ativa."
        />

        {meQuery.isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <LoadingCard rows={2} />
            <LoadingCard rows={2} />
            <LoadingCard rows={2} />
          </div>
        ) : meQuery.isError ? (
          <EmptyState
            icon={UserRound}
            title="Nao foi possivel carregar seu perfil"
            description="Tente recarregar a pagina ou entrar novamente."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              icon={UserRound}
              title="Nome"
              value={user?.name ?? "-"}
              description="Identificacao exibida na sua conta."
            />
            <StatCard
              icon={Mail}
              title="E-mail"
              value={user?.email ?? "-"}
              description="Canal principal da sua conta."
            />
            <StatCard
              icon={Trophy}
              title="Perfil"
              value={user?.role ?? "USER"}
              description="Resumo do perfil autenticado."
            />
          </div>
        )}

        <section id="ranking" className="space-y-5">
          <SectionTitle
            eyebrow="Ranking"
            title="Classificacao geral"
            description="Tabela responsiva com pontos, acertos e erros da temporada ativa."
          />

          {standingsQuery.isLoading ? (
            <LoadingCard rows={6} />
          ) : standingsQuery.isError ? (
            <EmptyState
              icon={Trophy}
              title="Ranking indisponivel"
              description="Nao foi possivel carregar a classificacao agora."
            />
          ) : !standingsQuery.data?.length ? (
            <EmptyState
              icon={Trophy}
              title="Sem dados de ranking"
              description="O ranking aparecera quando houver standings processados."
            />
          ) : (
            <DataTable<Standing>
              data={standingsQuery.data}
              getRowKey={(item) => item.userId}
              rowClassName={(item) =>
                item.userId === authUser?.id
                  ? "bg-accent/10 hover:bg-accent/10"
                  : "hover:bg-muted"
              }
              columns={[
                {
                  key: "position",
                  header: "Posicao",
                  render: (item) => (
                    <span className="font-semibold text-foreground">
                      #{item.position}
                    </span>
                  ),
                },
                {
                  key: "user",
                  header: "Usuario",
                  render: (item) => (
                    <div className="flex items-center gap-3">
                      <UserAvatar name={item.name} size="sm" />
                      <span className="font-medium text-foreground">
                        {item.name}
                      </span>
                    </div>
                  ),
                },
                {
                  key: "points",
                  header: "Pontos",
                  render: (item) => (
                    <span className="font-semibold text-accent">
                      {item.totalPoints}
                    </span>
                  ),
                },
                {
                  key: "exact",
                  header: "Placares exatos",
                  render: (item) => item.exactScores,
                },
                {
                  key: "winners",
                  header: "Acertos",
                  render: (item) => item.correctWinners,
                },
                {
                  key: "wrong",
                  header: "Erros",
                  render: (item) => item.wrongPredictions,
                },
              ]}
            />
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
