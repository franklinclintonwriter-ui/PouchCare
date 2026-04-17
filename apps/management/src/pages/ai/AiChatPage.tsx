import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import { PageTransition } from "@/components/ui/PageTransition";
import { AiChatPanel } from "@/features/ai/components/AiChatPanel";
import { AiProviderBadge } from "@/features/ai/components/AiProviderBadge";
import { AiModelSelector } from "@/features/ai/components/AiModelSelector";
import { useAiChat } from "@/features/ai/hooks/useAiChat";
import { useAiStatus, useAiConversations } from "@/api/ai";
import { History, MessageSquare } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/utils/cn";

export default function AiChatPage() {
  const { data: status } = useAiStatus();
  const { data: convData } = useAiConversations(20);
  const [selectedModel, setSelectedModel] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const recentConvs = (convData as any)?.data ?? [];

  const activeModel = selectedModel || status?.defaultModel || "";
  const activeProvider = selectedModel
    ? (status?.models?.find((m) => m.id === selectedModel)?.provider ??
      status?.defaultProvider)
    : status?.defaultProvider;

  const chat = useAiChat({
    useCase: "CHAT",
    provider: activeProvider,
    model: activeModel || undefined,
  });

  const headerConfig = useMemo(
    () => ({
      title: "AI Chat",
      breadcrumbs: [{ label: "AI", href: "/ai" }, { label: "Chat" }],
      actions: [
        {
          type: "button" as const,
          label: "History",
          icon: History,
          variant: "secondary" as const,
          onClick: () => setShowHistory((v) => !v),
        },
      ],
    }),
    [],
  );

  useHeaderConfig(headerConfig);

  return (
    <PageTransition>
      <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-6xl gap-4 px-4 sm:px-6 lg:px-8">
        {/* History sidebar */}
        <div
          className={cn(
            "hidden w-72 shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm transition-all dark:border-gray-700/60 dark:bg-gray-900",
            showHistory ? "lg:flex" : "lg:hidden",
          )}
        >
          <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
              <History className="h-4 w-4 text-gray-400" />
              Conversations
            </h3>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {recentConvs.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <MessageSquare className="mx-auto h-6 w-6 text-gray-300 dark:text-gray-600" />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  No conversations yet
                </p>
              </div>
            ) : (
              <div className="space-y-0.5 p-2">
                {recentConvs.map((c: any) => (
                  <div
                    key={c.id}
                    className={cn(
                      "rounded-lg px-3 py-2.5 transition hover:bg-gray-50 dark:hover:bg-gray-800/80",
                      chat.conversationId === c.id &&
                        "bg-primary-50 dark:bg-primary-950/20",
                    )}
                  >
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                      {c.title || "Untitled"}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <AiProviderBadge provider={c.provider} model={c.model} />
                      <span className="text-[10px] text-gray-400">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm dark:border-gray-700/60 dark:bg-gray-900">
          {/* Model selector bar */}
          {status?.models && status.models.length > 0 && (
            <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-2 dark:border-gray-800">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Model
              </span>
              <AiModelSelector
                models={status.models}
                value={activeModel}
                onChange={setSelectedModel}
                compact
              />
            </div>
          )}
          <AiChatPanel
            chat={chat}
            provider={activeProvider}
            model={activeModel}
            placeholder="Ask anything about work, content, SEO, planning..."
            suggestions={[
              "Help me write a project proposal",
              "Create an SEO strategy outline",
              "Write code for a React component",
              "Draft a client follow-up email",
            ]}
          />
        </div>
      </div>
    </PageTransition>
  );
}
