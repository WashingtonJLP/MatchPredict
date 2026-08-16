"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/features/auth/auth-schemas";
import { getApiErrorMessage } from "@/lib/api-error";
import { forgotPassword } from "@/services/auth-service";

const successMessage =
  "Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    setError(null);

    try {
      await forgotPassword(data);
      setSubmitted(true);
      toast.success("Solicitação enviada.");
    } catch (err) {
      const message = getApiErrorMessage(
        err,
        "Nao foi possivel enviar o link. Tente novamente.",
      );
      setError(message);
      toast.error(message);
    }
  }

  return (
    <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-xl flex-col justify-center px-4 py-8 sm:px-6 sm:py-14 lg:py-20">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-primary/10 sm:p-8 lg:p-10">
        {submitted ? (
          <>
            <p className="text-sm font-bold uppercase tracking-wide text-accent">
              Verifique seu e-mail
            </p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight text-card-foreground sm:text-4xl">
              Link solicitado
            </h1>
            <p className="mt-5 max-w-[650px] text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              {successMessage}
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex h-[52px] w-full items-center justify-center rounded-xl bg-primary px-6 text-base font-bold text-primary-foreground shadow-sm transition hover:bg-primary/80 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              Voltar para o login
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm font-bold uppercase tracking-wide text-accent">
              Recuperar senha
            </p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight text-card-foreground sm:text-4xl">
              Redefina seu acesso
            </h1>
            <p className="mt-4 max-w-[650px] text-base leading-7 text-muted-foreground sm:mt-5 sm:text-lg sm:leading-8">
              Informe seu e-mail para receber o link de redefinição de senha.
            </p>

            <form
              className="mt-8 space-y-5 sm:mt-9 sm:space-y-6"
              onSubmit={handleSubmit(onSubmit)}
            >
              <label className="block text-base font-semibold text-foreground">
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

              {error ? (
                <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="h-[52px] w-full rounded-xl bg-primary px-6 text-base font-bold text-primary-foreground shadow-sm transition hover:bg-primary/80 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Enviando..." : "Enviar link"}
              </button>
            </form>

            <p className="mt-7 text-base leading-7 text-muted-foreground">
              Lembrou sua senha?{" "}
              <Link href="/login" className="font-semibold text-accent">
                Entrar
              </Link>
            </p>
          </>
        )}
      </div>
    </section>
  );
}
