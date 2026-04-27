export const AttendanceVars = {
    verifyArmed: "ATTENDANCE_VERIFY_ARMED",
    verifyArmedAtIteration: "ATTENDANCE_VERIFY_ARMED_AT_ITERATION",
    verifyDeadlineIteration: "ATTENDANCE_VERIFY_DEADLINE_ITERATION",
    verifyWindowIterations: "ATTENDANCE_VERIFY_WINDOW_ITERATIONS",

    armActive: "ATTENDANCE_ARM_ACTIVE",
    armKind: "ATTENDANCE_ARM_KIND",
    armExpectedState: "ATTENDANCE_ARM_EXPECTED_STATE",
    armSourceActionId: "ATTENDANCE_ARM_SOURCE_ACTION_ID",
    armStartedAtIteration: "ATTENDANCE_ARM_STARTED_AT_ITERATION",
    armDeadlineIteration: "ATTENDANCE_ARM_DEADLINE_ITERATION",
    armAttempt: "ATTENDANCE_ARM_ATTEMPT",
    armLastResult: "ATTENDANCE_ARM_LAST_RESULT",

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

export type AttendanceArmKind =
    | "open_popup"
    | "claim_daily"
    | "close_daily_reward"
    | "claim_milestone"
    | "close_attendance_popup";

export type AttendanceArmResult = "success" | "timeout" | "abort" | "cleared";

export type AttendanceArmOptions = {
    kind: AttendanceArmKind;
    expectedState: string;
    sourceActionId: string;
    startedAtIteration: number;
    windowIterations: number;
    attempt?: number;
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

export function armAttendance(
    ctx: AttendanceRuntimeContext,
    options: AttendanceArmOptions,
): void {
    const deadlineIteration =
        options.startedAtIteration + options.windowIterations;

    setVar(ctx, AttendanceVars.armActive, "true");
    setVar(ctx, AttendanceVars.armKind, options.kind);
    setVar(ctx, AttendanceVars.armExpectedState, options.expectedState);
    setVar(ctx, AttendanceVars.armSourceActionId, options.sourceActionId);
    setVar(
        ctx,
        AttendanceVars.armStartedAtIteration,
        String(options.startedAtIteration),
    );
    setVar(ctx, AttendanceVars.armDeadlineIteration, String(deadlineIteration));
    setVar(ctx, AttendanceVars.armAttempt, String(options.attempt ?? 0));
    setVar(ctx, AttendanceVars.armLastResult, "");
}

export function disarmAttendance(
    ctx: AttendanceWritableContext,
    result: AttendanceArmResult = "cleared",
): void {
    setVar(ctx, AttendanceVars.armActive, "false");
    setVar(ctx, AttendanceVars.armLastResult, result);
    setVar(ctx, AttendanceVars.armKind, "");
    setVar(ctx, AttendanceVars.armExpectedState, "");
    setVar(ctx, AttendanceVars.armSourceActionId, "");
    setVar(ctx, AttendanceVars.armStartedAtIteration, "");
    setVar(ctx, AttendanceVars.armDeadlineIteration, "");
    setVar(ctx, AttendanceVars.armAttempt, "");
}

export function isAttendanceArmedFor(
    ctx: { variables: Record<string, string> },
    kind: AttendanceArmKind,
): boolean {
    return (
        ctx.variables[AttendanceVars.armActive] === "true" &&
        ctx.variables[AttendanceVars.armKind] === kind
    );
}

export function isAttendanceArmActive(ctx: {
    variables: Record<string, string>;
}): boolean {
    return ctx.variables[AttendanceVars.armActive] === "true";
}

export function isAttendanceArmExpired(ctx: {
    variables: Record<string, string>;
    iteration: number;
}): boolean {
    const deadline = readIntVar(ctx, AttendanceVars.armDeadlineIteration, 0);
    return deadline > 0 && ctx.iteration > deadline;
}

export function getAttendanceArmMeta(ctx: {
    variables: Record<string, string>;
}) {
    return {
        armActive: ctx.variables[AttendanceVars.armActive] === "true",
        armKind: ctx.variables[AttendanceVars.armKind] || "",
        armExpectedState: ctx.variables[AttendanceVars.armExpectedState] || "",
        armSourceActionId:
            ctx.variables[AttendanceVars.armSourceActionId] || "",
        armStartedAtIteration: Number(
            ctx.variables[AttendanceVars.armStartedAtIteration] || "0",
        ),
        armDeadlineIteration: Number(
            ctx.variables[AttendanceVars.armDeadlineIteration] || "0",
        ),
        armAttempt: Number(ctx.variables[AttendanceVars.armAttempt] || "0"),
        armLastResult: ctx.variables[AttendanceVars.armLastResult] || "",
    };
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
    disarmAttendance(ctx, "cleared");
    clearAttendancePhases(ctx);
}

export function markAttendanceAborted(
    ctx: AttendanceWritableContext,
    reason: string,
): void {
    clearAttendancePhases(ctx);
    disarmAttendance(ctx, "abort");
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
    disarmAttendance(ctx, "success");
    setVar(ctx, AttendanceVars.flowResult, "success");
    setVar(ctx, AttendanceVars.abortReason, "");
}
