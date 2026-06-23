import { redirect } from "next/navigation";

// A escolha de plano (/onboarding/plans) substituiu a antiga tela
// Consultor/Supervisor. Mantemos esta rota como redirect para nao quebrar
// links antigos.
export default function ProfileSetupRedirectPage() {
  redirect("/onboarding/plans");
}
