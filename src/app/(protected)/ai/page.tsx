import { AIAssistantView } from "@/components/ai/ai-assistant-view";

import { Metadata } from "next";
import { getChatSession } from "@/lib/ai/chat-db-actions";

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  
  if (params.conversationId) {
    const response = await getChatSession(params.conversationId);
    if (response.success && response.session) {
      return {
        title: `${response.session.title} - Trợ lý AI`,
      };
    }
  }

  return {
    title: "Trò chuyện mới - Trợ lý AI",
  };
}

interface PageProps {
  searchParams: Promise<{ conversationId?: string }>;
}

const Page = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  return (
    <div className="h-full w-full bg-background flex flex-col">
      <AIAssistantView
        context="page"
        initialConversationId={params.conversationId}
      />
    </div>
  );
};

export default Page;
