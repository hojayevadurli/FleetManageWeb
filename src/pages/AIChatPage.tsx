
import { useState } from "react";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { MessageList } from "@/components/chat/MessageList";
import { ChatInput } from "@/components/chat/ChatInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m FleetBot, your AI assistant for fleet management. I can help you with vehicle maintenance, scheduling, work orders, inspections, and more. What would you like to know?',
      timestamp: new Date(),
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      console.log('Sending message to AI chat function');
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to call AI chat function');
      }

      console.log('AI chat function response received');

      // Check if the response is a stream or error
      if (data instanceof Response) {
        const contentType = data.headers.get('content-type');
        
        if (contentType?.includes('text/event-stream')) {
          // Handle streaming response
          const reader = data.body?.getReader();
          const decoder = new TextDecoder();
          let assistantMessage = '';

          const assistantMessageObj: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '',
            timestamp: new Date(),
          };

          setMessages(prev => [...prev, assistantMessageObj]);

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value);
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.content) {
                      assistantMessage += parsed.content;
                      setMessages(prev => 
                        prev.map(msg => 
                          msg.id === assistantMessageObj.id 
                            ? { ...msg, content: assistantMessage }
                            : msg
                        )
                      );
                    }
                  } catch (e) {
                    // Skip invalid JSON
                  }
                }
              }
            }
          }
        } else {
          // Handle JSON error response
          const errorData = await data.json();
          throw new Error(errorData.error || 'Unknown error occurred');
        }
      } else if (data && typeof data === 'object' && data.error) {
        // Handle direct error response
        const errorData = data as { error: string; errorType?: string; statusCode?: number };
        
        // Show specific toast messages for different error types
        if (errorData.errorType === 'invalid_api_key' || errorData.errorType === 'authentication_failed') {
          toast({
            title: "API Key Issue",
            description: "Your OpenAI API key appears to be invalid. Please check your API key configuration.",
            variant: "destructive",
          });
        } else if (errorData.errorType === 'rate_limit_exceeded') {
          toast({
            title: "Rate Limit Exceeded",
            description: "You've exceeded your OpenAI API usage limits. Please wait and try again.",
            variant: "destructive",
          });
        } else if (errorData.errorType === 'access_forbidden') {
          toast({
            title: "Access Forbidden",
            description: "Please check your OpenAI account status and billing information.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Connection Error",
            description: errorData.error || "Failed to connect to AI service.",
            variant: "destructive",
          });
        }
        
        throw new Error(errorData.error);
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      
      // Check for specific error types
      if (error.message?.includes('429') || error.message?.includes('rate limit')) {
        errorMessage = 'I\'m currently experiencing high demand. Please wait a moment and try again, or check your OpenAI API usage limits.';
      } else if (error.message?.includes('401') || error.message?.includes('unauthorized') || error.message?.includes('Authentication failed')) {
        errorMessage = 'There seems to be an authentication issue with the API. Please check your API key configuration.';
      } else if (error.message?.includes('OpenAI API key not configured')) {
        errorMessage = 'The OpenAI API key is not properly configured. Please contact support.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      const errorMessageObj: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: errorMessage,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessageObj]);
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
