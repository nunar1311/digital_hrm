"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

const PortalContainerContext = createContext<HTMLElement | null>(null);

export function usePortalContainer() {
  return useContext(PortalContainerContext);
}

interface PortalContainerProviderProps {
  children: ReactNode;
  container: HTMLElement | null;
}

export function PortalContainerProvider({
  children,
  container,
}: PortalContainerProviderProps) {
  return (
    <PortalContainerContext.Provider value={container}>
      {children}
    </PortalContainerContext.Provider>
  );
}
