import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Link2 } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type InvitePageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  if (!isSupabaseConfigured()) {
    return <InviteMessage title="Supabase nao configurado" message="Configure o Supabase para aceitar convites reais." />;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/invite/${encodeURIComponent(token)}&mode=signup`);
  }

  const { error } = await supabase
    .rpc("accept_workspace_invite", { invite_token: token })
    .single();

  if (error) {
    return (
      <InviteMessage
        title="Convite indisponivel"
        message="Este convite nao foi encontrado, ja foi usado ou expirou. Peca um novo link para o owner ou admin da equipe."
      />
    );
  }

  redirect("/dashboard");
}

function InviteMessage({ title, message }: { title: string; message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="glass-strong w-full max-w-xl rounded-[34px] p-6 sm:p-8">
        <BrandMark />
        <div className="mt-10 flex h-12 w-12 items-center justify-center rounded-full bg-lagoon text-white">
          <Link2 size={21} aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold">{title}</h1>
        <p className="mt-4 leading-7 text-ink/62">{message}</p>
        <Link
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-cloud"
          href="/dashboard"
        >
          <CheckCircle2 size={17} aria-hidden="true" />
          Ir para o dashboard
        </Link>
      </section>
    </main>
  );
}
