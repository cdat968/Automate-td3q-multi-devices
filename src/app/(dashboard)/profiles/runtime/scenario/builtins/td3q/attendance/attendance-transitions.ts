import type { ScenarioDefinition } from "../../../scenario-types";
import {
    AttendanceVars,
    AttendanceConfig,
    ATTENDANCE_STATE,
    ATTENDANCE_TRANSITION,
} from "./attendance-constants";
import {
    isAttendanceArmedFor,
    getAttendanceArmMeta,
    disarmAttendance,
    readBoolVar,
    readIntVar,
    isAttendanceArmActive,
    isAttendanceArmExpired,
    registerAttendanceRetry,
    markAttendanceAborted,
    markAttendanceFlowSuccess,
    clearAttendancePhases,
} from "../../../features/attendance/attendance-runtime";
import { forwardMilestoneScanEvidence } from "../../../features/attendance/attendance-milestone-evidence";
import type { AttendanceDetectors } from "./attendance-detectors";
import type { AttendanceFlowTargets } from "./attendance-types";
import {
    buildOpenAttendancePopupAction,
    buildClaimAttendanceDailyAction,
    buildCloseAttendanceDailyRewardPopupAction,
    buildAdvanceAfterAttendanceDailyDoneAction,
    buildClaimAttendanceMilestoneAction,
    buildPrepareCloseAttendancePopupAction,
    buildCloseAttendancePopupAction,
} from "./attendance-actions";

type DetectionRule = ScenarioDefinition["detectionRules"][number];
type Transition = ScenarioDefinition["transitions"][number];

export function getAttendanceDetectionRules(
    detectors: AttendanceDetectors,
    targets: AttendanceFlowTargets,
): DetectionRule[] {
    return [
        {
            id: "detect-attendance-daily-ready",
            state: ATTENDANCE_STATE.ATTENDANCE_DAILY_READY,
            async detect(ctx) {
                if (!readBoolVar(ctx, AttendanceVars.popupConfirmed)) {
                    return false;
                }

                const popup = await detectors.popupAnchor.detect(ctx);
                if (!popup.matched) return false;

                return detectors.todayClaimable.detect(ctx);
            },
        },

        {
            id: "detect-attendance-daily-reward-popup-open",
            state: ATTENDANCE_STATE.ATTENDANCE_DAILY_REWARD_POPUP_OPEN,
            async detect(ctx) {
                if (!readBoolVar(ctx, AttendanceVars.popupConfirmed)) {
                    return false;
                }

                if (!isAttendanceArmedFor(ctx, "claim_daily")) {
                    return false;
                }

                const closeMatch = await detectors.dailyRewardClose.detect(ctx);
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

                const result = await detectors.dailyRewardPopup.detect(ctx);

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
            state: ATTENDANCE_STATE.ATTENDANCE_MILESTONE_READY,
            async detect(ctx) {
                if (!readBoolVar(ctx, AttendanceVars.milestonePhase)) {
                    return false;
                }

                if (!readBoolVar(ctx, AttendanceVars.popupConfirmed)) {
                    return false;
                }

                const popup = await detectors.popupAnchor.detect(ctx);
                if (!popup.matched) return false;

                return detectors.scanAttendanceMilestoneCached(ctx);
            },
        },

        {
            id: "detect-attendance-daily-done",
            state: ATTENDANCE_STATE.ATTENDANCE_DAILY_DONE,
            async detect(ctx) {
                if (readBoolVar(ctx, AttendanceVars.milestonePhase)) {
                    return false;
                }

                if (!readBoolVar(ctx, AttendanceVars.popupConfirmed)) {
                    return false;
                }

                const popup = await detectors.popupAnchor.detect(ctx);
                if (!popup.matched) return false;

                return detectors.todayDone.detect(ctx);
            },
        },

        {
            id: "detect-attendance-milestone-done",
            state: ATTENDANCE_STATE.ATTENDANCE_MILESTONE_DONE,
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

                const popup = await detectors.popupAnchor.detect(ctx);
                if (!popup.matched) return false;

                const result =
                    await detectors.scanAttendanceMilestoneCached(ctx);

                if (result.matched) {
                    return false;
                }

                const armMeta = getAttendanceArmMeta(ctx);

                if (isAttendanceArmedFor(ctx, "claim_milestone")) {
                    disarmAttendance(ctx, "success");
                }

                const evidence = forwardMilestoneScanEvidence(result, {
                    detectorId: "attendance-milestone-done-wrapper",
                    extraMeta: {
                        ...armMeta,
                    },
                });

                return {
                    matched: true,
                    confidence: 1,
                    screenshotPath: evidence.screenshotPath,
                    attachments: evidence.attachments,
                    overlays: evidence.overlays,
                    message: "ATTENDANCE MILESTONE DONE",
                    meta: evidence.meta,
                };
            },
        },

        {
            id: "detect-attendance-close-ready",
            state: ATTENDANCE_STATE.ATTENDANCE_CLOSE_READY,
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

                const popup = await detectors.popupAnchor.detect(ctx);
                if (!popup.matched) return false;

                const result =
                    await detectors.scanAttendanceMilestoneCached(ctx);

                if (result.matched) {
                    return false;
                }

                const evidence = forwardMilestoneScanEvidence(result, {
                    detectorId: "attendance-close-ready-wrapper",
                });

                return {
                    matched: true,
                    confidence: 1,
                    screenshotPath: evidence.screenshotPath,
                    attachments: evidence.attachments,
                    overlays: evidence.overlays,
                    message: "ATTENDANCE CLOSE READY",
                    meta: evidence.meta,
                };
            },
        },

        {
            id: "detect-attendance-popup-open",
            state: ATTENDANCE_STATE.ATTENDANCE_POPUP_OPEN,
            async detect(ctx) {
                if (readBoolVar(ctx, AttendanceVars.popupConfirmed)) {
                    const anchor = await detectors.popupAnchor.detect(ctx);

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

                const result = await detectors.popupVerify.detect(ctx);

                const armMeta = getAttendanceArmMeta(ctx);

                if (result.matched) {
                    ctx.setVariable?.(AttendanceVars.retryCount, "0");
                    ctx.setVariable?.(AttendanceVars.verifyArmed, "false");
                    ctx.setVariable?.(
                        AttendanceVars.verifyDeadlineIteration,
                        "",
                    );
                    ctx.setVariable?.(AttendanceVars.popupConfirmed, "true");
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
            state: ATTENDANCE_STATE.ATTENDANCE_FLOW_DONE,
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
            state: ATTENDANCE_STATE.ATTENDANCE_FLOW_FAILED,
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
}

export function getAttendanceTransitions(
    detectors: AttendanceDetectors,
    targets: AttendanceFlowTargets,
): Transition[] {
    return [
        {
            id: ATTENDANCE_TRANSITION.OPEN_ATTENDANCE_POPUP,
            from: ATTENDANCE_STATE.GAME_RUNNING,
            to: ATTENDANCE_STATE.ATTENDANCE_POPUP_OPEN,
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
                    ctx.setVariable?.(AttendanceVars.verifyArmed, "false");
                    ctx.setVariable?.(
                        AttendanceVars.verifyArmedAtIteration,
                        "",
                    );
                    ctx.setVariable?.(
                        AttendanceVars.verifyDeadlineIteration,
                        "",
                    );

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
                return buildOpenAttendancePopupAction(ctx, targets, detectors);
            },
        },

        {
            id: ATTENDANCE_TRANSITION.CLAIM_ATTENDANCE_DAILY,
            from: ATTENDANCE_STATE.ATTENDANCE_DAILY_READY,
            to: ATTENDANCE_STATE.ATTENDANCE_DAILY_REWARD_POPUP_OPEN,
            priority: 50,
            async buildAction(ctx) {
                return buildClaimAttendanceDailyAction(ctx, detectors);
            },
        },

        {
            id: ATTENDANCE_TRANSITION.CLOSE_ATTENDANCE_DAILY_REWARD_POPUP,
            from: ATTENDANCE_STATE.ATTENDANCE_DAILY_REWARD_POPUP_OPEN,
            to: ATTENDANCE_STATE.ATTENDANCE_POPUP_OPEN,
            priority: 55,
            async buildAction(ctx) {
                return buildCloseAttendanceDailyRewardPopupAction(
                    ctx,
                    detectors,
                );
            },
        },

        {
            id: ATTENDANCE_TRANSITION.ADVANCE_AFTER_ATTENDANCE_DAILY_DONE,
            from: ATTENDANCE_STATE.ATTENDANCE_DAILY_DONE,
            to: ATTENDANCE_STATE.ATTENDANCE_POPUP_OPEN,
            priority: 46,
            async canRun() {
                return { allowed: true };
            },
            async buildAction(ctx) {
                return buildAdvanceAfterAttendanceDailyDoneAction(ctx);
            },
        },

        {
            id: ATTENDANCE_TRANSITION.CLAIM_ATTENDANCE_MILESTONE,
            from: ATTENDANCE_STATE.ATTENDANCE_MILESTONE_READY,
            to: ATTENDANCE_STATE.ATTENDANCE_POPUP_OPEN,
            priority: 45,
            async buildAction(ctx) {
                return buildClaimAttendanceMilestoneAction(
                    ctx,
                    detectors.scanAttendanceMilestoneCached,
                );
            },
        },

        {
            id: ATTENDANCE_TRANSITION.PREPARE_CLOSE_ATTENDANCE_POPUP,
            from: ATTENDANCE_STATE.ATTENDANCE_MILESTONE_DONE,
            to: ATTENDANCE_STATE.ATTENDANCE_CLOSE_READY,
            priority: 44,
            async canRun() {
                return { allowed: true };
            },
            async buildAction(ctx) {
                return buildPrepareCloseAttendancePopupAction(ctx);
            },
        },

        {
            id: ATTENDANCE_TRANSITION.CLOSE_ATTENDANCE_POPUP,
            from: ATTENDANCE_STATE.ATTENDANCE_CLOSE_READY,
            to: ATTENDANCE_STATE.GAME_RUNNING,
            priority: 40,
            async buildAction(ctx) {
                return buildCloseAttendancePopupAction(ctx, detectors);
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
}
