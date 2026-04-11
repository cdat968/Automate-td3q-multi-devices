/**
 * diagnostic-emitters.ts
 *
 * High-level functions for producers to emit diagnostic records.
 */

import type { DiagnosticCollector } from "./diagnostic-collector";
import type {
    DiagnosticAttachment,
    DiagnosticOverlayMeta,
    DetectorDiagnosticPayload,
    ActionDiagnosticPayload,
} from "./diagnostic-types";

// ─── Detector emitter ────────────────────────────────────────────────────────

export interface EmitDetectorDiagnosticInput {
    collector: DiagnosticCollector;
    scenarioId: string;
    iteration: number;
    detectorRuleId: string;
    targetState: string;
    matched: boolean;
    message?: string;
    score?: number;
    matchBox?: { x: number; y: number; width: number; height: number };
    meta?: Record<string, unknown>;
    /** Optional direct attachments from the detector (e.g. screenshots). */
    attachments?: DiagnosticAttachment[];
    /** Plural overlays for the match. */
    overlays?: DiagnosticOverlayMeta[];
}

/**
 * Emits a structured detector record.
 */
export function emitDetectorDiagnostic(
    input: EmitDetectorDiagnosticInput,
): void {
    const payload: { source: "detector" } & DetectorDiagnosticPayload = {
        source: "detector",
        detectorRuleId: input.detectorRuleId,
        targetState: input.targetState,
        matched: input.matched,
        score: input.score,
        matchBox: input.matchBox,
        meta: input.meta,
    };

    input.collector.emit({
        scenarioId: input.scenarioId,
        iteration: input.iteration,
        source: "detector",
        kind: input.matched ? "state_rule_match" : "state_rule_miss",
        stateId: input.matched ? input.targetState : undefined,
        detectorRuleId: input.detectorRuleId,
        message:
            input.message ??
            `Rule ${input.detectorRuleId} => ${input.matched ? "MATCH" : "MISS"}${
                input.score !== undefined
                    ? ` (score ${input.score.toFixed(3)})`
                    : ""
            }`,
        payload,
        attachments: input.attachments ?? [],
        overlays: input.overlays ?? [],
    });
}

export interface EmitDetectorErrorInput {
    collector: DiagnosticCollector;
    scenarioId: string;
    iteration: number;
    detectorRuleId: string;
    targetState: string;
    error: unknown;
}

/**
 * Emits a detector error record.
 */
export function emitDetectorError(input: EmitDetectorErrorInput): void {
    const message =
        input.error instanceof Error ? input.error.message : String(input.error);

    const payload: { source: "detector" } & DetectorDiagnosticPayload = {
        source: "detector",
        detectorRuleId: input.detectorRuleId,
        targetState: input.targetState,
        matched: false,
        meta: { error: message },
    };

    input.collector.emit({
        scenarioId: input.scenarioId,
        iteration: input.iteration,
        source: "detector",
        kind: "state_rule_error",
        detectorRuleId: input.detectorRuleId,
        message: `Rule ${input.detectorRuleId} threw: ${message}`,
        payload,
        attachments: [],
        overlays: [],
    });
}

// ─── Action emitter ──────────────────────────────────────────────────────────

export interface EmitActionDiagnosticInput {
    collector: DiagnosticCollector;
    scenarioId: string;
    iteration: number;
    actionId: string;
    actionKind: string;
    ok: boolean;
    message?: string;
    targetId?: string;
    evidence?: Record<string, unknown>;
    attachments?: DiagnosticAttachment[];
    overlays?: DiagnosticOverlayMeta[];
}

/**
 * Emits a generic action record.
 * Specialized results (like ClickRelativePoint) pass their rich metadata
 * through attachments and overlays.
 */
export function emitActionDiagnostic(input: EmitActionDiagnosticInput): void {
    const payload: { source: "action" } & ActionDiagnosticPayload = {
        source: "action",
        actionId: input.actionId,
        actionKind: input.actionKind,
        ok: input.ok,
        message: input.message,
        targetId: input.targetId,
        evidence: input.evidence,
    };

    input.collector.emit({
        scenarioId: input.scenarioId,
        iteration: input.iteration,
        source: "action",
        kind: input.ok ? "action_executed" : "action_failed",
        actionId: input.actionId,
        message:
            input.message ??
            `Action ${input.actionId} (${input.actionKind}): ${input.ok ? "ok" : "failed"}`,
        payload,
        attachments: input.attachments ?? [],
        overlays: input.overlays ?? [],
    });
}
