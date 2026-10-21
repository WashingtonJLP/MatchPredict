"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-error";
import { uploadAvatar, removeAvatar } from "@/services/user-service";
import type { User } from "@/types/auth";

export function AvatarEditor({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const input = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  const [action, setAction] = useState<"upload" | "remove" | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    error: boolean;
    message: string;
  } | null>(null);

  async function change(file?: File) {
    if (busy.current) return;
    setFeedback(null);
    if (
      file &&
      (!file.size ||
        file.size > 5 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(file.type))
    ) {
      setFeedback({
        error: true,
        message:
          "Selecione uma imagem JPEG, PNG ou WebP não vazia de até 5 MB.",
      });
      return;
    }
    busy.current = true;
    setAction(file ? "upload" : "remove");
    const objectUrl = file ? URL.createObjectURL(file) : null;
    setPreview(objectUrl);
    try {
      const result = file ? await uploadAvatar(file) : await removeAvatar();
      // Update both profile and authenticated shell immediately, without polling.
      for (const key of [
        ["users", "me"],
        ["auth", "me"],
      ]) {
        queryClient.setQueryData<User>(key, (previous) =>
          previous ? { ...previous, ...result } : { ...user, ...result },
        );
      }
      for (const key of [["standings"], ["rounds", "stats"]]) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
      const message = file
        ? "Foto atualizada com sucesso."
        : "Foto removida com sucesso.";
      setFeedback({ error: false, message });
      toast.success(message);
    } catch (error) {
      setFeedback({
        error: true,
        message: getApiErrorMessage(
          error,
          "Não foi possível alterar a foto. Tente novamente.",
        ),
      });
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setPreview(null);
      setAction(null);
      busy.current = false;
    }
  }

  return (
    <div className="space-y-3" aria-busy={Boolean(action)}>
      <UserAvatar
        name={user.name}
        avatarUrl={preview ?? user.avatarUrl}
        size="lg"
      />
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Selecionar foto de perfil"
        className="sr-only"
        tabIndex={-1}
        disabled={Boolean(action)}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = "";
          if (file) void change(file);
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          className="min-h-11"
          variant="outline"
          disabled={Boolean(action)}
          onClick={() => input.current?.click()}
        >
          {action === "upload" ? "Enviando..." : "Alterar foto"}
        </Button>
        {user.avatarUrl ? (
          <Button
            type="button"
            className="min-h-11"
            variant="ghost"
            disabled={Boolean(action)}
            onClick={() => void change()}
          >
            {action === "remove" ? "Removendo..." : "Remover foto"}
          </Button>
        ) : null}
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        JPEG, PNG ou WebP. Até 5 MB. A foto será pública nas classificações.
      </p>
      {feedback ? (
        <p
          role={feedback.error ? "alert" : "status"}
          className={`text-sm leading-6 ${feedback.error ? "text-destructive" : "text-foreground"}`}
        >
          {feedback.message}
        </p>
      ) : null}
    </div>
  );
}
