import { templates } from "../../../vision/templates";
import { createTemplateMatchDetector } from "../../../vision/create-template-match-detector";
import { AttendanceConfig } from "./attendance-config";
import { AttendanceVars, readBoolVar } from "./attendance-runtime";

export const attendanceTomorrowReceiveTemplate = (
    templates as typeof templates & {
        attendanceTomorrowReceive?: Buffer;
    }
).attendanceTomorrowReceive;

export const attendanceTodayCheckedTemplate = templates.attendanceTodayChecked;

export const attendanceIconDetector = createTemplateMatchDetector({
    detectorId: "attendance-icon",
    template: templates.attendanceIcon,
    screenshotLabel: "detect_attendance_icon",
    overlayLabel: "attendance-icon",
    threshold: AttendanceConfig.detectors.icon.threshold,
    scales: AttendanceConfig.detectors.icon.scales,
    roi: AttendanceConfig.detectors.icon.roi,
    buildMessage: ({ matched, score }) =>
        `ATTENDANCE ICON => ${matched ? "MATCH" : "MISS"} (${score.toFixed(3)})`,
});

export const attendancePopupVerifyDetector = createTemplateMatchDetector({
    detectorId: "attendance-popup-verify",
    template: templates.attendanceHeader,
    screenshotLabel: "detect_attendance_popup_open",
    overlayLabel: "attendance-popup-verify",
    shouldRun: (ctx) => readBoolVar(ctx, AttendanceVars.verifyArmed),
    skipReason: "attendance_verify_not_armed",
    roi: AttendanceConfig.detectors.popupHeader.roi,
    buildMessage: ({ matched, score }) =>
        `ATTENDANCE POPUP VERIFY => ${matched ? "MATCH" : "MISS"} (${score.toFixed(3)})`,
    buildMeta: ({ ctx, matched }) => ({
        armed: true,
        armedAtIteration: ctx.variables[AttendanceVars.verifyArmedAtIteration],
        retryAttempt: Number(ctx.variables[AttendanceVars.retryCount] ?? "0"),
        sourceClickIteration: Number(
            ctx.variables[AttendanceVars.lastClickAtIteration] ?? "0",
        ),
        sourceDetectorRunId:
            ctx.variables[AttendanceVars.lastClickSourceDetectorRunId],
        sourceRetryAttempt: Number(
            ctx.variables[AttendanceVars.lastClickRetryAttempt] ?? "0",
        ),
        verifyDeadlineIteration: Number(
            ctx.variables[AttendanceVars.verifyDeadlineIteration] ?? "0",
        ),
        verifyMatched: matched,
    }),
});

export const attendancePopupAnchorDetector = createTemplateMatchDetector({
    detectorId: "attendance-popup-anchor",
    template: templates.attendanceHeader,
    screenshotLabel: "detect_attendance_popup_anchor",
    overlayLabel: "attendance-popup-anchor",
    roi: AttendanceConfig.detectors.popupHeader.roi,
    buildMessage: ({ matched, score }) =>
        `ATTENDANCE POPUP ANCHOR => ${matched ? "MATCH" : "MISS"} (${score.toFixed(3)})`,
});

export const baseTemplateDetector = createTemplateMatchDetector({
    detectorId: "attendance-today-claimable-template",
    template: templates.attendanceTodayClaimable,
    screenshotLabel: "detect_attendance_today_claimable",
});

export const MILESTONE_SLOT_ROIS = AttendanceConfig.milestone.slotRois;

export const milestoneDetectors = [
    createTemplateMatchDetector({
        detectorId: "attendance-milestone-2",
        template: templates.attendanceMilestone2,
        roi: MILESTONE_SLOT_ROIS[0],
    }),
    createTemplateMatchDetector({
        detectorId: "attendance-milestone-5",
        template: templates.attendanceMilestone5,
        roi: MILESTONE_SLOT_ROIS[1],
    }),
    createTemplateMatchDetector({
        detectorId: "attendance-milestone-10",
        template: templates.attendanceMilestone10,
        roi: MILESTONE_SLOT_ROIS[2],
    }),
    createTemplateMatchDetector({
        detectorId: "attendance-milestone-20",
        template: templates.attendanceMilestone20,
        roi: MILESTONE_SLOT_ROIS[3],
    }),
    createTemplateMatchDetector({
        detectorId: "attendance-milestone-30",
        template: templates.attendanceMilestone30,
        roi: MILESTONE_SLOT_ROIS[4],
    }),
];

export type MilestoneDetectorResult = Awaited<
    ReturnType<(typeof milestoneDetectors)[number]["detect"]>
>;

export const attendancePopupCloseButtonDetector = createTemplateMatchDetector({
    detectorId: "attendance-popup-close-button",
    template: templates.attendanceClose,
    screenshotLabel: "detect_attendance_popup_close_button",
    overlayLabel: "attendance-popup-close-button",
    roi: AttendanceConfig.detectors.popupCloseButton.roi,
    buildMessage: ({ matched, score }) =>
        `ATTENDANCE POPUP CLOSE BUTTON => ${matched ? "MATCH" : "MISS"} (${score.toFixed(3)})`,
});

export const attendanceDailyRewardPopupDetector = createTemplateMatchDetector({
    detectorId: "attendance-daily-reward-popup",
    template: templates.headerPopupWard,
    screenshotLabel: "detect_attendance_daily_reward_popup",
    overlayLabel: "attendance-daily-reward-popup",
    roi: AttendanceConfig.detectors.dailyRewardPopup.roi,
    buildMessage: ({ matched, score }) =>
        `ATTENDANCE DAILY REWARD POPUP => ${matched ? "MATCH" : "MISS"} (${score.toFixed(3)})`,
});

export const attendanceDailyRewardPopupCloseDetector =
    createTemplateMatchDetector({
        detectorId: "attendance-daily-reward-popup-close-button",
        template: templates.closeButtonReward,
        screenshotLabel: "detect_attendance_daily_reward_popup_close",
        overlayLabel: "attendance-daily-reward-popup-close",
        roi: AttendanceConfig.detectors.dailyRewardCloseButton.roi,
        buildMessage: ({ matched, score }) =>
            `ATTENDANCE DAILY REWARD CLOSE BUTTON => ${matched ? "MATCH" : "MISS"} (${score.toFixed(3)})`,
    });
