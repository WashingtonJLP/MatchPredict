import { Role } from '@prisma/client';

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  disabledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
  authVersion?: number;
};
