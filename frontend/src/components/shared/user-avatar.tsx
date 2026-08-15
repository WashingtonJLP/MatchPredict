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
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-slate-950 font-semibold text-white`}
    >
      {initials || <UserRound className="size-4" aria-hidden />}
    </span>
  );
}
