import { useState, useRef, useEffect, useCallback } from "react";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import { PageTransition } from "@/components/ui/PageTransition";
import { AiMarkdownView } from "@/features/ai/components/AiMarkdownView";
import { AiModelSelector } from "@/features/ai/components/AiModelSelector";
import { AiProviderBadge } from "@/features/ai/components/AiProviderBadge";
import { useAiStatus } from "@/api/ai";
import { getAccessToken } from "@/utils/storage";
import { getApiOrigin } from "@/config/apiOrigin";
import { cn } from "@/utils/cn";
import {
  Send,
  Square,
  Crown,
  User,
  Users,
  ListChecks,
  TrendingUp,
  Shield,
  Copy,
  Check,
  Download,
  FileText,
  FileSpreadsheet,
  FileCode,
  BarChart3,
  Sparkles,
  Code2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useMemo } from "react";
import { toast } from "sonner";
import type { AiSseEvent } from "@/features/ai/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const EXEC_SUGGESTIONS = [
  {
    icon: <Users className="h-4 w-4 text-blue-500" />,
    label: "Team overview",
    prompt:
      "Give me a comprehensive overview of all staff performance across branches — who are the top performers and who needs attention?",
  },
  {
    icon: <ListChecks className="h-4 w-4 text-amber-500" />,
    label: "Task pipeline",
    prompt:
      "Analyze the task pipeline — what is blocked, overdue, or at risk? Prioritize what I should address today.",
  },
  {
    icon: <BarChart3 className="h-4 w-4 text-emerald-500" />,
    label: "Financial health",
    prompt:
      "Summarize our financial position — revenue vs expenses, outstanding invoices, and payroll obligations.",
  },
  {
    icon: <TrendingUp className="h-4 w-4 text-violet-500" />,
    label: "Weekly report",
    prompt:
      "Draft an executive weekly summary covering staff performance, project status, financials, and key decisions needed.",
  },
  {
    icon: <Shield className="h-4 w-4 text-rose-500" />,
    label: "Risk assessment",
    prompt:
      "What are the top operational risks right now? Consider overdue tasks, absent staff, budget overruns, and pending leave requests.",
  },
  {
    icon: <Sparkles className="h-4 w-4 text-primary-500" />,
    label: "Strategic advice",
    prompt:
      "Based on our current team capacity and project pipeline, what strategic recommendations do you have for the next quarter?",
  },
  {
    icon: <Code2 className="h-4 w-4 text-cyan-500" />,
    label: "Generate code",
    prompt:
      "I need you to generate code. What programming language and what should it do?",
  },
  {
    icon: <FileText className="h-4 w-4 text-orange-500" />,
    label: "Draft document",
    prompt:
      "Help me draft a professional document — I'll tell you the type (policy, proposal, contract, SOP) and requirements.",
  },
];

function exportFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function extractCodeBlocks(content: string): { lang: string; code: string }[] {
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  const blocks: { lang: string; code: string }[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    blocks.push({ lang: match[1] || "text", code: match[2].trim() });
  }
  return blocks;
}

export default function AiExecutivePage() {
  const { data: status } = useAiStatus();
  const [selectedModel, setSelectedModel] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeModel = selectedModel || status?.defaultModel || "";
  const activeProvider = selectedModel
    ? (status?.models?.find((m) => m.id === selectedModel)?.provider ??
      status?.defaultProvider)
    : status?.defaultProvider;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setConversationId(null);
    setError(null);
    setStreaming(false);
    setInput("");
  }, []);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return;
      setError(null);
      setInput("");
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setStreaming(true);

      const ac = new AbortController();
      abortRef.current = ac;

      try {
        const origin = getApiOrigin() ?? "";
        const token = getAccessToken();
        const res = await fetch(`${origin}/v1/ai/executive/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            message: text,
            conversationId: conversationId ?? undefined,
            provider: activeProvider,
            model: activeModel || undefined,
          }),
          signal: ac.signal,
        });

        if (!res.ok || !res.body) {
          const errText = await res.text().catch(() => "Request failed");
          setError(errText);
          setStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let assistantText = "";
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const evt: AiSseEvent = JSON.parse(line.slice(6));
              if (evt.type === "start" && evt.conversationId)
                setConversationId(evt.conversationId);
              else if (evt.type === "chunk" && evt.text) {
                assistantText += evt.text;
                const snapshot = assistantText;
                setMessages((prev) => {
                  const c = [...prev];
                  c[c.length - 1] = { role: "assistant", content: snapshot };
                  return c;
                });
              } else if (evt.type === "error")
                setError(evt.error ?? "Unknown error");
            } catch {
              /* skip */
            }
          }
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError")
          setError(e instanceof Error ? e.message : "Stream failed");
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [streaming, conversationId, activeProvider, activeModel],
  );

  const copyMsg = useCallback((idx: number, content: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  }, []);

  const lastAssistantContent =
    messages.filter((m) => m.role === "assistant").at(-1)?.content ?? "";
  const codeBlocks = extractCodeBlocks(lastAssistantContent);

  const handleExportMd = () => {
    if (!lastAssistantContent) return;
    exportFile(lastAssistantContent, "executive-output.md", "text/markdown");
    toast.success("Exported as Markdown");
  };

  const handleExportTxt = () => {
    if (!lastAssistantContent) return;
    exportFile(lastAssistantContent, "executive-output.txt", "text/plain");
    toast.success("Exported as text");
  };

  const handleExportHtml = () => {
    if (!lastAssistantContent) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Executive Report</title><style>body{font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:2rem auto;padding:0 1rem;line-height:1.6;color:#1a1a1a}h1,h2,h3{margin-top:1.5em}code{background:#f4f4f4;padding:2px 6px;border-radius:4px;font-size:0.9em}pre{background:#1a1a1a;color:#e5e5e5;padding:1rem;border-radius:8px;overflow-x:auto}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:8px;text-align:left}</style></head><body>${lastAssistantContent}</body></html>`;
    exportFile(html, "executive-report.html", "text/html");
    toast.success("Exported as HTML");
  };

  const handleExportCsv = () => {
    const lines = lastAssistantContent
      .split("\n")
      .filter((l) => l.includes("|") && !l.match(/^[\s|:-]+$/));
    if (lines.length === 0) {
      toast.error("No table data to export");
      return;
    }
    const csv = lines
      .map((l) =>
        l
          .split("|")
          .filter(Boolean)
          .map((c) => `"${c.trim().replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    exportFile(csv, "executive-data.csv", "text/csv");
    toast.success("Exported as CSV");
  };

  const handleExportCode = (
    block: { lang: string; code: string },
    idx: number,
  ) => {
    const ext: Record<string, string> = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      html: "html",
      css: "css",
      json: "json",
      sql: "sql",
      bash: "sh",
      shell: "sh",
      jsx: "jsx",
      tsx: "tsx",
      go: "go",
      rust: "rs",
      java: "java",
      php: "php",
      ruby: "rb",
      yaml: "yaml",
      xml: "xml",
      markdown: "md",
    };
    const extension = ext[block.lang] || block.lang || "txt";
    exportFile(block.code, `code-${idx + 1}.${extension}`, "text/plain");
    toast.success(`Exported ${block.lang || "code"} file`);
  };

  const headerConfig = useMemo(
    () => ({
      title: "Executive Assistant",
      description: "CEO & MD — full org access",
      breadcrumbs: [{ label: "AI", href: "/ai" }, { label: "Executive" }],
      actions: [],
    }),
    [],
  );

  useHeaderConfig(headerConfig);

  return (
    <PageTransition>
      <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-6xl gap-3 px-4 sm:px-6 lg:px-8">
        {/* Main chat */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200/90 shadow-sm dark:border-gray-700/60">
          {/* Executive header */}
          <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-amber-50/80 via-white to-violet-50/50 px-4 py-2.5 dark:border-gray-800 dark:from-amber-950/20 dark:via-gray-900 dark:to-violet-950/15">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow shadow-amber-500/20">
                <Crown className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                  Executive AI
                </h2>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  Full org access — staff, tasks, finances, projects
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {status?.models && status.models.length > 0 && (
                <AiModelSelector
                  models={status.models}
                  value={activeModel}
                  onChange={setSelectedModel}
                  compact
                />
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-4 dark:bg-gray-900 sm:px-5">
            {messages.length === 0 && !streaming && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="relative">
                  <div className="absolute -inset-3 rounded-3xl bg-amber-100/40 blur-xl dark:bg-amber-900/15" />
                  <div className="relative rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 p-5 dark:from-amber-900/20 dark:to-orange-900/15">
                    <Crown className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Welcome, CEO
                </h3>
                <p className="mt-1.5 max-w-md text-sm text-gray-500 dark:text-gray-400">
                  Full org visibility — ask about staff, tasks, finances, or
                  generate documents and code.
                </p>
                <div className="mt-6 grid w-full max-w-2xl grid-cols-2 gap-2 sm:grid-cols-4">
                  {EXEC_SUGGESTIONS.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => send(s.prompt)}
                      className="flex flex-col items-start gap-1.5 rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-amber-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-800/80 dark:hover:border-amber-700"
                    >
                      {s.icon}
                      <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                        {s.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-2.5",
                    msg.role === "user" ? "justify-end" : "justify-start",
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/20">
                      <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                  )}
                  <div className="group/msg relative max-w-[85%]">
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 text-sm",
                        msg.role === "user"
                          ? "bg-gradient-to-br from-gray-800 to-gray-900 text-white shadow-sm"
                          : "bg-gray-50 text-gray-900 ring-1 ring-gray-200/80 dark:bg-gray-800/80 dark:text-gray-100 dark:ring-gray-700/60",
                      )}
                    >
                      {msg.role === "assistant" ? (
                        <AiMarkdownView
                          content={
                            msg.content ||
                            (streaming && i === messages.length - 1
                              ? "..."
                              : "")
                          }
                          showCopy={false}
                        />
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {msg.content}
                        </p>
                      )}
                    </div>
                    {msg.role === "assistant" && msg.content && (
                      <button
                        onClick={() => copyMsg(i, msg.content)}
                        className="absolute -bottom-1 right-2 flex h-6 items-center gap-1 rounded-full border border-gray-200 bg-white px-2 text-[10px] font-medium text-gray-500 opacity-0 shadow-sm transition group-hover/msg:opacity-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      >
                        {copiedIdx === i ? (
                          <>
                            <Check className="h-2.5 w-2.5 text-emerald-500" />{" "}
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-2.5 w-2.5" /> Copy
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gray-200 dark:bg-gray-700">
                      <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {streaming && (
              <div className="mt-3 flex items-center gap-2 pl-10">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400 [animation-delay:300ms]" />
                </span>
                <span className="text-[11px] text-gray-400">
                  Analyzing organization data...
                </span>
              </div>
            )}

            {error && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-xs text-red-800 dark:border-red-800/60 dark:bg-red-950/30 dark:text-red-200">
                {error}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Provider + export bar */}
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-1.5 dark:border-gray-800">
            <div className="flex items-center gap-2">
              {activeProvider && (
                <AiProviderBadge
                  provider={activeProvider}
                  model={activeModel}
                />
              )}
              <span className="text-[10px] text-amber-600 dark:text-amber-400">
                Executive mode
              </span>
            </div>
            {lastAssistantContent && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleExportMd}
                  title="Export Markdown"
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                >
                  <FileText className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleExportHtml}
                  title="Export HTML"
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                >
                  <FileCode className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleExportCsv}
                  title="Export CSV (tables)"
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleExportTxt}
                  title="Export text"
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
                >
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Ask about staff, tasks, finances — or request code, documents, reports..."
                rows={1}
                className="min-h-[42px] max-h-40 flex-1 resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
              {streaming ? (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => abortRef.current?.abort()}
                  icon={<Square className="h-3.5 w-3.5" />}
                  className="h-[42px] w-[42px] rounded-xl"
                  aria-label="Stop"
                />
              ) : (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => send(input)}
                  disabled={!input.trim()}
                  icon={<Send className="h-3.5 w-3.5" />}
                  className="h-[42px] w-[42px] rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  aria-label="Send"
                />
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar — code blocks / export panel */}
        {codeBlocks.length > 0 && (
          <div className="hidden w-80 shrink-0 flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm dark:border-gray-700/60 dark:bg-gray-900 lg:flex">
            <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                <Code2 className="h-4 w-4 text-cyan-500" />
                Code output
                <span className="ml-auto rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-medium text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
                  {codeBlocks.length}
                </span>
              </h3>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3 space-y-3">
              {codeBlocks.map((block, idx) => (
                <div
                  key={idx}
                  className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between bg-gray-50 px-3 py-1.5 dark:bg-gray-800">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {block.lang || "code"}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(block.code);
                          toast.success("Code copied");
                        }}
                        className="rounded p-1 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-300"
                        title="Copy code"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleExportCode(block, idx)}
                        className="rounded p-1 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-300"
                        title="Download file"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <pre className="max-h-48 overflow-auto bg-gray-900 p-3 text-[11px] leading-relaxed text-gray-100">
                    <code>{block.code}</code>
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
