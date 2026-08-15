"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  loginSchema,
  type LoginFormData,
} from "@/features/auth/auth-schemas";
import { useAuth } from "@/providers/auth-provider";

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormData) {
    setError(null);

    try {
      await login(data);
    } catch {
      setError("Não foi possível entrar. Verifique suas credenciais.");
    }
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-lg flex-col justify-center px-4 py-10 sm:px-6 sm:py-16 lg:py-20">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xl sm:p-8 lg:p-10">
        <p className="text-sm font-semibold text-accent">
          Entrar
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-card-foreground sm:text-4xl">
          Acesse sua conta
        </h1>
        <p className="mt-4 max-w-[650px] text-base leading-7 text-muted-foreground sm:mt-5 sm:text-lg sm:leading-8">
          Entre para acompanhar seus palpites, estatísticas e posição no
          ranking.
        </p>

        <form className="mt-8 space-y-5 sm:mt-9 sm:space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <label className="block text-sm font-medium text-foreground">
            E-mail
            <input
              type="email"
              placeholder="voce@exemplo.com"
              className="mt-2 h-[52px] w-full rounded-xl border border-input bg-background px-4 text-base font-normal text-foreground outline-none transition placeholder:text-muted-foreground hover:border-border focus:border-ring focus:ring-4 focus:ring-ring/15"
              {...register("email")}
            />
            {errors.email ? (
              <span className="mt-2 block text-sm text-destructive">
                {errors.email.message}
              </span>
            ) : null}
          </label>

          <label className="block text-sm font-medium text-foreground">
            Senha
            <span className="relative mt-2 block">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Sua senha"
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

          {error ? (
            <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[52px] w-full rounded-xl bg-primary px-6 text-base font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/80 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-7 text-sm leading-7 text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link href="/register" className="font-semibold text-accent">
            Criar Conta
          </Link>
        </p>
      </div>
    </section>
  );
}
