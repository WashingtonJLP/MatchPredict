import assert from "node:assert/strict";
import test from "node:test";

import {
  adminNavigationItems,
  isAdminRouteActive,
} from "./admin-navigation.ts";

test("mantem uma unica fonte com todas as rotas administrativas", () => {
  assert.deepEqual(
    adminNavigationItems.map(({ href, label }) => ({ href, label })),
    [
      { href: "/admin", label: "Visão geral" },
      { href: "/admin/users", label: "Usuários" },
      { href: "/admin/payments", label: "Pagamentos" },
      { href: "/admin/participations", label: "Participações" },
      { href: "/admin/reviews", label: "Pendências" },
      { href: "/admin/audit", label: "Auditoria" },
    ],
  );
});

test("identifica a rota atual inclusive no detalhe de usuario", () => {
  assert.equal(isAdminRouteActive("/admin", "/admin"), true);
  assert.equal(isAdminRouteActive("/admin/users", "/admin"), false);
  assert.equal(
    isAdminRouteActive("/admin/users/user-id", "/admin/users"),
    true,
  );
  assert.equal(
    isAdminRouteActive("/admin/participations", "/admin/payments"),
    false,
  );
  assert.equal(isAdminRouteActive("/admin/users-archive", "/admin/users"), false);
});
