import { Suspense } from "react";

import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-xl flex-col justify-center px-4 py-8 sm:px-6 sm:py-14 lg:py-20">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xl shadow-primary/10 sm:p-8 lg:p-10">
            <div className="h-8 w-48 rounded-lg bg-muted" />
            <div className="mt-5 h-20 rounded-xl bg-muted" />
          </div>
        </section>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
