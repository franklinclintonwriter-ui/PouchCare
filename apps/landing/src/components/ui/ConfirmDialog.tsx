import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { ui } from "@/lib/ui";

export type ConfirmVariant = "default" | "danger";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={open}
      onClose={loading ? () => {} : onCancel}
      title={title}
      description={description}
      size="sm"
      closeOnOverlay={!loading}
      hideCloseButton={loading}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            disabled={loading}
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === "danger" ? "danger" : "primary"}
            disabled={loading}
            className={cn("w-full sm:w-auto", ui.focusRing)}
            onClick={() => void onConfirm()}
          >
            {loading ? "Please wait…" : confirmLabel}
          </Button>
        </>
      }
    >
      <span className="sr-only">Confirmation required.</span>
    </Modal>
  );
}
