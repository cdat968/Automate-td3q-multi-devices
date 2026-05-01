import type { StateDetectionResult } from "@diagnostics/diagnostic-types";

export type AttendanceDetectionResult = StateDetectionResult;

export function createAttendanceNoMatchFromResult(
    result: AttendanceDetectionResult,
    options: {
        detectorId: string;
        message: string;
        meta?: Record<string, unknown>;
    },
): AttendanceDetectionResult {
    return {
        ...result,
        matched: false,
        confidence: result.confidence ?? 0,
        message: options.message,
        meta: {
            ...(result.meta ?? {}),
            detectorId: options.detectorId,
            ...(options.meta ?? {}),
        },
    };
}

export function isAttendanceMatched(
    result: boolean | StateDetectionResult,
): boolean {
    if (typeof result === "boolean") {
        return result;
    }
    return result.matched;
}

export function createAttendanceNoMatchResult(options?: {
    detectorId?: string;
    message?: string;
    meta?: Record<string, unknown>;
}): AttendanceDetectionResult {
    const meta: Record<string, unknown> = {};
    if (options?.detectorId) {
        meta.detectorId = options.detectorId;
    }
    if (options?.meta) {
        Object.assign(meta, options.meta);
    }

    return {
        matched: false,
        confidence: 0,
        message: options?.message || "No match",
        meta: Object.keys(meta).length > 0 ? meta : undefined,
    };
}

export function createAttendanceMatchResult(options?: {
    detectorId?: string;
    message?: string;
    meta?: Record<string, unknown>;
    confidence?: number;
}): AttendanceDetectionResult {
    const meta: Record<string, unknown> = {};
    if (options?.detectorId) {
        meta.detectorId = options.detectorId;
    }
    if (options?.meta) {
        Object.assign(meta, options.meta);
    }

    return {
        matched: true,
        confidence: options?.confidence ?? 1,
        message: options?.message || "Matched",
        meta: Object.keys(meta).length > 0 ? meta : undefined,
    };
}

export function normalizeAttendanceDetectionResult(
    result: boolean | StateDetectionResult,
    options?: {
        detectorId?: string;
        matchedMessage?: string;
        unmatchedMessage?: string;
        meta?: Record<string, unknown>;
    },
): AttendanceDetectionResult {
    const meta: Record<string, unknown> = { ...options?.meta };
    if (options?.detectorId) {
        meta.detectorId = options.detectorId;
    }

    if (typeof result === "boolean") {
        return result
            ? createAttendanceMatchResult({
                  detectorId: options?.detectorId,
                  message: options?.matchedMessage,
                  meta: options?.meta,
              })
            : createAttendanceNoMatchResult({
                  detectorId: options?.detectorId,
                  message: options?.unmatchedMessage,
                  meta: options?.meta,
              });
    }

    // It's already an object, preserve its fields and merge meta
    const finalMeta = { ...result.meta, ...meta };

    return {
        ...result,
        meta: Object.keys(finalMeta).length > 0 ? finalMeta : undefined,
        message:
            result.message ||
            (result.matched
                ? options?.matchedMessage
                : options?.unmatchedMessage),
    };
}
