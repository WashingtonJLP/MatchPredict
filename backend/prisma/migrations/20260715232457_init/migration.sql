-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "FixtureStatus" AS ENUM ('NS', 'LIVE', 'FT', 'POSTPONED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WinnerType" AS ENUM ('HOME', 'AWAY', 'DRAW');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leagues" (
    "id" UUID NOT NULL,
    "api_league_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leagues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasons" (
    "id" UUID NOT NULL,
    "league_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" UUID NOT NULL,
    "api_team_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixtures" (
    "id" UUID NOT NULL,
    "api_fixture_id" INTEGER NOT NULL,
    "season_id" UUID NOT NULL,
    "home_team_id" UUID NOT NULL,
    "away_team_id" UUID NOT NULL,
    "round" INTEGER NOT NULL,
    "kickoff" TIMESTAMP(3) NOT NULL,
    "status" "FixtureStatus" NOT NULL DEFAULT 'NS',
    "home_goals" INTEGER,
    "away_goals" INTEGER,
    "winner_type" "WinnerType",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixtures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "fixture_id" UUID NOT NULL,
    "home_goals" INTEGER NOT NULL,
    "away_goals" INTEGER NOT NULL,
    "mvp_player_id" UUID,
    "score_points" INTEGER NOT NULL DEFAULT 0,
    "mvp_points" INTEGER NOT NULL DEFAULT 0,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "exact_score" BOOLEAN NOT NULL DEFAULT false,
    "correct_winner" BOOLEAN NOT NULL DEFAULT false,
    "correct_mvp" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "standings" (
    "id" UUID NOT NULL,
    "season_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "score_points" INTEGER NOT NULL DEFAULT 0,
    "mvp_points" INTEGER NOT NULL DEFAULT 0,
    "total_points" INTEGER NOT NULL DEFAULT 0,
    "exact_scores" INTEGER NOT NULL DEFAULT 0,
    "correct_winners" INTEGER NOT NULL DEFAULT 0,
    "correct_mvps" INTEGER NOT NULL DEFAULT 0,
    "wrong_predictions" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "standings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" UUID NOT NULL,
    "entity" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "message" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL,
    "finished_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "players" (
    "id" UUID NOT NULL,
    "api_player_id" INTEGER NOT NULL,
    "team_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "photo" TEXT,
    "position" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "leagues_api_league_id_key" ON "leagues"("api_league_id");

-- CreateIndex
CREATE INDEX "seasons_league_id_idx" ON "seasons"("league_id");

-- CreateIndex
CREATE UNIQUE INDEX "teams_api_team_id_key" ON "teams"("api_team_id");

-- CreateIndex
CREATE UNIQUE INDEX "fixtures_api_fixture_id_key" ON "fixtures"("api_fixture_id");

-- CreateIndex
CREATE INDEX "fixtures_season_id_idx" ON "fixtures"("season_id");

-- CreateIndex
CREATE INDEX "fixtures_home_team_id_idx" ON "fixtures"("home_team_id");

-- CreateIndex
CREATE INDEX "fixtures_away_team_id_idx" ON "fixtures"("away_team_id");

-- CreateIndex
CREATE INDEX "fixtures_kickoff_idx" ON "fixtures"("kickoff");

-- CreateIndex
CREATE INDEX "predictions_fixture_id_idx" ON "predictions"("fixture_id");

-- CreateIndex
CREATE INDEX "predictions_user_id_idx" ON "predictions"("user_id");

-- CreateIndex
CREATE INDEX "predictions_mvp_player_id_idx" ON "predictions"("mvp_player_id");

-- CreateIndex
CREATE UNIQUE INDEX "predictions_user_id_fixture_id_key" ON "predictions"("user_id", "fixture_id");

-- CreateIndex
CREATE INDEX "standings_season_id_idx" ON "standings"("season_id");

-- CreateIndex
CREATE UNIQUE INDEX "standings_season_id_user_id_key" ON "standings"("season_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "players_api_player_id_key" ON "players"("api_player_id");

-- CreateIndex
CREATE INDEX "players_team_id_idx" ON "players"("team_id");

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "leagues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixtures" ADD CONSTRAINT "fixtures_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_fixture_id_fkey" FOREIGN KEY ("fixture_id") REFERENCES "fixtures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_mvp_player_id_fkey" FOREIGN KEY ("mvp_player_id") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standings" ADD CONSTRAINT "standings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "standings" ADD CONSTRAINT "standings_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
