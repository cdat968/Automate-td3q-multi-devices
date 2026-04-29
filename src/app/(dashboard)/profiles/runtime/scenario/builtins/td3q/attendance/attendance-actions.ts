import type { ExecutionContext } from "../../../scenario-types";
import { AttendanceVars, AttendanceConfig } from "./attendance-constants";
import {
    armAttendance,
    readIntVar,
    setVar,
    enterAttendanceMilestonePhase,
    enterAttendanceClosePhase,
} from "../../../features/attendance/attendance-runtime";
import type { AttendanceDetectors } from "./attendance-detectors";
import type { AttendanceFlowTargets } from "./attendance-types";
import type { ScenarioDefinition } from "../../../scenario-types";

type BuildAction = NonNullable<
    ScenarioDefinition["transitions"][number]["buildAction"]
>;

type RuntimeAction = Awaited<ReturnType<BuildAction>>;

export function buildOpenAttendancePopupAction(
    ctx: ExecutionContext,
    targets: AttendanceFlowTargets,
    detectors: AttendanceDetectors,
): RuntimeAction {
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
        windowIterations: AttendanceConfig.retry.verifyWindowIterations,
        attempt: readIntVar(ctx, AttendanceVars.retryCount, 0),
    });

    // Legacy compatibility while action-executor still knows verifyArmed.
    setVar(ctx, AttendanceVars.verifyArmed, "true");
    setVar(ctx, AttendanceVars.verifyArmedAtIteration, String(ctx.iteration));
    setVar(
        ctx,
        AttendanceVars.verifyDeadlineIteration,
        String(ctx.iteration + AttendanceConfig.retry.verifyWindowIterations),
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
                detectTarget: detectors.attendanceIcon.detect,
            },
            {
                id: "move-pointer-away-after-attendance-click",
                kind: "MOVE_RELATIVE_POINT",
                xRatio: AttendanceConfig.interactions
                    .pointerAwayAfterAttendanceClick.xRatio,
                yRatio: AttendanceConfig.interactions
                    .pointerAwayAfterAttendanceClick.yRatio,
                description: "Move pointer away from attendance hotspot",
            },
            {
                id: "wait-after-attendance-click-short",
                kind: "WAIT",
                durationMs: AttendanceConfig.waits.afterAttendanceClickShortMs,
            },
            {
                id: "wait-after-attendance-click-settle",
                kind: "WAIT",
                durationMs: AttendanceConfig.waits.afterAttendanceClickSettleMs,
            },
        ],
    };
}

export function buildClaimAttendanceDailyAction(
    ctx: ExecutionContext,
    detectors: AttendanceDetectors,
): RuntimeAction {
    armAttendance(ctx, {
        kind: "claim_daily",
        expectedState: "ATTENDANCE_DAILY_REWARD_POPUP_OPEN",
        sourceActionId: "action-claim-attendance-daily",
        startedAtIteration: ctx.iteration,
        windowIterations: AttendanceConfig.retry.verifyWindowIterations,
    });

    return {
        id: "action-claim-attendance-daily",
        kind: "CLICK_FROM_DETECTION",
        screenshotBefore: true,
        screenshotAfter: true,
        detectTarget: detectors.todayClaimable.detect,
    };
}

export function buildCloseAttendanceDailyRewardPopupAction(
    ctx: ExecutionContext,
    detectors: AttendanceDetectors,
): RuntimeAction {
    armAttendance(ctx, {
        kind: "close_daily_reward",
        expectedState: "ATTENDANCE_POPUP_OPEN",
        sourceActionId: "action-close-attendance-daily-reward-popup",
        startedAtIteration: ctx.iteration,
        windowIterations: AttendanceConfig.retry.verifyWindowIterations,
    });

    return {
        id: "action-close-attendance-daily-reward-popup",
        kind: "CLICK_FROM_DETECTION",
        screenshotBefore: true,
        screenshotAfter: true,
        detectTarget: detectors.dailyRewardClose.detect,
    };
}

export function buildAdvanceAfterAttendanceDailyDoneAction(
    ctx: ExecutionContext,
): RuntimeAction {
    enterAttendanceMilestonePhase(ctx);

    return {
        id: "action-advance-after-attendance-daily-done",
        kind: "WAIT",
        durationMs: AttendanceConfig.waits.afterDailyRewardCloseMs,
    };
}

export function buildClaimAttendanceMilestoneAction(
    ctx: ExecutionContext,
    scanAttendanceMilestoneCached: AttendanceDetectors["scanAttendanceMilestoneCached"],
): RuntimeAction {
    enterAttendanceMilestonePhase(ctx);

    armAttendance(ctx, {
        kind: "claim_milestone",
        expectedState: "ATTENDANCE_MILESTONE_DONE",
        sourceActionId: "action-claim-attendance-milestone",
        startedAtIteration: ctx.iteration,
        windowIterations: AttendanceConfig.retry.verifyWindowIterations,
    });

    return {
        id: "action-claim-attendance-milestone",
        kind: "CLICK_FROM_DETECTION",
        screenshotBefore: true,
        screenshotAfter: true,
        detectTarget: scanAttendanceMilestoneCached,
    };
}

export function buildPrepareCloseAttendancePopupAction(
    ctx: ExecutionContext,
): RuntimeAction {
    enterAttendanceClosePhase(ctx);

    return {
        id: "action-prepare-close-attendance-popup",
        kind: "WAIT",
        durationMs: AttendanceConfig.waits.prepareCloseAttendancePopupMs,
    };
}

export function buildCloseAttendancePopupAction(
    ctx: ExecutionContext,
    detectors: AttendanceDetectors,
): RuntimeAction {
    const nextCloseAttempt =
        readIntVar(ctx, AttendanceVars.closeAttempt, 0) + 1;

    setVar(ctx, AttendanceVars.closeAttempt, String(nextCloseAttempt));

    armAttendance(ctx, {
        kind: "close_attendance_popup",
        expectedState: "GAME_RUNNING",
        sourceActionId: "action-close-attendance-popup",
        startedAtIteration: ctx.iteration,
        windowIterations: AttendanceConfig.retry.verifyWindowIterations,
        attempt: nextCloseAttempt,
    });

    return {
        id: "action-close-attendance-popup",
        kind: "CLICK_FROM_DETECTION",
        screenshotBefore: true,
        screenshotAfter: true,
        detectTarget: detectors.popupCloseButton.detect,
    };
}
