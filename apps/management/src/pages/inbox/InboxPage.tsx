import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Send,
  FileEdit,
  Trash2,
  Archive,
  Star,
  Plus,
  Search,
  MailOpen,
  Paperclip,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import { useHeaderConfig } from "@/hooks/useHeaderConfig";
import { PageTransition } from "@/components/ui/PageTransition";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { LogoSpinner } from "@/components/ui/LogoSpinner";
import {
  useEmailAccounts,
  useEmailMessages,
  useEmailStats,
  useMarkRead,
  useToggleStar,
  useMoveMessage,
  type EmailMessage,
} from "@/api/inbox";
import ComposeModal from "./ComposeModal";
import AccountSetup from "./AccountSetup";

type Folder = "inbox" | "sent" | "drafts" | "starred" | "trash" | "archive";

const FOLDERS: { key: Folder; label: string; icon: typeof Mail }[] = [
  { key: "inbox", label: "Inbox", icon: Mail },
  { key: "sent", label: "Sent", icon: Send },
  { key: "drafts", label: "Drafts", icon: FileEdit },
  { key: "starred", label: "Starred", icon: Star },
  { key: "trash", label: "Trash", icon: Trash2 },
  { key: "archive", label: "Archive", icon: Archive },
];

export default function InboxPage() {
  const navigate = useNavigate();
  const [activeFolder, setActiveFolder] = useState<Folder>("inbox");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<EmailMessage | null>(null);

  const headerConfig = useMemo(() => ({ title: "Inbox" }), []);
  useHeaderConfig(headerConfig);

  const { data: accounts, isLoading: accountsLoading } = useEmailAccounts();
  const activeAccount = accounts?.[0]; // Use primary account

  const { data: stats } = useEmailStats(activeAccount?.id || "");
  const { data: messagesData, isLoading: messagesLoading } = useEmailMessages({
    accountId: activeAccount?.id || "",
    folder: activeFolder === "starred" ? "inbox" : activeFolder,
    search,
    page,
    limit: 25,
  });

  const markRead = useMarkRead();
  const toggleStar = useToggleStar();
  const moveMessage = useMoveMessage();

  const messages = messagesData?.data || [];
  const meta = messagesData?.meta;

  const handleSelectMessage = useCallback(
    (msg: EmailMessage) => {
      if (!msg.isRead) {
        markRead.mutate({ id: msg.id, isRead: true });
      }
      navigate(`/inbox/${msg.id}`);
    },
    [navigate, markRead],
  );

  const handleStar = useCallback(
    (e: React.MouseEvent, msg: EmailMessage) => {
      e.stopPropagation();
      toggleStar.mutate({ id: msg.id, isStarred: !msg.isStarred });
    },
    [toggleStar],
  );

  const handleArchive = useCallback(
    (e: React.MouseEvent, msg: EmailMessage) => {
      e.stopPropagation();
      moveMessage.mutate(
        { id: msg.id, folder: "archive" },
        {
          onSuccess: () => toast.success("Archived"),
        },
      );
    },
    [moveMessage],
  );

  const handleTrash = useCallback(
    (e: React.MouseEvent, msg: EmailMessage) => {
      e.stopPropagation();
      moveMessage.mutate(
        { id: msg.id, folder: "trash" },
        {
          onSuccess: () => toast.success("Moved to trash"),
        },
      );
    },
    [moveMessage],
  );

  // If no account, show setup
  if (!accountsLoading && (!accounts || accounts.length === 0)) {
    return (
      <PageTransition className="mx-auto max-w-2xl py-12">
        <AccountSetup />
      </PageTransition>
    );
  }

  if (accountsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LogoSpinner size="md" />
      </div>
    );
  }

  return (
    <PageTransition className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden w-56 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 md:flex md:flex-col">
        <div className="p-3">
          <Button
            onClick={() => {
              setReplyTo(null);
              setComposeOpen(true);
            }}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            Compose
          </Button>
        </div>

        <nav className="flex-1 space-y-0.5 px-2">
          {FOLDERS.map((f) => {
            const Icon = f.icon;
            const count =
              f.key === "inbox"
                ? stats?.unreadInbox
                : f.key === "drafts"
                  ? stats?.totalDrafts
                  : f.key === "trash"
                    ? stats?.totalTrash
                    : f.key === "starred"
                      ? stats?.totalStarred
                      : undefined;

            return (
              <button
                key={f.key}
                onClick={() => {
                  setActiveFolder(f.key);
                  setPage(1);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  activeFolder === f.key
                    ? "bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/30 dark:text-blue-400"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800",
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="flex-1 text-left">{f.label}</span>
                {count ? (
                  <span
                    className={cn(
                      "min-w-[20px] rounded-full px-1.5 py-0.5 text-xs font-medium text-center",
                      f.key === "inbox"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
                    )}
                  >
                    {count}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Account info */}
        {activeAccount && (
          <div className="border-t border-gray-200 p-3 dark:border-gray-700">
            <div className="truncate text-xs font-medium text-gray-900 dark:text-gray-100">
              {activeAccount.displayName}
            </div>
            <div className="truncate text-xs text-gray-500">
              {activeAccount.address}
            </div>
          </div>
        )}
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-2 dark:border-gray-700">
          {/* Mobile compose */}
          <Button
            size="sm"
            onClick={() => {
              setReplyTo(null);
              setComposeOpen(true);
            }}
            className="gap-1.5 md:hidden"
          >
            <Plus className="h-3.5 w-3.5" />
            Compose
          </Button>

          {/* Mobile folder selector */}
          <select
            value={activeFolder}
            onChange={(e) => {
              setActiveFolder(e.target.value as Folder);
              setPage(1);
            }}
            className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm md:hidden dark:border-gray-600 dark:bg-gray-800"
          >
            {FOLDERS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search emails..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <span>
                {(page - 1) * meta.limit + 1}-
                {Math.min(page * meta.limit, meta.total)} of {meta.total}
              </span>
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded p-1 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= meta.totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded p-1 hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-gray-800"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto">
          {messagesLoading ? (
            <div className="flex items-center justify-center py-20">
              <LogoSpinner size="sm" />
            </div>
          ) : messages.length === 0 ? (
            <EmptyState
              icon={<Mail className="h-8 w-8" />}
              title={`No emails in ${activeFolder}`}
              description={
                activeFolder === "inbox" ? "Your inbox is empty" : undefined
              }
              className="py-20"
            />
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg)}
                  className={cn(
                    "group flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50",
                    !msg.isRead && "bg-blue-50/40 dark:bg-blue-900/10",
                  )}
                >
                  {/* Star */}
                  <button
                    onClick={(e) => handleStar(e, msg)}
                    className="flex-shrink-0"
                  >
                    <Star
                      className={cn(
                        "h-4 w-4",
                        msg.isStarred
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 hover:text-yellow-400 dark:text-gray-600",
                      )}
                    />
                  </button>

                  {/* Sender / Recipients */}
                  <div className="w-36 flex-shrink-0 truncate">
                    <span
                      className={cn(
                        "text-sm",
                        !msg.isRead
                          ? "font-semibold text-gray-900 dark:text-white"
                          : "text-gray-700 dark:text-gray-300",
                      )}
                    >
                      {activeFolder === "sent" || activeFolder === "drafts"
                        ? msg.recipients
                            ?.map((r) => r.name || r.address)
                            .join(", ") || "No recipients"
                        : msg.account?.displayName ||
                          msg.account?.address ||
                          "Unknown"}
                    </span>
                  </div>

                  {/* Subject & preview */}
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span
                      className={cn(
                        "truncate text-sm",
                        !msg.isRead
                          ? "font-semibold text-gray-900 dark:text-white"
                          : "text-gray-700 dark:text-gray-300",
                      )}
                    >
                      {msg.isDraft && (
                        <Badge variant="warning" size="sm" className="mr-1.5">
                          Draft
                        </Badge>
                      )}
                      {msg.subject}
                    </span>
                    {msg.bodyText && (
                      <span className="hidden truncate text-sm text-gray-400 sm:inline dark:text-gray-500">
                        – {msg.bodyText.slice(0, 80)}
                      </span>
                    )}
                  </div>

                  {/* Attachment indicator */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <Paperclip className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                  )}

                  {/* Date */}
                  <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(msg.sentAt || msg.createdAt)}
                  </div>

                  {/* Quick actions */}
                  <div className="hidden flex-shrink-0 gap-1 group-hover:flex">
                    {!msg.isRead ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markRead.mutate({ id: msg.id, isRead: true });
                        }}
                        className="rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                        title="Mark read"
                      >
                        <MailOpen className="h-3.5 w-3.5 text-gray-500" />
                      </button>
                    ) : null}
                    <button
                      onClick={(e) => handleArchive(e, msg)}
                      className="rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                      title="Archive"
                    >
                      <Archive className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                    <button
                      onClick={(e) => handleTrash(e, msg)}
                      className="rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Compose modal */}
      <ComposeModal
        isOpen={composeOpen}
        onClose={() => {
          setComposeOpen(false);
          setReplyTo(null);
        }}
        accounts={accounts || []}
        replyTo={replyTo || undefined}
      />
    </PageTransition>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }
  const isThisYear = d.getFullYear() === now.getFullYear();
  if (isThisYear) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
