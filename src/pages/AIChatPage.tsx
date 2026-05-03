import { useState } from "react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/Api";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

type BackendChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type AiChatResponse = {
  message?: string;
  content?: string;
  response?: string;
  error?: string;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return "AI chat failed. Please try again.";
};

const AIChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hello! I'm FleetBot, your AI assistant for fleet management. I can help you with vehicle maintenance, scheduling, work orders, inspections, documents, and more. What would you like to know?",
      timestamp: new Date(),
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = async (content: string) => {
    const trimmedContent = content.trim();

    if (!trimmedContent || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedContent,
      timestamp: new Date(),
    };

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setIsLoading(true);

    try {
      const requestMessages: BackendChatMessage[] = nextMessages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await api.post<AiChatResponse>("/ai/chat", {
        messages: requestMessages,
      });

      const responseData = response.data;

      if (responseData?.error) {
        throw new Error(responseData.error);
      }

      const assistantContent =
        responseData.message ??
        responseData.content ??
        responseData.response ??
        "";

      if (!assistantContent.trim()) {
        throw new Error("AI returned an empty response.");
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: assistantContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending AI chat message:", error);

      const errorMessage = getErrorMessage(error);

      toast({
        title: "AI Chat Error",
        description: errorMessage,
        variant: "destructive",
      });

      const assistantErrorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          "Sorry, I could not connect to FleetBot right now. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantErrorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      <ChatHeader />
      <MessageList messages={messages} isLoading={isLoading} />
      <ChatInput onSendMessage={sendMessage} disabled={isLoading} />
    </div>
  );
};

export default AIChatPage;