import type { DiagnosticRecord, DiagnosticEmitInput } from "./diagnostic-types";

// ─── Interface ───────────────────────────────────────────────────────────────

/**
 * Contract for any diagnostic collector.
 *
 * Producers call emit(); consumers call getRecords().
 * flush() is optional — in-memory collectors don't need it.
 * Future implementations could flush to disk / send to a UI websocket.
 */
export interface DiagnosticCollector {
    emit(input: DiagnosticEmitInput): void;
    getRecords(): DiagnosticRecord[];
    /** Optional: persist/send buffered records. */
    flush?(): Promise<void>;
}

// ─── ID generation ────────────────────────────────────────────────────────────

let _seq = 0;

/**
 * Lightweight sequential ID — no external dependency.
 * Sufficient for in-process, same-run records.
 */
function generateRecordId(): string {
    _seq += 1;
    const ts = Date.now().toString(36);
    const sq = _seq.toString(36).padStart(4, "0");
    return `diag_${ts}_${sq}`;
}

// ─── In-memory implementation ─────────────────────────────────────────────────

/**
 * Default collector: stores all diagnostic records in memory.
 *
 * Usage:
 *   const collector = new InMemoryDiagnosticCollector();
 *   ctx.diagnostics = collector;
 *   // later:
 *   const records = collector.getRecords();
 */
export class InMemoryDiagnosticCollector implements DiagnosticCollector {
    private readonly records: DiagnosticRecord[] = [];

    emit(input: DiagnosticEmitInput): void {
        // Strict Validation: payload source must match record source
        if (input.payload.source !== input.source) {
            throw new Error(
                `DIAGNOSTIC_SOURCE_MISMATCH: record.source is "${input.source}" but payload.source is "${input.payload.source}"`,
            );
        }

        const record: DiagnosticRecord = {
            id: input.id ?? generateRecordId(),
            timestamp: input.timestamp ?? new Date().toISOString(),
            scenarioId: input.scenarioId,
            iteration: input.iteration,
            source: input.source,
            kind: input.kind,
            stateId: input.stateId,
            transitionId: input.transitionId,
            actionId: input.actionId,
            detectorRuleId: input.detectorRuleId,
            message: input.message,
            payload: input.payload,
            attachments: input.attachments ?? [],
            overlays: input.overlays ?? [],
        };
        this.records.push(record);
    }

    getRecords(): DiagnosticRecord[] {
        return [...this.records];
    }

    /** Filter helper — not part of the interface, but kept for convenience. */
    getRecordsBySource(
        source: DiagnosticRecord["source"],
    ): DiagnosticRecord[] {
        return this.records.filter((r) => r.source === source);
    }

    /** Filter helper — not part of the interface, but kept for convenience. */
    getRecordsByKind(
        kind: DiagnosticRecord["kind"],
    ): DiagnosticRecord[] {
        return this.records.filter((r) => r.kind === kind);
    }
}
