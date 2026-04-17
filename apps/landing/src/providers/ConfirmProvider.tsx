import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ConfirmDialog,
  type ConfirmVariant,
} from "@/components/ui/ConfirmDialog";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<(value: boolean) => void>();

  const finish = useCallback((value: boolean) => {
    setOpen(false);
    setOptions(null);
    resolverRef.current?.(value);
    resolverRef.current = undefined;
  }, []);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {options && (
        <ConfirmDialog
          open={open}
          title={options.title}
          description={options.description}
          confirmLabel={options.confirmLabel}
          cancelLabel={options.cancelLabel}
          variant={options.variant}
          onCancel={() => finish(false)}
          onConfirm={() => finish(true)}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return ctx.confirm;
}
