import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Payment database invariants', () => {
  const migration = readFileSync(
    join(
      process.cwd(),
      'prisma/migrations/20261005120000_add_monthly_participations/migration.sql',
    ),
    'utf8',
  );
  const schema = readFileSync(
    join(process.cwd(), 'prisma/schema.prisma'),
    'utf8',
  );

  it('impede duplicidade de Participation e de suas referÃªncias financeiras', () => {
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "participations_user_id_period_id_key"',
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "participations_payment_id_key"',
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "payments_provider_payment_id_key"',
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "payments_provider_event_id_key"',
    );
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "payments_provider_provider_reference_key"',
    );
  });

  it('permite no mÃ¡ximo um Payment PENDING por usuÃ¡rio/perÃ­odo', () => {
    expect(migration).toMatch(
      /CREATE UNIQUE INDEX "payments_one_pending_per_user_period_key"[\s\S]*ON "payments"\("user_id", "period_id"\)[\s\S]*WHERE "status" = 'PENDING';/,
    );
  });

  it('protege valores e limites do perÃ­odo no PostgreSQL', () => {
    expect(migration).toContain(
      'CONSTRAINT "payments_amount_check" CHECK ("amount_cents" > 0)',
    );
    expect(migration).toContain(
      'CONSTRAINT "participation_periods_reference_month_check" CHECK ("reference_month" BETWEEN 1 AND 12)',
    );
    expect(migration).toContain(
      'CONSTRAINT "participation_periods_dates_check" CHECK ("ends_at" > "starts_at")',
    );
  });

  it('preserva histÃ³rico financeiro com foreign keys RESTRICT', () => {
    expect(
      migration.match(/ON DELETE RESTRICT ON UPDATE CASCADE/g),
    ).toHaveLength(5);
  });

  it('mantÃ©m schema Prisma alinhado aos identificadores Asaas', () => {
    for (const field of [
      'providerPaymentId',
      'providerReference',
      'providerEventId',
      'providerCreationStartedAt',
      'pixCopyPaste',
      'pixQrCode',
      'expiresAt',
    ]) {
      expect(schema).toContain(field);
    }
  });
});
