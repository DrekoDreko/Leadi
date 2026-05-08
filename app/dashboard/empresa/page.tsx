import { redirect } from "next/navigation";

export default function EmpresaPage() {
  redirect("/dashboard/perfil?section=empresa");
}
