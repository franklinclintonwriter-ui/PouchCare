import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/utils/cn";

type Props = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
};

export function QueryErrorState({
  title = "Could not load data",
  message = "Something went wrong. Check your connection and try again.",
  onRetry,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200/80 bg-red-50/80 px-6 py-10 text-center dark:border-red-900/40 dark:bg-red-950/30",
        className,
      )}
    >
      <AlertCircle className="h-10 w-10 text-red-500 dark:text-red-400" aria-hidden />
      <div>
        <p className="font-medium text-gray-900 dark:text-gray-100">{title}</p>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{message}</p>
      </div>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
