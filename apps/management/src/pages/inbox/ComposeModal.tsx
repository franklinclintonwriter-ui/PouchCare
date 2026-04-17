import { useState, useRef } from "react";
import { X, Paperclip, Send, Minus, Maximize2, Minimize2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";
import {
  useSendEmail,
  type EmailAccount,
  type EmailMessage,
} from "@/api/inbox";

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: EmailAccount[];
  replyTo?: EmailMessage;
  forwardFrom?: EmailMessage;
}

export default function ComposeModal({
  isOpen,
  onClose,
  accounts,
  replyTo,
  forwardFrom,
}: ComposeModalProps) {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [minimized, setMinimized] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const sendEmail = useSendEmail();

  // Pre-fill for reply/forward
  useState(() => {
    if (replyTo) {
      setTo(replyTo.account?.address || "");
      setSubject(`Re: ${replyTo.subject.replace(/^Re:\s*/i, "")}`);
      setBody(
        `<br/><br/><div style="border-left:2px solid #ccc;padding-left:12px;color:#666">${replyTo.body}</div>`,
      );
    }
    if (forwardFrom) {
      setSubject(`Fwd: ${forwardFrom.subject.replace(/^Fwd:\s*/i, "")}`);
      setBody(
        `<br/><br/>---------- Forwarded message ----------<br/>${forwardFrom.body}`,
      );
    }
    if (accounts[0]) {
      setAccountId(accounts[0].id);
    }
  });

  const handleSend = async (isDraft = false) => {
    const toAddresses = to
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const ccAddresses = cc
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const bccAddresses = bcc
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!isDraft && toAddresses.length === 0) {
      toast.error("Please add at least one recipient");
      return;
    }

    try {
      await sendEmail.mutateAsync({
        accountId,
        to: toAddresses,
        cc: ccAddresses,
        bcc: bccAddresses,
        subject,
        body,
        bodyText: body.replace(/<[^>]*>/g, ""),
        inReplyToId: replyTo?.id,
        isDraft,
        attachments: attachments.length > 0 ? attachments : undefined,
      });
      toast.success(isDraft ? "Draft saved" : "Email sent");
      resetForm();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    }
  };

  const resetForm = () => {
    setTo("");
    setCc("");
    setBcc("");
    setSubject("");
    setBody("");
    setAttachments([]);
    setShowCc(false);
    setShowBcc(false);
  };

  const handleAddFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col rounded-t-xl border border-gray-300 bg-white shadow-2xl dark:border-gray-600 dark:bg-gray-900",
        fullscreen
          ? "inset-4"
          : minimized
            ? "bottom-0 right-4 w-[480px] h-10"
            : "bottom-0 right-4 w-[560px] max-h-[80vh]",
      )}
    >
      {/* Title bar */}
      <div className="flex items-center justify-between rounded-t-xl bg-gray-800 px-4 py-2 text-white dark:bg-gray-700">
        <span className="text-sm font-medium">
          {replyTo ? "Reply" : forwardFrom ? "Forward" : "New Message"}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(!minimized)}
            className="rounded p-1 hover:bg-gray-700"
          >
            {minimized ? (
              <Maximize2 className="h-3.5 w-3.5" />
            ) : (
              <Minus className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="rounded p-1 hover:bg-gray-700"
          >
            {fullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="rounded p-1 hover:bg-gray-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Fields */}
          <div className="flex-shrink-0 divide-y divide-gray-200 border-b border-gray-200 dark:divide-gray-700 dark:border-gray-700">
            {/* From */}
            {accounts.length > 1 && (
              <div className="flex items-center gap-2 px-4 py-1.5">
                <span className="text-sm text-gray-500 w-12">From</span>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="flex-1 border-0 bg-transparent text-sm focus:outline-none focus:ring-0 dark:text-gray-100"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.displayName} &lt;{a.address}&gt;
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* To */}
            <div className="flex items-center gap-2 px-4 py-1.5">
              <span className="text-sm text-gray-500 w-12">To</span>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Recipients (comma separated)"
                className="flex-1 border-0 bg-transparent text-sm focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder:text-gray-500"
              />
              <div className="flex gap-1 text-xs">
                {!showCc && (
                  <button
                    onClick={() => setShowCc(true)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Cc
                  </button>
                )}
                {!showBcc && (
                  <button
                    onClick={() => setShowBcc(true)}
                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Bcc
                  </button>
                )}
              </div>
            </div>

            {/* Cc */}
            {showCc && (
              <div className="flex items-center gap-2 px-4 py-1.5">
                <span className="text-sm text-gray-500 w-12">Cc</span>
                <input
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="Cc recipients"
                  className="flex-1 border-0 bg-transparent text-sm focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder:text-gray-500"
                />
              </div>
            )}

            {/* Bcc */}
            {showBcc && (
              <div className="flex items-center gap-2 px-4 py-1.5">
                <span className="text-sm text-gray-500 w-12">Bcc</span>
                <input
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="Bcc recipients"
                  className="flex-1 border-0 bg-transparent text-sm focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder:text-gray-500"
                />
              </div>
            )}

            {/* Subject */}
            <div className="flex items-center gap-2 px-4 py-1.5">
              <span className="text-sm text-gray-500 w-12">Subject</span>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="flex-1 border-0 bg-transparent text-sm focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email..."
              className="min-h-[200px] w-full resize-none border-0 bg-transparent text-sm focus:outline-none focus:ring-0 dark:text-gray-100 dark:placeholder:text-gray-500"
            />
          </div>

          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className="border-t border-gray-200 px-4 py-2 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                {attachments.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 text-xs dark:bg-gray-800"
                  >
                    <Paperclip className="h-3 w-3 text-gray-400" />
                    <span className="max-w-[120px] truncate">{file.name}</span>
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-2 border-t border-gray-200 px-4 py-2 dark:border-gray-700">
            <Button
              onClick={() => handleSend(false)}
              isLoading={sendEmail.isPending}
              className="gap-2"
              size="sm"
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSend(true)}
              disabled={sendEmail.isPending}
            >
              Save Draft
            </Button>

            <div className="flex-1" />

            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleAddFiles}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
