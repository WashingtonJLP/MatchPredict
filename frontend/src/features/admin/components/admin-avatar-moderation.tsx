"use client";

import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogCloseButton } from "@/components/ui/dialog";
import { createSingleFlight } from "@/features/admin/single-flight";
import { useRemoveAdminUserAvatar } from "@/hooks/use-admin";
import { getApiErrorMessage } from "@/lib/api-error";

export function AdminAvatarModeration({
  user,
}: {
  user: { id: string; name: string; avatarUrl: string | null };
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const removal = useRemoveAdminUserAvatar();
  const flight = useRef(createSingleFlight()).current;
  function changeOpen(value: boolean) {
    if (!removal.isPending) {
      setOpen(value);
      if (value) setError(null);
    }
  }
  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await flight.run(async () => {
      setError(null);
      try {
        await removal.mutateAsync(user.id);
        setOpen(false);
        toast.success("Foto de perfil removida e auditoria registrada.");
      } catch (cause) {
        const message = getApiErrorMessage(
          cause,
          "Não foi possível remover a foto. Tente novamente.",
        );
        setError(message);
        toast.error(message);
      }
    });
  }
  return (
    <div className="space-y-3 sm:max-w-48">
      <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="lg" />
      {user.avatarUrl ? (
        <Button
          type="button"
          variant="outline"
          className="min-h-11 h-auto whitespace-normal text-left"
          disabled={removal.isPending}
          onClick={() => changeOpen(true)}
        >
          Remover foto de perfil
        </Button>
      ) : null}
      <Dialog
        open={open}
        onOpenChange={changeOpen}
        titleId="remove-avatar-title"
        className="max-w-lg"
      >
        <form onSubmit={confirm} aria-busy={removal.isPending}>
          <div className="flex items-start justify-between gap-4">
            <h2
              id="remove-avatar-title"
              className="text-2xl font-extrabold text-popover-foreground"
            >
              Remover foto de perfil?
            </h2>
            <DialogCloseButton onClick={() => changeOpen(false)} />
          </div>
          <p className="mt-3 break-words text-sm leading-6 text-muted-foreground">
            A foto de {user.name} será removida e as iniciais voltarão a
            aparecer. A ação será registrada na auditoria. O usuário poderá
            enviar uma nova foto pelo próprio perfil.
          </p>
          {error ? (
            <p role="alert" className="mt-4 text-sm leading-6 text-destructive">
              {error}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              data-dialog-initial-focus
              variant="outline"
              disabled={removal.isPending}
              onClick={() => changeOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={removal.isPending}
            >
              {removal.isPending ? "Removendo…" : "Remover foto"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
