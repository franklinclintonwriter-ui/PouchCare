import { useState } from "react";
import { Mail, Plus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import type { StaffUser } from "@/types/auth";
import { useCreateEmailAccount } from "@/api/inbox";

export default function AccountSetup() {
  const user = useAuthStore((s) => s.user) as StaffUser | null;
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [address, setAddress] = useState("");
  const [signature, setSignature] = useState("");
  const createAccount = useCreateEmailAccount();

  const suggestedAddress = user?.name
    ? `${user.name.toLowerCase().replace(/\s+/g, ".")}@pouchcare.com`
    : "";

  const handleCreate = async () => {
    const emailAddress = address || suggestedAddress;
    if (!emailAddress) {
      toast.error("Email address is required");
      return;
    }
    if (!displayName.trim()) {
      toast.error("Display name is required");
      return;
    }
    try {
      await createAccount.mutateAsync({
        address: emailAddress,
        displayName: displayName.trim(),
        signature: signature || undefined,
      });
      toast.success("Email account created!");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create account",
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          Set Up Your Email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Create your official @pouchcare.com email account to start sending and
          receiving emails.
        </p>

        <Input
          label="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="John Doe"
        />

        <Input
          label="Email Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={suggestedAddress}
        />
        {suggestedAddress && !address && (
          <p className="text-xs text-gray-500">
            Suggested:{" "}
            <button
              type="button"
              onClick={() => setAddress(suggestedAddress)}
              className="text-blue-600 hover:underline"
            >
              {suggestedAddress}
            </button>
          </p>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email Signature (optional)
          </label>
          <textarea
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Best regards,&#10;John Doe"
            rows={3}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <Button
          onClick={handleCreate}
          isLoading={createAccount.isPending}
          className="w-full gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Email Account
        </Button>
      </CardContent>
    </Card>
  );
}
