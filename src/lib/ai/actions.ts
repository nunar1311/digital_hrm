"use server";

export async function chatWithAI(messages: { role: string; content: string }[]) {
  const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
  const AI_SERVICE_KEY = process.env.AI_SERVICE_KEY || "";

  try {
    const response = await fetch(`${AI_SERVICE_URL}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(AI_SERVICE_KEY ? { "X-Internal-API-Key": AI_SERVICE_KEY } : {}),
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
        throw new Error(`AI Service Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Chat AI Server Action Error:", error);
    return { success: false, error: error.message };
  }
}
