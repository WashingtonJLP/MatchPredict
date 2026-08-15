"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
    <section className="mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-lg flex-col justify-center px-4 py-20 sm:px-6">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-xl shadow-slate-950/5 sm:p-10">
        <p className="text-sm font-bold uppercase tracking-wide text-emerald-600">
          Entrar
        </p>
        <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl">
          Acesse sua conta
        </h1>
        <p className="mt-5 max-w-[650px] text-lg leading-8 text-slate-600">
          Entre para acompanhar seus palpites, estatísticas e posição no
          ranking.
        </p>

        <form className="mt-9 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <label className="block text-sm font-semibold text-slate-700">
            E-mail
            <input
              type="email"
              placeholder="voce@exemplo.com"
              className="mt-2 h-[52px] w-full rounded-2xl border border-input bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
              {...register("email")}
            />
            {errors.email ? (
              <span className="mt-2 block text-sm text-red-600">
                {errors.email.message}
              </span>
            ) : null}
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Senha
            <input
              type="password"
              placeholder="Sua senha"
              className="mt-2 h-[52px] w-full rounded-2xl border border-input bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
              {...register("password")}
            />
            {errors.password ? (
              <span className="mt-2 block text-sm text-red-600">
                {errors.password.message}
              </span>
            ) : null}
          </label>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-[52px] w-full rounded-2xl bg-slate-950 px-6 text-base font-semibold text-white shadow-sm transition hover:bg-slate-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="mt-7 text-sm leading-7 text-slate-600">
          Ainda não tem conta?{" "}
          <Link href="/register" className="font-semibold text-emerald-700">
            Criar Conta
          </Link>
        </p>
      </div>
    </section>
  );
}
