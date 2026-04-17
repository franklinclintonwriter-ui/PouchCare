import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Reply,
  Forward,
  Star,
  Archive,
  Trash2,
  Paperclip,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import { PageTransition } from "@/components/ui/PageTransition";
import { Button } from "@/components/ui/Button";

import { LogoSpinner } from "@/components/ui/LogoSpinner";
import {
  useEmailMessage,
  useEmailThread,
  useEmailAccounts,
  useToggleStar,
  useMoveMessage,
  type EmailMessage,
} from "@/api/inbox";
import ComposeModal from "./ComposeModal";

export default function InboxDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeMode, setComposeMode] = useState<"reply" | "forward">("reply");

  const { data: message, isLoading } = useEmailMessage(id || "");
  const { data: thread } = useEmailThread(id || "");
  const { data: accounts } = useEmailAccounts();
  const toggleStar = useToggleStar();
  const moveMessage = useMoveMessage();

  const headerConfig = useMemo(
    () => ({ title: message?.subject || "Email" }),
    [message?.subject],
  );
  useHeaderConfig(headerConfig);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LogoSpinner size="md" />
      </div>
    );
  }

  if (!message) {
    return (
      <PageTransition className="py-20 text-center text-gray-500">
        Message not found
      </PageTransition>
    );
  }

  const displayMessages = thread && thread.length > 1 ? thread : [message];

  return (
    <PageTransition className="flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-2 dark:border-gray-700">
        <Button variant="ghost" size="sm" onClick={() => navigate("/inbox")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <h1 className="flex-1 truncate text-base font-semibold text-gray-900 dark:text-white">
          {message.subject}
        </h1>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setComposeMode("reply");
              setComposeOpen(true);
            }}
          >
            <Reply className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setComposeMode("forward");
              setComposeOpen(true);
            }}
          >
            <Forward className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              toggleStar.mutate({
                id: message.id,
                isStarred: !message.isStarred,
              })
            }
          >
            <Star
              className={cn(
                "h-4 w-4",
                message.isStarred ? "fill-yellow-400 text-yellow-400" : "",
              )}
            />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              moveMessage.mutate(
                { id: message.id, folder: "archive" },
                {
                  onSuccess: () => {
                    toast.success("Archived");
                    navigate("/inbox");
                  },
                },
              );
            }}
          >
            <Archive className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              moveMessage.mutate(
                { id: message.id, folder: "trash" },
                {
                  onSuccess: () => {
                    toast.success("Moved to trash");
                    navigate("/inbox");
                  },
                },
              );
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Message body */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {displayMessages.map((msg, idx) => (
            <MessageBlock
              key={msg.id}
              message={msg}
              isLast={idx === displayMessages.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Quick reply bar */}
      <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
        <div className="mx-auto max-w-3xl flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              setComposeMode("reply");
              setComposeOpen(true);
            }}
          >
            <Reply className="h-4 w-4" />
            Reply
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              setComposeMode("forward");
              setComposeOpen(true);
            }}
          >
            <Forward className="h-4 w-4" />
            Forward
          </Button>
        </div>
      </div>

      {/* Compose modal for reply/forward */}
      <ComposeModal
        isOpen={composeOpen}
        onClose={() => setComposeOpen(false)}
        accounts={accounts || []}
        replyTo={composeMode === "reply" ? message : undefined}
        forwardFrom={composeMode === "forward" ? message : undefined}
      />
    </PageTransition>
  );
}

function MessageBlock({
  message,
  isLast,
}: {
  message: EmailMessage;
  isLast: boolean;
}) {
  const [expanded, setExpanded] = useState(isLast);

  const toList = message.recipients?.filter((r) => r.type === "to") || [];
  const ccList = message.recipients?.filter((r) => r.type === "cc") || [];

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
          {(message.account?.displayName || "U")[0].toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-gray-900 dark:text-white">
              {message.account?.displayName ||
                message.account?.address ||
                "Unknown"}
            </span>
            <span className="text-xs text-gray-500">
              &lt;{message.account?.address}&gt;
            </span>
          </div>
          <div className="text-xs text-gray-500">
            to {toList.map((r) => r.name || r.address).join(", ")}
            {ccList.length > 0 &&
              `, cc: ${ccList.map((r) => r.name || r.address).join(", ")}`}
          </div>
        </div>
        <span className="flex-shrink-0 text-xs text-gray-400">
          {new Date(message.sentAt || message.createdAt).toLocaleString()}
        </span>
      </button>

      {/* Body */}
      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-800">
          <div
            className="prose prose-sm max-w-none p-4 dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: message.body }}
          />

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="border-t border-gray-100 p-4 dark:border-gray-800">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-2">
                <Paperclip className="h-3.5 w-3.5" />
                {message.attachments.length} attachment
                {message.attachments.length > 1 ? "s" : ""}
              </div>
              <div className="flex flex-wrap gap-2">
                {message.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-700"
                  >
                    <Paperclip className="h-3.5 w-3.5 text-gray-400" />
                    <span className="truncate max-w-[150px]">
                      {att.fileName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {(att.fileSize / 1024).toFixed(0)}KB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
