"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { VerifyState } from "@/types/auth.types";
import { verifyAccountAction } from "@/actions/auth.actions";
import VerifyStatusCard from "@/components/auth/VerifyStatusCard";
import { useNotification } from "@/contexts/NotificationContext";

// Inner view component using search params
function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  
  const { notify } = useNotification();
  const [status, setStatus] = useState<VerifyState>("VERIFYING");
  const [isVerifying, setIsVerifying] = useState(true);

  // useEffect triggers the Server Action logic safely
  useEffect(() => {
    let mounted = true;

    async function verifyToken() {
      if (!token) {
        if (mounted) {
          setStatus("VERIFY_TOKEN_INVALID");
          setIsVerifying(false);
        }
        return;
      }

      try {
        const actionResult = await verifyAccountAction(token);
        if (mounted) {
          setStatus(actionResult);
        }
      } catch (e) {
        if (mounted) {
          setStatus("VERIFY_SERVER_ERROR");
        }
      } finally {
        if (mounted) {
          setIsVerifying(false);
        }
      }
    }

    verifyToken();

    return () => {
      mounted = false;
    };
  }, [token]);

  // Handler for Resend button inside the card
  const handleResend = async (emailToResend: string) => {
    const res = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailToResend }),
    });

    const data = await res.json();
    if (!res.ok) {
      notify("error", data.error || data.message || "Không thể yêu cầu mã mới.");
      throw new Error("Resend API failed"); // throw to let Card cancel cooldown mapping
    }

    notify("success", "Email kích hoạt đã được gửi thành công!");
  };

  return (
    <div className="w-full h-full min-h-[500px] flex items-center justify-center p-6 md:p-12 relative bg-surface">
      {/* Visual background details similar to login layout */}
      <div className="absolute inset-0 bg-gradient-to-br from-surface to-surface-variant pointer-events-none" />
      
      <div className="relative w-full max-w-md z-10">
        {/* Mobile Logo Brand */}
        <div className="md:hidden flex items-center gap-2 mb-8 justify-center">
          <span className="material-symbols-outlined text-primary">terminal</span>
          <span className="font-bold text-on-surface text-sm uppercase tracking-widest">
            GameFlow Verification
          </span>
        </div>

        <VerifyStatusCard
          status={status}
          email={email}
          onResend={handleResend}
        />
      </div>
    </div>
  );
}

// Default export wrapper using Suspense (Mandatory for Next.js App Router client searchParams)
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="w-full h-screen flex items-center justify-center bg-surface">
        <span className="material-symbols-outlined text-primary animate-spin text-4xl">sync</span>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
