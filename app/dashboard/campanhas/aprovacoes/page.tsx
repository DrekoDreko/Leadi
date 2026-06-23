import { redirect } from "next/navigation";

export default function AdApprovalsPage() {
  // Aprovações e desempenho foram unificados em uma única página.
  redirect("/dashboard/desempenho?aba=aprovacoes");
}
