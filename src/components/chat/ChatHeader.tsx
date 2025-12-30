
import { Bot } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";

export function ChatHeader() {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <Bot className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">FleetBot AI Assistant</h1>
            <p className="text-sm text-gray-600">Your intelligent fleet management companion</p>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
