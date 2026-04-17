import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ConfirmProvider } from "@/providers/ConfirmProvider";
import { useThemeStore } from "@/stores/themeStore";
import "./index.css";
import App from "./App";

useThemeStore.getState().applyTheme();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfirmProvider>
        <App />
        <Toaster richColors position="top-center" />
      </ConfirmProvider>
    </QueryClientProvider>
  </StrictMode>,
);
