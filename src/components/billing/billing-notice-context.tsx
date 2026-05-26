"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";

const DashboardBillingNoticeContext = createContext(false);

export function DashboardBillingNoticeProvider({
  children,
  hasSubscriptionNotice
}: {
  children: ReactNode;
  hasSubscriptionNotice: boolean;
}) {
  return (
    <DashboardBillingNoticeContext.Provider value={hasSubscriptionNotice}>
      {children}
    </DashboardBillingNoticeContext.Provider>
  );
}

export function useDashboardBillingNotice() {
  return useContext(DashboardBillingNoticeContext);
}
