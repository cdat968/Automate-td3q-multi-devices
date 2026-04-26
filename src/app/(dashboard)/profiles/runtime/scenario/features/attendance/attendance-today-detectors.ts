import type { ExecutionContext } from "../../scenario-types";
import {
    buildAttendanceSemanticDebugOverlay,
    type AttendanceDailyCellClassification,
} from "./attendance-daily-classification";

export type ClassifyAttendanceTodayCell = (
    ctx: ExecutionContext,
) => Promise<AttendanceDailyCellClassification>;

export function createAttendanceTodayDetectors(
    classifyAttendanceTodayCell: ClassifyAttendanceTodayCell,
) {
    const attendanceTodayClaimableDetector = {
        async detect(ctx: ExecutionContext) {
            const classified = await classifyAttendanceTodayCell(ctx);

            return {
                matched: classified.state === "READY",
                confidence:
                    classified.state === "READY"
                        ? Math.max(
                              Number(classified.meta.cyanRatio ?? 0),
                              Number(classified.meta.tomorrowScore ?? 0),
                          )
                        : 0,
                screenshotPath: classified.screenshotPath,
                attachments: classified.attachments,
                overlays: [
                    ...(classified.overlays ?? []),
                    ...buildAttendanceSemanticDebugOverlay(classified),
                ],
                message: `ATTENDANCE TODAY READY => ${
                    classified.state === "READY" ? "MATCH" : "MISS"
                } (${classified.reason})`,
                meta: {
                    detectorId: "attendance-today-claimable-classifier",
                    classificationState: classified.state,
                    classificationReason: classified.reason,
                    ...classified.meta,
                },
                matchBox: classified.matchBox,
            };
        },
    };

    const attendanceTodayDoneDetector = {
        async detect(ctx: ExecutionContext) {
            const classified = await classifyAttendanceTodayCell(ctx);

            console.log(
                `[ATTENDANCE][TODAY_DONE] state=${classified.state} reason=${classified.reason} tickMatched=${classified.meta.tickMatched} tickScore=${classified.meta.tickScore} tomorrowScore=${classified.meta.tomorrowScore} cyanRatio=${classified.meta.cyanRatio}`,
            );

            return {
                matched: classified.state === "DONE",
                confidence:
                    classified.state === "DONE"
                        ? Math.max(
                              Number(classified.meta.tickScore ?? 0),
                              Number(classified.meta.tomorrowScore ?? 0),
                          )
                        : 0,
                screenshotPath: classified.screenshotPath,
                attachments: classified.attachments,
                overlays: [
                    ...(classified.overlays ?? []),
                    ...buildAttendanceSemanticDebugOverlay(classified),
                ],
                message: `ATTENDANCE TODAY DONE => ${
                    classified.state === "DONE" ? "MATCH" : "MISS"
                } (${classified.reason})`,
                meta: {
                    detectorId: "attendance-today-done-classifier",
                    classificationState: classified.state,
                    classificationReason: classified.reason,
                    ...classified.meta,
                },
                matchBox: classified.matchBox,
            };
        },
    };

    return {
        attendanceTodayClaimableDetector,
        attendanceTodayDoneDetector,
    };
}
