import { useState } from "react";
import Button from "../../../components/ui/Button";

/**
 * @typedef {object} UpdateNoticeProps
 * @property {string}   currentVersion - Currently installed version
 * @property {string}   newVersion     - Available version to update to
 * @property {string[]} changelog      - Array of changelog entry strings
 * @property {() => void} onUpdate     - Called when user clicks "Update Now"
 * @property {() => void} onDismiss    - Called when user clicks "Dismiss"
 */

/**
 * Yellow/amber gradient banner that appears when a plugin update is available.
 * Displays current vs new version with an expandable "What's New" section.
 *
 * @param {UpdateNoticeProps} props
 */
export default function UpdateNotice({
  currentVersion,
  newVersion,
  changelog = [],
  onUpdate,
  onDismiss,
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        {/* Left — version info */}
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M10 2a.75.75 0 01.75.75v.258a33.186 33.186 0 016.668.83.75.75 0 01-.336 1.461 31.731 31.731 0 00-1.08-.208V13.5A4.5 4.5 0 0111.5 18h-3A4.5 4.5 0 014 13.5V5.09a31.6 31.6 0 00-1.082.208.75.75 0 11-.336-1.462 33.19 33.19 0 016.668-.829V2.75A.75.75 0 0110 2zM5.5 5.406v8.094a3 3 0 003 3h3a3 3 0 003-3V5.406a31.64 31.64 0 00-9 0z"
                clipRule="evenodd"
              />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-amber-900">
              PouchCare Update Available
            </p>
            <p className="text-xs text-amber-700">
              <span className="font-medium">v{currentVersion}</span>
              <span className="mx-1.5">&rarr;</span>
              <span className="font-bold">v{newVersion}</span>
            </p>
          </div>
        </div>

        {/* Right — actions */}
        <div className="flex items-center gap-3">
          {changelog.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="text-xs font-medium text-amber-700 underline-offset-2 hover:underline"
            >
              {expanded ? "Hide details" : "What's New"}
            </button>
          )}
          <Button size="sm" onClick={onUpdate}>
            Update Now
          </Button>
          <button
            type="button"
            onClick={onDismiss}
            className="text-xs text-amber-600 hover:text-amber-800"
          >
            Dismiss
          </button>
        </div>
      </div>

      {/* Expandable changelog */}
      {expanded && changelog.length > 0 && (
        <div className="border-t border-amber-200 bg-amber-50/60 px-5 py-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-800">
            Changelog &mdash; v{newVersion}
          </h4>
          <ul className="space-y-1">
            {changelog.map((entry, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-amber-900">
                <span className="mt-1 block h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                {entry}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
