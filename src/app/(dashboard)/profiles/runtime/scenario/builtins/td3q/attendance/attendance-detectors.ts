import {
    attendanceDailyRewardPopupCloseDetector,
    attendanceDailyRewardPopupDetector,
    attendanceIconDetector,
    attendancePopupAnchorDetector,
    attendancePopupCloseButtonDetector,
    attendancePopupVerifyDetector,
} from "../../../features/attendance/attendance-detectors";
import { attendanceMilestoneClaimableDetector } from "../../../features/attendance/attendance-milestone-detector";
import {
    createAttendanceTodayDetectors,
    type ClassifyAttendanceTodayCell,
} from "../../../features/attendance/attendance-today-detectors";

import { getOrCreateAttendanceMilestoneScan } from "../../../features/attendance/attendance-milestone-cache";
import type { ExecutionContext } from "@scenario/scenario-types";
import {
    normalizeAttendanceDetectionResult,
    type AttendanceDetectionResult,
} from "./attendance-detector-contract";

type RawAttendanceDetectionResult = boolean | AttendanceDetectionResult;

type RawAttendanceDetector = {
    detect: (ctx: ExecutionContext) => Promise<RawAttendanceDetectionResult>;
};

type NormalizedDetector = {
    detect: (ctx: ExecutionContext) => Promise<AttendanceDetectionResult>;
};

function wrapDetector(
    detector: RawAttendanceDetector,
    detectorId: string,
): NormalizedDetector {
    return {
        async detect(ctx) {
            const result = await detector.detect(ctx);
            return normalizeAttendanceDetectionResult(result, { detectorId });
        },
    };
}

export function getAttendanceDetectors(
    classifyAttendanceTodayCell: ClassifyAttendanceTodayCell,
) {
    const { attendanceTodayClaimableDetector, attendanceTodayDoneDetector } =
        createAttendanceTodayDetectors(classifyAttendanceTodayCell);

    async function scanAttendanceMilestoneCached(
        ctx: ExecutionContext,
    ): Promise<AttendanceDetectionResult> {
        const result = await getOrCreateAttendanceMilestoneScan(ctx, () =>
            attendanceMilestoneClaimableDetector.detect(ctx),
        );
        return normalizeAttendanceDetectionResult(result, {
            detectorId: "attendance.milestone.cached-scan",
        });
    }

    return {
        attendanceIcon: wrapDetector(attendanceIconDetector, "attendance.icon"),
        popupVerify: wrapDetector(
            attendancePopupVerifyDetector,
            "attendance.popup-verify",
        ),
        popupAnchor: wrapDetector(
            attendancePopupAnchorDetector,
            "attendance.popup-anchor",
        ),
        todayClaimable: wrapDetector(
            attendanceTodayClaimableDetector,
            "attendance.today-claimable",
        ),
        todayDone: wrapDetector(
            attendanceTodayDoneDetector,
            "attendance.today-done",
        ),
        dailyRewardPopup: wrapDetector(
            attendanceDailyRewardPopupDetector,
            "attendance.daily-reward-popup",
        ),
        dailyRewardClose: wrapDetector(
            attendanceDailyRewardPopupCloseDetector,
            "attendance.daily-reward-close",
        ),
        milestoneClaimable: wrapDetector(
            attendanceMilestoneClaimableDetector,
            "attendance.milestone-claimable",
        ),
        popupCloseButton: wrapDetector(
            attendancePopupCloseButtonDetector,
            "attendance.popup-close-button",
        ),
        scanAttendanceMilestoneCached,
    };
}

export type AttendanceDetectors = ReturnType<typeof getAttendanceDetectors>;
