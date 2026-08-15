import Link from "next/link";

export default function LoginPage() {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col px-4 py-16 sm:px-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm font-semibold uppercase text-emerald-600">
          Entrar
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">
          Acesse sua conta
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Tela base preparada para a sprint de autenticacao.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            E-mail
            <input
              type="email"
              placeholder="voce@example.com"
              className="mt-2 h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Senha
            <input
              type="password"
              placeholder="Sua senha"
              className="mt-2 h-10 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>
          <button
            type="button"
            disabled
            className="h-10 w-full rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Entrar
          </button>
        </div>

        <p className="mt-5 text-sm text-slate-600">
          Ainda nao tem conta?{" "}
          <Link href="/register" className="font-semibold text-emerald-700">
            Criar Conta
          </Link>
        </p>
      </div>
    </section>
  );
}
