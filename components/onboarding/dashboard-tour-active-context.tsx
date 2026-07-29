"use client";

import { createContext, useContext } from "react";

const DashboardTourActiveContext = createContext(false);

export function DashboardTourActiveProvider({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <DashboardTourActiveContext.Provider value={active}>
      {children}
    </DashboardTourActiveContext.Provider>
  );
}

export function useDashboardTourActive() {
  return useContext(DashboardTourActiveContext);
}
