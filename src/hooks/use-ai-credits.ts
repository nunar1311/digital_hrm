"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

interface AICreditsData {
  credits: number;
  totalTokensUsed: number;
  lastResetAt: string | null;
}

async function fetchUserCredits(): Promise<AICreditsData> {
  const res = await fetch("/api/user/credits");
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to fetch credits");
  }
  const data = await res.json();
  return data.data;
}

export function useAiCredits() {
  return useQuery<AICreditsData, Error>({
    queryKey: ["ai-credits"],
    queryFn: fetchUserCredits,
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
    retry: 1,
  });
}

export function useAiCreditsActions() {
  const queryClient = useQueryClient();

  const refetchCredits = () => {
    queryClient.invalidateQueries({ queryKey: ["ai-credits"] });
  };

  const setCredits = (credits: number) => {
    queryClient.setQueryData<AICreditsData>(["ai-credits"], (old) => {
      if (!old) return old;
      return { ...old, credits };
    });
  };

  return { refetchCredits, setCredits };
}
