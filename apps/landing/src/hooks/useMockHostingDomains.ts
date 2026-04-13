import { useSyncExternalStore } from "react";
import type { HostingDomain } from "@/data/mockHosting";
import {
  getHostingDomainsSnapshot,
  subscribeHostingDomains,
} from "@/data/mockHostingStore";

export function useMockHostingDomains(): HostingDomain[] {
  return useSyncExternalStore(
    subscribeHostingDomains,
    getHostingDomainsSnapshot,
    getHostingDomainsSnapshot,
  );
}
