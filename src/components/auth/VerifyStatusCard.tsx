"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import LoadingButton from "@/components/ui/LoadingButton";
import { VerifyState } from "@/types/auth.types";

interface VerifyStatusCardProps {
  status: VerifyState;
  email: string | null;
  onResend: (email: string) => Promise<void>;
}

export default function VerifyStatusCard({
  status,
  email,
  onResend,
}: VerifyStatusCardProps) {
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleResendClick = async () => {
    if (!email || cooldown > 0) return;
    setIsResending(true);
    try {
      await onResend(email);
      setCooldown(60);
    } catch (error) {
      // Parent handle error notifying
    } finally {
      setIsResending(false);
    }
  };

  // Các UI trạng thái
  const renderContent = () => {
    switch (status) {
      case "VERIFYING":
        return (
          <div className="flex flex-col items-center">
            <svg
              className="animate-spin h-12 w-12 text-primary mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <h3 className="text-xl font-bold text-on-surface">
              Đang xác minh...
            </h3>
            <p className="text-sm text-on-surface-variant mt-2">
              Vui lòng không đóng cửa sổ này.
            </p>
          </div>
        );

      case "VERIFY_SUCCESS":
      case "VERIFY_ALREADY_COMPLETED":
        return (
          <div className="flex flex-col items-center animate-slideDown">
            <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl">
                check_circle
              </span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">
              Xác thực Email Thành Công
            </h3>
            <p className="text-sm text-on-surface-variant mb-6 text-center">
              {status === "VERIFY_SUCCESS"
                ? "Tài khoản của bạn đã được kích hoạt. Chào mừng bạn tham gia hệ thống!"
                : "Tài khoản này đã được kích hoạt từ trước đó."}
            </p>
            <Link
              href="/login"
              className="w-full py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-xl shadow-lg hover:shadow-primary/25 text-center transition-all uppercase tracking-widest text-sm"
            >
              Tiến hành Đăng nhập
            </Link>
          </div>
        );

      case "VERIFY_TOKEN_EXPIRED":
      case "VERIFY_TOKEN_INVALID":
        return (
          <div className="flex flex-col items-center animate-slideDown">
            <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl">
                error
              </span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">
              {status === "VERIFY_TOKEN_EXPIRED"
                ? "Liên kết kích hoạt đã hết hạn"
                : "Liên kết kích hoạt không hợp lệ"}
            </h3>
            <p className="text-sm text-on-surface-variant mb-6 text-center">
              {status === "VERIFY_TOKEN_EXPIRED"
                ? "Mỗi liên kết chỉ có hiệu lực trong 60 phút vì lý do bảo mật."
                : "Mã xác nhận này bị lỗi hoặc đã được sử dụng."}
              {email && " Bấm nút bên dưới để gửi lại liên kết mới."}
            </p>

            {email ? (
              <div className="w-full flex flex-col gap-3">
                <LoadingButton
                  type="button"
                  onClick={handleResendClick}
                  isLoading={isResending}
                  disabled={cooldown > 0}
                  className={`w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all shadow-md ${
                    cooldown > 0
                      ? "bg-surface-variant text-on-surface-variant cursor-not-allowed"
                      : "bg-error text-error-onContainer hover:opacity-90 active:scale-[0.98]"
                  }`}
                >
                  {cooldown > 0
                    ? `Chờ ${cooldown} giây`
                    : "Gửi lại Email kích hoạt"}
                </LoadingButton>
                <Link
                  href="/login"
                  className="w-full py-3 border-2 border-outline-variant text-on-surface-variant font-bold rounded-xl text-center hover:bg-surface-variant transition-colors uppercase tracking-widest text-sm"
                >
                  Quay lại đăng nhập
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                className="w-full py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-xl shadow-lg hover:shadow-primary/25 text-center transition-all uppercase tracking-widest text-sm"
              >
                Về trang chủ
              </Link>
            )}
          </div>
        );

      case "VERIFY_SERVER_ERROR":
        return (
          <div className="flex flex-col items-center animate-slideDown">
            <div className="w-16 h-16 rounded-full bg-warning/10 text-warning flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl">
                cloud_off
              </span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">
              Lỗi Máy Chủ
            </h3>
            <p className="text-sm text-on-surface-variant mb-6 text-center">
              Đã xảy ra lỗi nội bộ trong quá trình xác thực. Vui lòng thử lại
              sau vài phút nha.
            </p>
            <Link
              href="/login"
              className="w-full py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary font-bold rounded-xl text-center shadow-lg transition-all uppercase tracking-widest text-sm"
            >
              Trở về an toàn
            </Link>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="glass-card w-full max-w-md p-8 md:p-12 shadow-2xl relative rounded-[2rem]">
      {renderContent()}
    </div>
  );
}
