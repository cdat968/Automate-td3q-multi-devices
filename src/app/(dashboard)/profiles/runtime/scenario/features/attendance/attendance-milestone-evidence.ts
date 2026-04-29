import type {
    DiagnosticAttachment,
    DiagnosticOverlayMeta,
    StateDetectionResult,
} from "../../../../diagnostics/diagnostic-types";

function resolveMilestoneEvidenceScreenshotPath(
    result: StateDetectionResult,
): string | undefined {
    return (
        result.screenshotPath ??
        result.overlays?.find((overlay) => overlay.screenshotPath)
            ?.screenshotPath ??
        result.attachments?.find(
            (attachment) => attachment.role === "screenshot_raw",
        )?.path
    );
}

function normalizeMilestoneOverlayScreenshotPath(
    overlays: DiagnosticOverlayMeta[] | undefined,
    screenshotPath: string | undefined,
): DiagnosticOverlayMeta[] | undefined {
    if (!overlays || !screenshotPath) {
        return overlays;
    }

    return overlays.map((overlay) => ({
        ...overlay,
        screenshotPath: overlay.screenshotPath ?? screenshotPath,
    }));
}

export function forwardMilestoneScanEvidence(
    result: StateDetectionResult,
    params: {
        detectorId: string;
        extraMeta?: Record<string, unknown>;
    },
): Pick<
    StateDetectionResult,
    "screenshotPath" | "attachments" | "overlays" | "meta"
> {
    const screenshotPath = resolveMilestoneEvidenceScreenshotPath(result);
    const overlays = normalizeMilestoneOverlayScreenshotPath(
        result.overlays,
        screenshotPath,
    );

    const attachments: DiagnosticAttachment[] = [...(result.attachments ?? [])];

    return {
        screenshotPath,
        attachments,
        overlays,
        meta: {
            ...(result.meta ?? {}),
            ...(params.extraMeta ?? {}),
            detectorId: params.detectorId,
            milestoneScanMatched: result.matched,
            evidenceScreenshotPathResolved: Boolean(screenshotPath),
        },
    };
}
