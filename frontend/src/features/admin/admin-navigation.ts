import {
  LayoutDashboard,
  ReceiptText,
  ScrollText,
  ShieldAlert,
  UsersRound,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

export type AdminNavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const adminNavigationItems: AdminNavigationItem[] = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard },
  { href: "/admin/users", label: "Usuários", icon: UsersRound },
  { href: "/admin/payments", label: "Pagamentos", icon: ReceiptText },
  {
    href: "/admin/participations",
    label: "Participações",
    icon: WalletCards,
  },
  { href: "/admin/reviews", label: "Pendências", icon: ShieldAlert },
  { href: "/admin/audit", label: "Auditoria", icon: ScrollText },
];

export function isAdminRouteActive(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}
