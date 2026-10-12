export type AdminPageMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminPage<T> = {
  data: T[];
  meta: AdminPageMeta;
};

export type AdminPeriod = {
  id: string;
  referenceYear: number;
  referenceMonth: number;
  status: "OPEN" | "CLOSED";
  startsAt: string;
  endsAt: string;
};

export type AdminAuditAction =
  "USER_DELETED" | "USER_DISABLED" | "USER_REACTIVATED";

export type AdminAuditLog = {
  id: string;
  action: AdminAuditAction;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  adminUser: { id: string; name: string; email?: string };
};

export type AdminDashboard = {
  period: {
    referenceYear: number;
    referenceMonth: number;
    startsAt: string;
    endsAt: string;
  };
  registeredUsers: number;
  activeParticipations: number;
  receivedPayments: number;
  receivedAmountCents: number;
  financialReviews: number;
  recentActivity: AdminAuditLog[];
};

export type PaymentStatus =
  "PENDING" | "PAID" | "EXPIRED" | "CANCELLED" | "FAILED";

export type ParticipationStatus = "ACTIVE" | "CANCELLED";

export type AdminUserSummary = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  disabledAt: string | null;
  createdAt: string;
  currentParticipation: {
    status: ParticipationStatus;
    activatedAt: string;
  } | null;
  currentPayment: {
    status: PaymentStatus;
    amountCents: number;
    paidAt: string | null;
  } | null;
};

export type AdminPayment = {
  id: string;
  amountCents: number;
  currency: string;
  method: "PIX";
  status: PaymentStatus;
  provider: string;
  expiresAt: string | null;
  paidAt: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
  period: AdminPeriod;
  participation: { id: string; status: ParticipationStatus } | null;
};

export type AdminParticipation = {
  id: string;
  status: ParticipationStatus;
  activatedAt: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  period: AdminPeriod;
  payment: {
    id: string;
    status: PaymentStatus;
    amountCents: number;
    paidAt: string | null;
  } | null;
};

export type AdminFinancialReview = AdminPayment & {
  reviewCode:
    "PAID_WITHOUT_PARTICIPATION" | "PAID_WITHOUT_ACTIVE_PARTICIPATION";
};

export type AdminUserDetail = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  avatarUrl: string | null;
  disabledAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    predictions: number;
    standings: number;
    participations: number;
    payments: number;
    adminAuditLogs: number;
  };
  participations: Array<Omit<AdminParticipation, "user">>;
  payments: Omit<AdminPayment, "user" | "participation">[];
  standings: Array<{
    id: string;
    position: number;
    totalPoints: number;
    exactScores: number;
    correctWinners: number;
    season: {
      id: string;
      name: string;
      year: number;
      isActive: boolean;
    };
  }>;
};

export type AdminDeletionImpact = {
  user: Pick<
    AdminUserDetail,
    "id" | "name" | "email" | "role" | "disabledAt" | "createdAt"
  >;
  counts: {
    predictions: number;
    standings: number;
    participations: number;
    payments: number;
    adminAuditLogs: number;
  };
  paymentStatusCounts: Partial<Record<PaymentStatus, number>>;
  blockers: Array<{ code: string; message: string }>;
  canDelete: boolean;
  fallbackAction: "DISABLE" | null;
};
