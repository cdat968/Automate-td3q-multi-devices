type BadgeStatus =
    | "running"
    | "error"
    | "healthy"
    | "queued"
    | "idle"
    | "exception";

const STATUS_CONFIG: Record<
    BadgeStatus,
    { label: string; bg: string; text: string; dot: string; pulse?: boolean }
> = {
    running: {
        label: "Running",
        bg: "bg-primary/10",
        text: "text-primary-fixed-dim",
        dot: "bg-primary",
        pulse: true,
    },
    healthy: {
        label: "Healthy",
        bg: "bg-tertiary/10",
        text: "text-tertiary",
        dot: "bg-tertiary",
    },
    error: {
        label: "Error",
        bg: "bg-error-container/30",
        text: "text-error",
        dot: "bg-error",
        pulse: true,
    },
    exception: {
        label: "Exception",
        bg: "bg-error/10",
        text: "text-error",
        dot: "bg-error",
        pulse: true,
    },
    queued: {
        label: "Queued",
        bg: "bg-secondary/10",
        text: "text-secondary",
        dot: "bg-secondary",
    },
    idle: {
        label: "Idle",
        bg: "bg-slate-400/10",
        text: "text-slate-400",
        dot: "bg-slate-400",
    },
};

interface BadgeProps {
    status: BadgeStatus;
}

export default function Badge({ status }: BadgeProps) {
    const config = STATUS_CONFIG[status];
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full ${config.bg} ${config.text} font-bold text-[10px] uppercase`}
        >
            <span
                className={`w-1.5 h-1.5 rounded-full ${config.dot} ${config.pulse ? "animate-pulse" : ""}`}
            />
            {config.label}
        </span>
    );
}
