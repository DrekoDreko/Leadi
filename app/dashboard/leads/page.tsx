import { LeadsWorkspace } from "./leads-workspace";
import { getLeadsForCurrentUser } from "@/lib/leads/repository";

export default async function LeadsPage() {
  const leadState = await getLeadsForCurrentUser();

  return <LeadsWorkspace leadState={leadState} />;
}
