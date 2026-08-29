import { UserRound } from "lucide-react";

type UserAvatarProps = {
  name?: string | null;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
};

export function UserAvatar({ name, size = "md" }: UserAvatarProps) {
  const initials = name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <span
      className={`${sizeClasses[size]} flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground`}
    >
      {initials || <UserRound className="size-4" aria-hidden />}
    </span>
  );
}
