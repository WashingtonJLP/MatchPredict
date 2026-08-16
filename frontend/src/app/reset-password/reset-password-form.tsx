"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  passwordRequirements,
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/features/auth/auth-schemas";
import { getApiErrorMessage } from "@/lib/api-error";
import { resetPassword } from "@/services/auth-service";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    formState: { errors, isSubmitting, isValid },
    handleSubmit,
    register,
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });
  const password = watch("password");
  const passwordChecks = useMemo(
    () =>
      passwordRequirements.map((requirement) => ({
        label: requirement.label,
        valid: requirement.validate(password),
      })),
    [password],
  );

  async function onSubmit(data: ResetPasswordFormData) {
    if (!token) {
      const message = "Token inválido.";
      setError(message);
      toast.error(message);
      return;
    }

    setError(null);

    try {
      await resetPassword({
        token,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });
      toast.success("Senha alterada com sucesso.");
      router.push("/login");
    } catch (err) {
      const message = getApiErrorMessage(
        err,
        "Nao foi possivel redefinir sua senha.",
      );
      setError(message);
      toast.error(message);
    }
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-xl flex-col justify-center px-4 py-8 sm:px-6 sm:py-14 lg:py-20">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-primary/10 sm:p-8 lg:p-10">
        <p className="text-sm font-bold uppercase tracking-wide text-accent">
          Nova senha
        </p>
        <h1 className="mt-3 text-3xl font-extrabold leading-tight text-card-foreground sm:text-4xl">
          Redefinir senha
        </h1>
        <p className="mt-4 max-w-[650px] text-base leading-7 text-muted-foreground sm:mt-5 sm:text-lg sm:leading-8">
          Crie uma nova senha para acessar sua conta MatchPredict.
        </p>

        {!token ? (
          <p className="mt-6 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Token inválido. Solicite um novo link de recuperação.
          </p>
        ) : null}

        <form
          className="mt-8 space-y-5 sm:mt-9 sm:space-y-6"
          onSubmit={handleSubmit(onSubmit)}
        >
          <label className="block text-base font-semibold text-foreground">
            Nova senha
            <span className="relative mt-2 block">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="NovaSenha123"
                className="h-[52px] w-full rounded-xl border border-input bg-background px-4 pr-12 text-base font-normal text-foreground outline-none transition placeholder:text-muted-foreground hover:border-border focus:border-ring focus:ring-4 focus:ring-ring/15"
                {...register("password")}
              />
              <button
                type="button"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                className="absolute right-1.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? (
                  <EyeOff className="size-5" aria-hidden />
                ) : (
                  <Eye className="size-5" aria-hidden />
                )}
              </button>
            </span>
            {errors.password ? (
              <span className="mt-2 block text-sm text-destructive">
                {errors.password.message}
              </span>
            ) : null}
          </label>

          <div className="grid gap-2 rounded-xl border border-border bg-muted/50 p-4 text-sm sm:grid-cols-2">
            {passwordChecks.map((check) => (
              <span
                key={check.label}
                className={
                  check.valid ? "font-medium text-accent" : "text-muted-foreground"
                }
              >
                {check.valid ? "✓" : "-"} {check.label}
              </span>
            ))}
          </div>

          <label className="block text-base font-semibold text-foreground">
            Confirmar senha
            <span className="relative mt-2 block">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirme sua nova senha"
                className="h-[52px] w-full rounded-xl border border-input bg-background px-4 pr-12 text-base font-normal text-foreground outline-none transition placeholder:text-muted-foreground hover:border-border focus:border-ring focus:ring-4 focus:ring-ring/15"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                aria-label={
                  showConfirmPassword ? "Ocultar senha" : "Mostrar senha"
                }
                className="absolute right-1.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setShowConfirmPassword((current) => !current)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-5" aria-hidden />
                ) : (
                  <Eye className="size-5" aria-hidden />
                )}
              </button>
            </span>
            {errors.confirmPassword ? (
              <span className="mt-2 block text-sm text-destructive">
                {errors.confirmPassword.message}
              </span>
            ) : null}
          </label>

          {error ? (
            <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting || !isValid || !token}
            className="h-[52px] w-full rounded-xl bg-primary px-6 text-base font-bold text-primary-foreground shadow-sm transition hover:bg-primary/80 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Redefinindo..." : "Redefinir senha"}
          </button>
        </form>

        <p className="mt-7 text-base leading-7 text-muted-foreground">
          Precisa de outro link?{" "}
          <Link href="/forgot-password" className="font-semibold text-accent">
            Solicitar novamente
          </Link>
        </p>
      </div>
    </section>
  );
}
