import type { Lead } from "@/data/mock";
import { getLeadStageValue } from "./stages";

export function hasLeadRecordedFirstContact(lead: Pick<Lead, "hasRecordedContact">) {
  return lead.hasRecordedContact === true;
}

export function isLeadPendingFirstContact(lead: Pick<Lead, "stage" | "hasRecordedContact">) {
  return getLeadStageValue(lead.stage) === "new" && !hasLeadRecordedFirstContact(lead);
}

export function sortLeadsByFirstContactPriority(leads: Lead[]) {
  return [...leads].sort((left, right) => {
    const weightDifference = getLeadFirstContactSortWeight(left) - getLeadFirstContactSortWeight(right);

    if (weightDifference !== 0) {
      return weightDifference;
    }

    return 0;
  });
}

function getLeadFirstContactSortWeight(lead: Pick<Lead, "stage" | "hasRecordedContact">) {
  const stageValue = getLeadStageValue(lead.stage);

  if (stageValue === "new" && !lead.hasRecordedContact) {
    return 0;
  }

  if (stageValue === "new" && lead.hasRecordedContact) {
    return 2;
  }

  return 1;
}
