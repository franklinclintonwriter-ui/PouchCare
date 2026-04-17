import type { JobApplication } from "@/types/models";

export const STAGE_TRANSITIONS: Record<
  JobApplication["stage"],
  JobApplication["stage"][]
> = {
  new: ["screening", "rejected"],
  screening: ["interview", "rejected"],
  interview: ["offer", "rejected"],
  offer: ["hired", "rejected"],
  hired: [],
  rejected: ["new"],
};

export const STAGE_LABELS: Record<JobApplication["stage"], string> = {
  new: "New",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

export const STATUS_MAP: Record<string, string> = {
  new: "New",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};
