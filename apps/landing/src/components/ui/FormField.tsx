/**
 * FormField — label + control slot + error + help.
 *
 * The single place the client portal renders a form row. Auto-wires `htmlFor`
 * + `aria-describedby` + `aria-invalid` + `aria-required` so consumers don't
 * have to remember the a11y plumbing.
 *
 * @example
 *   <FormField
 *     label="Email"
 *     required
 *     error={errors.email?.message}
 *     help="We'll never share your email."
 *   >
 *     {(id) => <Input id={id} type="email" {...register("email")} />}
 *   </FormField>
 *
 * The child can also be a bare ReactNode — in which case the label `htmlFor`
 * is skipped; prefer the render-prop form for screen-reader correctness.
 */
import { useId, type ReactNode } from "react";
import { Label } from "./Label";
import { HelpText } from "./HelpText";
import { cn } from "@/lib/cn";

export interface FormFieldProps {
  /** Visible label text. Pass an empty string to render a visually-hidden label
   *  instead (use `ariaLabel` + `srOnlyLabel={true}` for that case). */
  label: ReactNode;
  /** Screen-reader-only label, overriding `label`. */
  srOnlyLabel?: boolean;
  /** Shows a red asterisk + sets aria-required on the control via render prop. */
  required?: boolean;
  /** "(optional)" caption shown next to the label. Overrides the default
   *  caption when `required` is false and `showOptional` is true. */
  showOptional?: boolean;
  /** Error copy — when truthy the control gets `aria-invalid` and the label +
   *  error message turn red. */
  error?: string | null;
  /** Help / hint text under the control. Omitted when `error` is shown. */
  help?: ReactNode;
  /** The actual form control. Render-prop so FormField can inject the stable
   *  id + aria-* attributes. */
  children: ReactNode | ((bindings: FormFieldBindings) => ReactNode);
  /** Additional Tailwind classes on the wrapping `<div>`. */
  className?: string;
}

export interface FormFieldBindings {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": boolean | undefined;
  "aria-required": boolean | undefined;
}

export function FormField({
  label,
  srOnlyLabel,
  required,
  showOptional,
  error,
  help,
  children,
  className,
}: FormFieldProps) {
  const autoId = useId();
  const id = `ff-${autoId}`;
  const descId = error || help ? `${id}-desc` : undefined;

  const bindings: FormFieldBindings = {
    id,
    "aria-describedby": descId,
    "aria-invalid": error ? true : undefined,
    "aria-required": required || undefined,
  };

  const content =
    typeof children === "function"
      ? (children as (b: FormFieldBindings) => ReactNode)(bindings)
      : children;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label
        htmlFor={id}
        required={required}
        className={cn(
          srOnlyLabel && "sr-only",
          error && "text-red-600 dark:text-red-400",
        )}
      >
        {label}
        {!required && showOptional && (
          <span className="ml-1 text-xs font-normal text-gray-400">
            (optional)
          </span>
        )}
      </Label>
      {content}
      {(error || help) && (
        <div id={descId}>
          {error ? (
            <p className="text-xs font-medium text-red-600 dark:text-red-400">
              {error}
            </p>
          ) : (
            <HelpText>{help}</HelpText>
          )}
        </div>
      )}
    </div>
  );
}
