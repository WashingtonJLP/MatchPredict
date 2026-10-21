"use client";

import { useState } from "react";
import { UserRound } from "lucide-react";

type UserAvatarProps = {
  name?: string | null;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
};

const sizeClasses = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
};

export function UserAvatar({ name, avatarUrl, size = "md" }: UserAvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const initials = name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <span
      className={`${sizeClasses[size]} flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary font-semibold text-primary-foreground`}
      role="img"
      aria-label={`Foto de ${name || "usuário"}`}
    >
      {avatarUrl && avatarUrl !== failedUrl ? (
        // Public, environment-configurable storage URL; no Next image proxy required.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          className="size-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailedUrl(avatarUrl)}
        />
      ) : (
        initials || <UserRound className="size-4" aria-hidden />
      )}
    </span>
  );
}
