import type { RuntimeTargetRef } from "../../../actions/action-types";
import type { ScenarioDefinition } from "../../scenario-types";
import { AttendanceConfig } from "./attendance-config";
import {
    armAttendance,
    AttendanceVars,
    clearAttendancePhases,
    disarmAttendance,
    enterAttendanceClosePhase,
    enterAttendanceMilestonePhase,
    getAttendanceArmMeta,
    isAttendanceArmedFor,
    isAttendanceArmExpired,
    isAttendanceArmActive,
    markAttendanceAborted,
    markAttendanceFlowSuccess,
    readBoolVar,
    readIntVar,
    registerAttendanceRetry,
    setVar,
} from "./attendance-runtime";
import {
    attendanceDailyRewardPopupCloseDetector,
    attendanceDailyRewardPopupDetector,
    attendanceIconDetector,
    attendancePopupAnchorDetector,
    attendancePopupCloseButtonDetector,
    attendancePopupVerifyDetector,
} from "./attendance-detectors";
import { attendanceMilestoneClaimableDetector } from "./attendance-milestone-detector";
import {
    createAttendanceTodayDetectors,
    type ClassifyAttendanceTodayCell,
} from "./attendance-today-detectors";

type DetectionRule = ScenarioDefinition["detectionRules"][number];
type Transition = ScenarioDefinition["transitions"][number];

export type AttendanceFlowTargets = {
    gameHost: RuntimeTargetRef;
};

export type AttendanceFlowDefinition = {
    detectionRules: DetectionRule[];
    transitions: Transition[];
};

function resolveEvidenceScreenshotPath(result: {
    screenshotPath?: string;
    overlays?: Array<{ screenshotPath?: string }>;
}): string | undefined {
    return (
        result.screenshotPath ??
        result.overlays?.find((overlay) => overlay.screenshotPath)
            ?.screenshotPath
    );
}

export function createAttendanceFlow(params: {
    targets: AttendanceFlowTargets;
    classifyAttendanceTodayCell: ClassifyAttendanceTodayCell;
}): AttendanceFlowDefinition {
    const { targets, classifyAttendanceTodayCell } = params;

    const { attendanceTodayClaimableDetector, attendanceTodayDoneDetector } =
        createAttendanceTodayDetectors(classifyAttendanceTodayCell);

    const detectionRules: DetectionRule[] = [
        {
            id: "detect-attendance-daily-ready",
            state: "ATTENDANCE_DAILY_READY",
            async detect(ctx) {
                if (!readBoolVar(ctx, AttendanceVars.popupConfirmed)) {
                    return false;
                }

                const popup = await attendancePopupAnchorDetector.detect(ctx);
                if (!popup.matched) return false;

                return attendanceTodayClaimableDetector.detect(ctx);
            },
        },

        {
            id: "detect-attendance-daily-reward-popup-open",
            state: "ATTENDANCE_DAILY_REWARD_POPUP_OPEN",
            async detect(ctx) {
                if (!readBoolVar(ctx, AttendanceVars.popupConfirmed)) {
                    return false;
                }

                if (!isAttendanceArmedFor(ctx, "claim_daily")) {
                    return false;
                }

                const closeMatch =
                    await attendanceDailyRewardPopupCloseDetector.detect(ctx);
                if (closeMatch.matched) {
                    const armMeta = getAttendanceArmMeta(ctx);
                    disarmAttendance(ctx, "success");

                    return {
                        ...closeMatch,
                        meta: {
                            ...(closeMatch.meta ?? {}),
                            ...armMeta,
                        },
                    };
                }

                const result =
                    await attendanceDailyRewardPopupDetector.detect(ctx);

                const armMeta = getAttendanceArmMeta(ctx);

                if (result.matched) {
                    disarmAttendance(ctx, "success");
                }

                return {
                    ...result,
                    meta: {
                        ...(result.meta ?? {}),
                        ...armMeta,
                    },
                };
            },
        },

        {
            id: "detect-attendance-milestone-ready",
            state: "ATTENDANCE_MILESTONE_READY",
            async detect(ctx) {
                if (!readBoolVar(ctx, AttendanceVars.milestonePhase)) {
                    return false;
                }

                if (!readBoolVar(ctx, AttendanceVars.popupConfirmed)) {
                    return false;
                }

                const popup = await attendancePopupAnchorDetector.detect(ctx);
                if (!popup.matched) return false;

                return attendanceMilestoneClaimableDetector.detect(ctx);
            },
        },

        {
            id: "detect-attendance-daily-done",
            state: "ATTENDANCE_DAILY_DONE",
            async detect(ctx) {
                if (readBoolVar(ctx, AttendanceVars.milestonePhase)) {
                    return false;
                }

                if (!readBoolVar(ctx, AttendanceVars.popupConfirmed)) {
                    return false;
                }

                const popup = await attendancePopupAnchorDetector.detect(ctx);
                if (!popup.matched) return false;

                return attendanceTodayDoneDetector.detect(ctx);
            },
        },

        {
            id: "detect-attendance-milestone-done",
            state: "ATTENDANCE_MILESTONE_DONE",
            async detect(ctx) {
                if (readBoolVar(ctx, AttendanceVars.closePhase)) {
                    return false;
                }

                if (!readBoolVar(ctx, AttendanceVars.milestonePhase)) {
                    return false;
                }

                if (!readBoolVar(ctx, AttendanceVars.popupConfirmed)) {
                    return false;
                }

                const popup = await attendancePopupAnchorDetector.detect(ctx);
                if (!popup.matched) return false;

                const result =
                    await attendanceMilestoneClaimableDetector.detect(ctx);

                if (result.matched) {
                    return false;
                }

                const armMeta = getAttendanceArmMeta(ctx);

                if (isAttendanceArmedFor(ctx, "claim_milestone")) {
                    disarmAttendance(ctx, "success");
                }

                const evidenceScreenshotPath =
                    resolveEvidenceScreenshotPath(result);

                // console.log("[MILESTONE][DONE_RULE_FORWARD_OVERLAYS]", {
                //     hasResultScreenshotPath: !!result.screenshotPath,
                //     resolvedScreenshotPath: milestoneScreenshotPath ?? null,
                //     attachmentsCount: result.attachments?.length ?? 0,
                //     overlaysCount: milestoneOverlays?.length ?? 0,
                //     overlayShapeCounts:
                //         milestoneOverlays?.map(
                //             (overlay) => overlay.shapes?.length ?? 0,
                //         ) ?? [],
                //     overlayScreenshotPaths:
                //         milestoneOverlays?.map(
                //             (overlay) => overlay.screenshotPath ?? null,
                //         ) ?? [],
                // });

                return {
                    matched: true,
                    confidence: 1,
                    screenshotPath: evidenceScreenshotPath,
                    attachments: result.attachments,
                    overlays: result.overlays,
                    message: "ATTENDANCE MILESTONE DONE",
                    meta: {
                        ...(result.meta ?? {}),
                        ...armMeta,
                        detectorId: "attendance-milestone-done-wrapper",
                        milestoneScanMatched: result.matched,
                    },
                };
            },
        },

        {
            id: "detect-attendance-close-ready",
            state: "ATTENDANCE_CLOSE_READY",
            async detect(ctx) {
                if (!readBoolVar(ctx, AttendanceVars.milestonePhase)) {
                    return false;
                }

                if (!readBoolVar(ctx, AttendanceVars.popupConfirmed)) {
                    return false;
                }

                if (!readBoolVar(ctx, AttendanceVars.closePhase)) {
                    return false;
                }

                const popup = await attendancePopupAnchorDetector.detect(ctx);
                if (!popup.matched) return false;

                const result =
                    await attendanceMilestoneClaimableDetector.detect(ctx);

                if (result.matched) {
                    return false;
                }

                const evidenceScreenshotPath =
                    resolveEvidenceScreenshotPath(result);

                // console.log("[MILESTONE][CLOSE_READY_RULE_FORWARD_OVERLAYS]", {
                //     hasResultScreenshotPath: !!result.screenshotPath,
                //     resolvedScreenshotPath: milestoneScreenshotPath ?? null,
                //     attachmentsCount: result.attachments?.length ?? 0,
                //     overlaysCount: milestoneOverlays?.length ?? 0,
                //     overlayShapeCounts:
                //         milestoneOverlays?.map(
                //             (overlay) => overlay.shapes?.length ?? 0,
                //         ) ?? [],
                //     overlayScreenshotPaths:
                //         milestoneOverlays?.map(
                //             (overlay) => overlay.screenshotPath ?? null,
                //         ) ?? [],
                // });

                return {
                    matched: true,
                    confidence: 1,
                    screenshotPath: evidenceScreenshotPath,
                    attachments: result.attachments,
                    overlays: result.overlays,
                    message: "ATTENDANCE CLOSE READY",
                    meta: {
                        ...(result.meta ?? {}),
                        detectorId: "attendance-close-ready-wrapper",
                        milestoneScanMatched: result.matched,
                    },
                };
            },
        },

        {
            id: "detect-attendance-popup-open",
            state: "ATTENDANCE_POPUP_OPEN",
            async detect(ctx) {
                if (readBoolVar(ctx, AttendanceVars.popupConfirmed)) {
                    const anchor =
                        await attendancePopupAnchorDetector.detect(ctx);

                    if (
                        anchor.matched &&
                        isAttendanceArmedFor(ctx, "close_daily_reward")
                    ) {
                        const armMeta = getAttendanceArmMeta(ctx);
                        disarmAttendance(ctx, "success");

                        return {
                            ...anchor,
                            meta: {
                                ...(anchor.meta ?? {}),
                                ...armMeta,
                            },
                        };
                    }

                    return anchor;
                }

                if (!isAttendanceArmedFor(ctx, "open_popup")) {
                    return false;
                }

                const result = await attendancePopupVerifyDetector.detect(ctx);

                const armMeta = getAttendanceArmMeta(ctx);

                if (result.matched) {
                    setVar(ctx, AttendanceVars.retryCount, "0");
                    setVar(ctx, AttendanceVars.verifyArmed, "false");
                    setVar(ctx, AttendanceVars.verifyDeadlineIteration, "");
                    setVar(ctx, AttendanceVars.popupConfirmed, "true");
                    disarmAttendance(ctx, "success");
                }

                return {
                    ...result,
                    meta: {
                        ...(result.meta ?? {}),
                        ...armMeta,
                    },
                };
            },
        },

        {
            id: "detect-attendance-flow-done",
            state: "ATTENDANCE_FLOW_DONE",
            async detect(ctx) {
                if (ctx.variables[AttendanceVars.flowResult] !== "success") {
                    return false;
                }

                const player = await ctx.adapter.queryTarget(
                    targets.gameHost,
                    ctx.signal,
                );

                return {
                    matched: player.found && player.visible === true,
                    message: "attendance_flow_success",
                    meta: {
                        flowResult: ctx.variables[AttendanceVars.flowResult],
                    },
                };
            },
        },

        {
            id: "detect-attendance-open-failed",
            state: "ATTENDANCE_FLOW_FAILED",
            async detect(ctx) {
                const abortReason =
                    ctx.variables[AttendanceVars.abortReason]?.trim();

                if (abortReason) {
                    return {
                        matched: true,
                        confidence: 1,
                        message: `ATTENDANCE OPEN FAILED => ${abortReason}`,
                        meta: {
                            feature: "attendance_flow",
                            abortReason,
                            retryCount: readIntVar(
                                ctx,
                                AttendanceVars.retryCount,
                                0,
                            ),
                            lastFailureKind:
                                ctx.variables[AttendanceVars.lastFailureKind],
                            lastFailureMessage:
                                ctx.variables[
                                    AttendanceVars.lastFailureMessage
                                ],
                            ...getAttendanceArmMeta(ctx),
                        },
                    };
                }

                if (
                    isAttendanceArmActive(ctx) &&
                    !isAttendanceArmedFor(ctx, "open_popup") &&
                    isAttendanceArmExpired(ctx)
                ) {
                    const armMeta = getAttendanceArmMeta(ctx);
                    const armKind = armMeta.armKind || "unknown";
                    const failureKind = `attendance_${armKind}_arm_timeout`;
                    const failureMessage = `Attendance ARM timeout while waiting for ${armMeta.armExpectedState || "expected state"}`;

                    registerAttendanceRetry(ctx, failureKind, failureMessage);
                    markAttendanceAborted(ctx, failureKind);

                    return {
                        matched: true,
                        confidence: 1,
                        message: `ATTENDANCE ARM FAILED => ${failureKind}`,
                        meta: {
                            feature: "attendance_flow",
                            abortReason: failureKind,
                            failureKind,
                            failureMessage,
                            retryCount: readIntVar(
                                ctx,
                                AttendanceVars.retryCount,
                                0,
                            ),
                            ...armMeta,
                        },
                    };
                }

                return false;
            },
        },
    ];

    const transitions: Transition[] = [
        {
            id: "open-attendance-popup",
            from: "GAME_RUNNING",
            to: "ATTENDANCE_POPUP_OPEN",
            priority: 30,
            async canRun(ctx) {
                const player = await ctx.adapter.queryTarget(
                    targets.gameHost,
                    ctx.signal,
                );

                if (!player.found || player.visible !== true) {
                    return {
                        allowed: false,
                        reason: "Game host not ready for attendance click",
                    };
                }

                const abortReason =
                    ctx.variables[AttendanceVars.abortReason]?.trim();

                if (abortReason) {
                    return {
                        allowed: false,
                        reason: `Attendance flow aborted: ${abortReason}`,
                    };
                }

                const retryCount = readIntVar(
                    ctx,
                    AttendanceVars.retryCount,
                    0,
                );

                if (retryCount >= AttendanceConfig.retry.maxRetry) {
                    markAttendanceAborted(
                        ctx,
                        ctx.variables[AttendanceVars.lastFailureKind]?.trim() ||
                            "attendance_max_retry_exceeded",
                    );

                    return {
                        allowed: false,
                        reason: "Attendance max retry exceeded",
                        meta: {
                            retryCount,
                            maxRetry: AttendanceConfig.retry.maxRetry,
                        },
                    };
                }

                if (isAttendanceArmedFor(ctx, "open_popup")) {
                    if (!isAttendanceArmExpired(ctx)) {
                        return {
                            allowed: false,
                            reason: "Waiting attendance popup ARM window",
                            meta: {
                                ...getAttendanceArmMeta(ctx),
                                currentIteration: ctx.iteration,
                            },
                        };
                    }

                    const nextRetry = registerAttendanceRetry(
                        ctx,
                        "attendance_click_no_popup",
                        "Attendance click did not open popup within ARM window",
                    );

                    const armMeta = getAttendanceArmMeta(ctx);

                    disarmAttendance(ctx, "timeout");
                    setVar(ctx, AttendanceVars.verifyArmed, "false");
                    setVar(ctx, AttendanceVars.verifyArmedAtIteration, "");
                    setVar(ctx, AttendanceVars.verifyDeadlineIteration, "");

                    if (nextRetry >= AttendanceConfig.retry.maxRetry) {
                        markAttendanceAborted(
                            ctx,
                            "attendance_click_no_popup_max_retry",
                        );

                        return {
                            allowed: false,
                            reason: "Attendance click did not open popup within retry budget",
                            meta: {
                                retryCount: nextRetry,
                                maxRetry: AttendanceConfig.retry.maxRetry,
                                ...armMeta,
                            },
                        };
                    }

                    return {
                        allowed: true,
                        reason: "Retry attendance after popup ARM timeout",
                        meta: {
                            retryCount: nextRetry,
                            maxRetry: AttendanceConfig.retry.maxRetry,
                            ...armMeta,
                        },
                    };
                }

                return {
                    allowed: true,
                    meta: {
                        retryCount,
                        maxRetry: AttendanceConfig.retry.maxRetry,
                    },
                };
            },

            async buildAction(ctx) {
                if (ctx.setVariable) {
                    if (!ctx.variables[AttendanceVars.retryCount]) {
                        ctx.setVariable(AttendanceVars.retryCount, "0");
                    }

                    ctx.setVariable(
                        AttendanceVars.verifyWindowIterations,
                        String(AttendanceConfig.retry.verifyWindowIterations),
                    );
                }

                armAttendance(ctx, {
                    kind: "open_popup",
                    expectedState: "ATTENDANCE_POPUP_OPEN",
                    sourceActionId: "action-open-attendance-popup",
                    startedAtIteration: ctx.iteration,
                    windowIterations:
                        AttendanceConfig.retry.verifyWindowIterations,
                    attempt: readIntVar(ctx, AttendanceVars.retryCount, 0),
                });

                // Legacy compatibility while action-executor still knows verifyArmed.
                setVar(ctx, AttendanceVars.verifyArmed, "true");
                setVar(
                    ctx,
                    AttendanceVars.verifyArmedAtIteration,
                    String(ctx.iteration),
                );
                setVar(
                    ctx,
                    AttendanceVars.verifyDeadlineIteration,
                    String(
                        ctx.iteration +
                            AttendanceConfig.retry.verifyWindowIterations,
                    ),
                );

                return {
                    id: "action-open-attendance-popup",
                    kind: "COMPOSITE",
                    actions: [
                        {
                            id: "wait-before-attendance",
                            kind: "WAIT",
                            durationMs: AttendanceConfig.waits.afterGameLoadMs,
                        },
                        {
                            id: "focus-game-host",
                            kind: "FOCUS",
                            target: targets.gameHost,
                        },
                        {
                            kind: "CLICK_FROM_DETECTION",
                            id: "click-attendance-hotspot",
                            screenshotBefore: true,
                            screenshotAfter: true,
                            detectTarget: attendanceIconDetector.detect,
                        },
                        {
                            id: "move-pointer-away-after-attendance-click",
                            kind: "MOVE_RELATIVE_POINT",
                            xRatio: AttendanceConfig.interactions
                                .pointerAwayAfterAttendanceClick.xRatio,
                            yRatio: AttendanceConfig.interactions
                                .pointerAwayAfterAttendanceClick.yRatio,
                            description:
                                "Move pointer away from attendance hotspot",
                        },
                        {
                            id: "wait-after-attendance-click-short",
                            kind: "WAIT",
                            durationMs:
                                AttendanceConfig.waits
                                    .afterAttendanceClickShortMs,
                        },
                        {
                            id: "wait-after-attendance-click-settle",
                            kind: "WAIT",
                            durationMs:
                                AttendanceConfig.waits
                                    .afterAttendanceClickSettleMs,
                        },
                    ],
                };
            },
        },

        {
            id: "claim-attendance-daily",
            from: "ATTENDANCE_DAILY_READY",
            to: "ATTENDANCE_DAILY_REWARD_POPUP_OPEN",
            priority: 50,
            async buildAction(ctx) {
                armAttendance(ctx, {
                    kind: "claim_daily",
                    expectedState: "ATTENDANCE_DAILY_REWARD_POPUP_OPEN",
                    sourceActionId: "action-claim-attendance-daily",
                    startedAtIteration: ctx.iteration,
                    windowIterations:
                        AttendanceConfig.retry.verifyWindowIterations,
                });

                return {
                    id: "action-claim-attendance-daily",
                    kind: "CLICK_FROM_DETECTION",
                    screenshotBefore: true,
                    screenshotAfter: true,
                    detectTarget: attendanceTodayClaimableDetector.detect,
                };
            },
        },

        {
            id: "close-attendance-daily-reward-popup",
            from: "ATTENDANCE_DAILY_REWARD_POPUP_OPEN",
            to: "ATTENDANCE_POPUP_OPEN",
            priority: 55,
            async buildAction(ctx) {
                armAttendance(ctx, {
                    kind: "close_daily_reward",
                    expectedState: "ATTENDANCE_POPUP_OPEN",
                    sourceActionId:
                        "action-close-attendance-daily-reward-popup",
                    startedAtIteration: ctx.iteration,
                    windowIterations:
                        AttendanceConfig.retry.verifyWindowIterations,
                });

                return {
                    id: "action-close-attendance-daily-reward-popup",
                    kind: "CLICK_FROM_DETECTION",
                    screenshotBefore: true,
                    screenshotAfter: true,
                    detectTarget:
                        attendanceDailyRewardPopupCloseDetector.detect,
                };
            },
        },

        {
            id: "advance-after-attendance-daily-done",
            from: "ATTENDANCE_DAILY_DONE",
            to: "ATTENDANCE_POPUP_OPEN",
            priority: 46,
            async canRun() {
                return { allowed: true };
            },
            async buildAction(ctx) {
                enterAttendanceMilestonePhase(ctx);

                return {
                    id: "action-advance-after-attendance-daily-done",
                    kind: "WAIT",
                    durationMs: AttendanceConfig.waits.afterDailyRewardCloseMs,
                };
            },
        },

        {
            id: "claim-attendance-milestone",
            from: "ATTENDANCE_MILESTONE_READY",
            to: "ATTENDANCE_POPUP_OPEN",
            priority: 45,
            async buildAction(ctx) {
                enterAttendanceMilestonePhase(ctx);

                armAttendance(ctx, {
                    kind: "claim_milestone",
                    expectedState: "ATTENDANCE_MILESTONE_DONE",
                    sourceActionId: "action-claim-attendance-milestone",
                    startedAtIteration: ctx.iteration,
                    windowIterations:
                        AttendanceConfig.retry.verifyWindowIterations,
                });

                return {
                    id: "action-claim-attendance-milestone",
                    kind: "CLICK_FROM_DETECTION",
                    screenshotBefore: true,
                    screenshotAfter: true,
                    detectTarget: attendanceMilestoneClaimableDetector.detect,
                };
            },
        },

        {
            id: "prepare-close-attendance-popup",
            from: "ATTENDANCE_MILESTONE_DONE",
            to: "ATTENDANCE_CLOSE_READY",
            priority: 44,
            async canRun() {
                return { allowed: true };
            },
            async buildAction(ctx) {
                enterAttendanceClosePhase(ctx);

                return {
                    id: "action-prepare-close-attendance-popup",
                    kind: "WAIT",
                    durationMs:
                        AttendanceConfig.waits.prepareCloseAttendancePopupMs,
                };
            },
        },

        {
            id: "close-attendance-popup",
            from: "ATTENDANCE_CLOSE_READY",
            to: "GAME_RUNNING",
            priority: 40,
            async buildAction(ctx) {
                const nextCloseAttempt =
                    readIntVar(ctx, AttendanceVars.closeAttempt, 0) + 1;

                setVar(
                    ctx,
                    AttendanceVars.closeAttempt,
                    String(nextCloseAttempt),
                );

                armAttendance(ctx, {
                    kind: "close_attendance_popup",
                    expectedState: "GAME_RUNNING",
                    sourceActionId: "action-close-attendance-popup",
                    startedAtIteration: ctx.iteration,
                    windowIterations:
                        AttendanceConfig.retry.verifyWindowIterations,
                    attempt: nextCloseAttempt,
                });

                return {
                    id: "action-close-attendance-popup",
                    kind: "CLICK_FROM_DETECTION",
                    screenshotBefore: true,
                    screenshotAfter: true,
                    detectTarget: attendancePopupCloseButtonDetector.detect,
                };
            },

            async verifyAfterRun(ctx) {
                const player = await ctx.adapter.queryTarget(
                    targets.gameHost,
                    ctx.signal,
                );

                if (player.found && player.visible === true) {
                    disarmAttendance(ctx, "success");
                    clearAttendancePhases(ctx);
                    markAttendanceFlowSuccess(ctx);
                    return true;
                }

                return false;
            },
        },
    ];

    return {
        detectionRules,
        transitions,
    };
}
