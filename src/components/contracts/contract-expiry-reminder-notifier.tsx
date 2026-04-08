"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { triggerContractExpiryReminderCheck } from "@/app/(protected)/contracts/actions";

const STORAGE_KEY = "contract-expiry-check-last-run";
const THROTTLE_MINUTES = 30;

function shouldRunNow(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return true;
  }

  const lastRun = Number(raw);
  if (Number.isNaN(lastRun)) {
    return true;
  }

  return Date.now() - lastRun > THROTTLE_MINUTES * 60 * 1000;
}

function markRun() {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, String(Date.now()));
}

export function ContractExpiryReminderNotifier() {
  const enabled = useMemo(() => shouldRunNow(), []);

  useQuery({
    queryKey: ["contracts", "expiry-reminder-fallback"],
    queryFn: async () => {
      const result = await triggerContractExpiryReminderCheck();
      markRun();
      return result;
    },
    enabled,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });

  return null;
}
