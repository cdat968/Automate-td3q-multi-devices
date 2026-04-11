"use client";

import React, { useState, useEffect } from "react";
import LoadingButton from "@/components/ui/LoadingButton";
import { useNotification } from "@/contexts/NotificationContext";

interface Props {
    email: string;
    onDismiss: () => void;
}

function maskEmail(email: string) {
    if (!email) return "";
    const [name, domain] = email.split("@");
    if (!name || !domain) return email;

    // Hides middle chars if name is long enough
    if (name.length > 3) {
        const start = name.substring(0, 2);
        const end = name.substring(name.length - 1);
        return `${start}***${end}@${domain}`;
    }
    return email;
}

export default function VerificationHelpCard({ email, onDismiss }: Props) {
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const { notify } = useNotification();
    const maskedEmail = maskEmail(email);

    // Xử lý đếm ngược (cooldown) timer mượt mà
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (cooldown > 0) {
            timer = setTimeout(() => {
                setCooldown((prev) => prev - 1);
            }, 1000);
        }
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleResend = async () => {
        if (cooldown > 0) return;

        setIsResending(true);
        try {
            const res = await fetch("/api/auth/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                notify(
                    "error",
                    data.error ||
                        data.message ||
                        "Gửi lỗi, vui lòng thử lại sau.",
                );
                return;
            }

            notify("success", "Email mới đã được gửi!");
            setCooldown(60); // Đặt trạng thái đếm ngược 60 giây
        } catch (error) {
            notify("error", "Máy chủ không thể phản hồi. Thử lại sau!");
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="mt-6 p-6 rounded-2xl bg-warning/5 border border-warning/20 relative animate-slideDown flex flex-col items-center text-center shadow-md">
            {/* Nút Dismiss */}
            <button
                type="button"
                onClick={onDismiss}
                className="cursor-pointer absolute top-4 right-4 text-warning/70 hover:text-warning transition-colors"
                aria-label="Đóng bảng hướng dẫn"
            >
                <span className="material-symbols-outlined text-xl">close</span>
            </button>

            {/* Header */}
            <div className="w-12 h-12 rounded-full bg-warning/10 text-warning flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-2xl">
                    mark_email_unread
                </span>
            </div>
            <h3 className="text-xl font-bold text-on-surface mb-2">
                Tài khoản chưa kích hoạt
            </h3>

            {/* Body */}
            <p className="text-sm text-on-surface-variant leading-relaxed">
                Hệ thống đã gửi link xác nhận đến địa chỉ email{" "}
                <strong className="text-on-surface font-semibold">
                    {maskedEmail}
                </strong>
                . Để đăng nhập, vui lòng kiểm tra hộp thư đến hoặc mục hòm thư
                rác (Spam/Promotions) và click vào đường link kèm theo.
            </p>

            {/* Action */}
            <div className="mt-6 w-full max-w-xs">
                <LoadingButton
                    type="button"
                    onClick={handleResend}
                    isLoading={isResending}
                    disabled={cooldown > 0}
                    className={`w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all shadow-md ${
                        cooldown > 0
                            ? "bg-surface-variant text-on-surface-variant cursor-not-allowed"
                            : "bg-warning text-warning-onContainer hover:shadow-warning/20 hover:-translate-y-0.5"
                    }`}
                >
                    {cooldown > 0
                        ? `Chờ ${cooldown} giây`
                        : "Gửi lại Email kích hoạt"}
                </LoadingButton>
            </div>
        </div>
    );
}
