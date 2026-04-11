"use client";

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    ReactNode,
} from "react";

export type NotificationType = "success" | "error" | "info" | "warning";

export interface Toast {
    id: string;
    type: NotificationType;
    message: string;
}

interface NotificationContextProps {
    notify: (type: NotificationType, message: string) => void;
    removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(
    undefined,
);

const typeStyles: Record<NotificationType, { bg: string; icon: string }> = {
    success: {
        bg: "bg-tertiary/10 border-tertiary/20 text-tertiary",
        icon: "check_circle",
    },
    error: { bg: "bg-error/10 border-error/20 text-error", icon: "error" },
    info: { bg: "bg-primary/10 border-primary/20 text-primary", icon: "info" },
    warning: {
        bg: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500",
        icon: "warning",
    },
};

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeNotification = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const notify = useCallback(
        (type: NotificationType, message: string) => {
            const id = Math.random().toString(36).substring(2, 9);
            setToasts((prev) => [...prev, { id, type, message }]);

            // Auto close after 3s
            setTimeout(() => {
                removeNotification(id);
            }, 3000);
        },
        [removeNotification],
    );

    return (
        <NotificationContext.Provider value={{ notify, removeNotification }}>
            {children}
            {/* Toast Container - Top Right */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
                {toasts.map((toast) => {
                    const style = typeStyles[toast.type];
                    return (
                        <div
                            key={toast.id}
                            className={`p-4 rounded-xl border flex items-start gap-3 backdrop-blur-md shadow-2xl pointer-events-auto transform transition-all duration-300 animate-slideDown ${style.bg}`}
                        >
                            <span className="material-symbols-outlined shrink-0">
                                {style.icon}
                            </span>
                            <p className="text-sm font-semibold mt-0.5 flex-1 break-words">
                                {toast.message}
                            </p>
                            <button
                                onClick={() => removeNotification(toast.id)}
                                className="opacity-70 hover:opacity-100 transition-opacity shrink-0"
                                aria-label="Close notification"
                            >
                                <span className="material-symbols-outlined text-sm">
                                    close
                                </span>
                            </button>
                        </div>
                    );
                })}
            </div>
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error(
            "useNotification must be used within a NotificationProvider",
        );
    }
    return context;
}
