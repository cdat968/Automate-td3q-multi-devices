import type { OverlayShape } from "./overlay/overlay-types";

// ─── Source ────────────────────────────────────────────────────────────────

/**
 * Which part of the engine produced this diagnostic record.
 * "engine" and "transition" are forward-compatible placeholders.
 */
export type DiagnosticSource = "detector" | "action" | "engine" | "transition";

// ─── Kind ──────────────────────────────────────────────────────────────────

/**
 * Fine-grained category of diagnostic event.
 * New producers just add new kinds here — no core changes needed.
 */
export type DiagnosticKind =
    // detector
    | "state_rule_match"
    | "state_rule_miss"
    | "state_rule_error"
    // action
    | "action_executed"
    | "action_failed"
    | "action_skipped"
    // artifact
    | "screenshot_captured"
    | "overlay_rendered"
    // engine / transition (forward-compat)
    | "engine_event"
    | "transition_event";

// ─── Attachment ─────────────────────────────────────────────────────────────

/**
 * Reference to a persisted artifact file.
 * Collectors store paths; consumers decide when to open/render them.
 */
export type DiagnosticAttachmentRole =
    | "screenshot_raw"
    | "screenshot_annotated"
    | "screenshot_roi"
    | "json_dump"
    | "other";

export interface DiagnosticAttachment {
    role: DiagnosticAttachmentRole;
    /** Absolute filesystem path to the artifact file. */
    path: string;
    /** Optional human-readable description. */
    description?: string;
}

// ─── Overlay metadata ───────────────────────────────────────────────────────

/**
 * Well-defined purposes for overlays to ensure consistent UI categorization.
 */
export type DiagnosticOverlayPurpose =
    | "before_action"
    | "after_action"
    | "detector_match"
    | "debug_view"
    | "other";

/**
 * Structured overlay shapes + the source screenshot they should be drawn on.
 */
export interface DiagnosticOverlayMeta {
    /**
     * The role of this overlay (e.g., "before_action", "after_action").
     * Required to distinguish multiple views in a single record.
     */
    purpose: DiagnosticOverlayPurpose;
    /** Absolute path to the raw screenshot to annotate. */
    screenshotPath?: string;
    /** Shapes to composite on top of screenshotPath. */
    shapes: OverlayShape[];
    /** Optional human-readable note shown in the overlay header. */
    renderNote?: string;
}

// ─── Detector Result ─────────────────────────────────────────────────────────

/**
 * Enriched result from a state detection rule.
 * Allows rule authors to return boxes, confidence, and attachments
 * instead of just a raw boolean.
 */
export interface StateDetectionResult {
    matched: boolean;
    /** Confidence score (0..1) or visual match score. */
    confidence?: number;
    /** Screen-space bounding box of the detection. */
    matchBox?: { x: number; y: number; width: number; height: number };
    /** Optional path to the screenshot used for this specific detection. */
    screenshotPath?: string;
    /** Optional custom message for this detection. */
    message?: string;
    /** Arbitrary metadata. */
    meta?: Record<string, unknown>;
    /** Optional attachments specifically from the rule. */
    attachments?: DiagnosticAttachment[];
    /** Optional overlays specifically from the rule. */
    overlays?: DiagnosticOverlayMeta[];
}

// ─── Payload types ──────────────────────────────────────────────────────────

/** Payload carried by detector-sourced records. */
export interface DetectorDiagnosticPayload {
    detectorRuleId: string;
    targetState: string;
    matched: boolean;
    /** Visual match score if applicable (e.g. template confidence). */
    score?: number;
    /** Screen-space bounding box of the match, if available. */
    matchBox?: { x: number; y: number; width: number; height: number };
    /** Additional structured data from the detector. */
    meta?: Record<string, unknown>;
}

/** Payload carried by action-sourced records. */
export interface ActionDiagnosticPayload {
    actionId: string;
    actionKind: string;
    ok: boolean;
    message?: string;
    /** DOM/visual target identifier. */
    targetId?: string;
    /** Structured evidence forwarded from ActionExecutionResult. */
    evidence?: Record<string, unknown>;
}

/** Payload carried by engine / transition records (forward-compat). */
export interface EngineEventPayload {
    eventType: string;
    meta?: Record<string, unknown>;
}

// ─── Discriminated payload union ─────────────────────────────────────────────

export type DiagnosticPayload =
    | ({ source: "detector" } & DetectorDiagnosticPayload)
    | ({ source: "action" } & ActionDiagnosticPayload)
    | ({ source: "engine" | "transition" } & EngineEventPayload);

// ─── Record ──────────────────────────────────────────────────────────────────

/**
 * A single normalized diagnostic event emitted by any producer.
 * Both detector and action diagnostics use this shape.
 */
export interface DiagnosticRecord {
    /** Unique record identifier (nanoid or uuid-style). */
    id: string;
    timestamp: string;

    scenarioId: string;
    iteration: number;
    source: DiagnosticSource;
    kind: DiagnosticKind;

    /** State this record is associated with, if applicable. */
    stateId?: string;
    /** Transition this record is associated with, if applicable. */
    transitionId?: string;
    /** Action id, if action-sourced. */
    actionId?: string;
    /** Detector rule id, if detector-sourced. */
    detectorRuleId?: string;

    /** Short human-readable description. */
    message?: string;

    /**
     * Structured typed payload. Discriminated by source.
     * Consumers can narrow by record.source to get the typed payload.
     */
    payload: DiagnosticPayload;

    /** References to persisted artifact files (screenshots, JSONs, etc.). */
    attachments: DiagnosticAttachment[];

    /**
     * Plural overlay metadata. If present, shapes CAN be rendered onto
     * the respective screenshotPath later.
     */
    overlays: DiagnosticOverlayMeta[];
}

// ─── Emit input ──────────────────────────────────────────────────────────────

/**
 * Input to DiagnosticCollector.emit().
 * `id` and `timestamp` are generated by the collector if not supplied.
 */
export type DiagnosticEmitInput = Omit<
    DiagnosticRecord,
    "id" | "timestamp" | "overlays" | "attachments"
> & {
    id?: string;
    timestamp?: string;
    overlays?: DiagnosticOverlayMeta[];
    attachments?: DiagnosticAttachment[];
};
