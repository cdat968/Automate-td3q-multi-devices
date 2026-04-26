export const AttendanceVars = {
    verifyArmed: "ATTENDANCE_VERIFY_ARMED",
    verifyArmedAtIteration: "ATTENDANCE_VERIFY_ARMED_AT_ITERATION",
    verifyDeadlineIteration: "ATTENDANCE_VERIFY_DEADLINE_ITERATION",
    verifyWindowIterations: "ATTENDANCE_VERIFY_WINDOW_ITERATIONS",

    retryCount: "ATTENDANCE_RETRY_COUNT",

    lastClickAtIteration: "ATTENDANCE_LAST_CLICK_AT_ITERATION",
    lastClickSourceDetectorRunId:
        "ATTENDANCE_LAST_CLICK_SOURCE_DETECTOR_RUN_ID",
    lastClickRetryAttempt: "ATTENDANCE_LAST_CLICK_RETRY_ATTEMPT",

    lastFailureKind: "ATTENDANCE_LAST_FAILURE_KIND",
    lastFailureMessage: "ATTENDANCE_LAST_FAILURE_MESSAGE",
    lastFailureAtIteration: "ATTENDANCE_LAST_FAILURE_AT_ITERATION",

    abortReason: "ATTENDANCE_ABORT_REASON",
    popupConfirmed: "ATTENDANCE_POPUP_CONFIRMED",
    milestonePhase: "ATTENDANCE_MILESTONE_PHASE",
    closePhase: "ATTENDANCE_CLOSE_PHASE",
    closeAttempt: "ATTENDANCE_CLOSE_ATTEMPT",
    flowResult: "ATTENDANCE_FLOW_RESULT",
} as const;

export type AttendanceRuntimeContext = {
    variables: Record<string, string>;
    setVariable?: (key: string, value: string) => void;
};

export type AttendanceWritableContext = {
    setVariable?: (key: string, value: string) => void;
};

export function readBoolVar(
    ctx: { variables: Record<string, string> },
    key: string,
): boolean {
    return ctx.variables[key] === "true";
}

export function readIntVar(
    ctx: { variables: Record<string, string> },
    key: string,
    fallback = 0,
): number {
    const raw = ctx.variables[key];
    if (!raw) return fallback;

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export function setVar(
    ctx: AttendanceWritableContext,
    key: string,
    value: string,
): void {
    ctx.setVariable?.(key, value);
}

export function clearAttendancePhases(ctx: AttendanceWritableContext): void {
    setVar(ctx, AttendanceVars.popupConfirmed, "false");
    setVar(ctx, AttendanceVars.milestonePhase, "false");
    setVar(ctx, AttendanceVars.closePhase, "false");
}

export function enterAttendanceMilestonePhase(
    ctx: AttendanceWritableContext,
): void {
    setVar(ctx, AttendanceVars.milestonePhase, "true");
    setVar(ctx, AttendanceVars.closePhase, "false");
}

export function enterAttendanceClosePhase(
    ctx: AttendanceWritableContext,
): void {
    setVar(ctx, AttendanceVars.closePhase, "true");
}

export function clearAttendanceRuntime(ctx: AttendanceWritableContext): void {
    setVar(ctx, AttendanceVars.verifyArmed, "false");
    setVar(ctx, AttendanceVars.verifyArmedAtIteration, "");
    setVar(ctx, AttendanceVars.verifyDeadlineIteration, "");
    setVar(ctx, AttendanceVars.lastClickAtIteration, "");
    setVar(ctx, AttendanceVars.lastClickSourceDetectorRunId, "");
    setVar(ctx, AttendanceVars.lastClickRetryAttempt, "");
    setVar(ctx, AttendanceVars.lastFailureKind, "");
    setVar(ctx, AttendanceVars.lastFailureMessage, "");
    setVar(ctx, AttendanceVars.lastFailureAtIteration, "");
    setVar(ctx, AttendanceVars.abortReason, "");
    clearAttendancePhases(ctx);
}

export function markAttendanceAborted(
    ctx: AttendanceWritableContext,
    reason: string,
): void {
    clearAttendancePhases(ctx);
    setVar(ctx, AttendanceVars.abortReason, reason);
    setVar(ctx, AttendanceVars.verifyArmed, "false");
    setVar(ctx, AttendanceVars.verifyDeadlineIteration, "");
    setVar(ctx, AttendanceVars.flowResult, "failed");
}

export function registerAttendanceRetry(
    ctx: AttendanceRuntimeContext,
    failureKind: string,
    failureMessage = failureKind,
): number {
    const currentRetry = readIntVar(ctx, AttendanceVars.retryCount, 0);
    const nextRetry = currentRetry + 1;

    setVar(ctx, AttendanceVars.retryCount, String(nextRetry));
    setVar(ctx, AttendanceVars.lastFailureKind, failureKind);
    setVar(ctx, AttendanceVars.lastFailureMessage, failureMessage);
    setVar(
        ctx,
        AttendanceVars.lastFailureAtIteration,
        String((ctx as { iteration?: number }).iteration ?? ""),
    );

    return nextRetry;
}

export function markAttendanceFlowSuccess(
    ctx: AttendanceWritableContext,
): void {
    clearAttendancePhases(ctx);
    setVar(ctx, AttendanceVars.flowResult, "success");
    setVar(ctx, AttendanceVars.abortReason, "");
}
