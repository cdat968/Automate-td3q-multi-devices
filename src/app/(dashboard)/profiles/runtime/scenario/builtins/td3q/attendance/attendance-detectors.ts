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
import type { ExecutionContext } from "../../../scenario-types";

export function getAttendanceDetectors(
    classifyAttendanceTodayCell: ClassifyAttendanceTodayCell,
) {
    const { attendanceTodayClaimableDetector, attendanceTodayDoneDetector } =
        createAttendanceTodayDetectors(classifyAttendanceTodayCell);

    async function scanAttendanceMilestoneCached(ctx: ExecutionContext) {
        return getOrCreateAttendanceMilestoneScan(ctx, () =>
            attendanceMilestoneClaimableDetector.detect(ctx),
        );
    }

    return {
        attendanceIcon: attendanceIconDetector,
        popupVerify: attendancePopupVerifyDetector,
        popupAnchor: attendancePopupAnchorDetector,
        todayClaimable: attendanceTodayClaimableDetector,
        todayDone: attendanceTodayDoneDetector,
        dailyRewardPopup: attendanceDailyRewardPopupDetector,
        dailyRewardClose: attendanceDailyRewardPopupCloseDetector,
        milestoneClaimable: attendanceMilestoneClaimableDetector,
        popupCloseButton: attendancePopupCloseButtonDetector,
        scanAttendanceMilestoneCached,
    };
}

export type AttendanceDetectors = ReturnType<typeof getAttendanceDetectors>;
