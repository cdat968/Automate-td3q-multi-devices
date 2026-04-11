import type { RuntimeStateSnapshot } from "../state/runtime-state";

export type TimelineEventType =
    | "STATE_RULE_ERROR"
    | "STATE_RULE_EVALUATED"
    | "ENGINE_STARTED"
    | "ITERATION_STARTED"
    | "STATE_DETECTED"
    | "TRANSITION_SELECTED"
    | "TRANSITION_BLOCKED"
    | "ACTION_BUILT"
    | "ACTION_EXECUTED"
    | "ACTION_FAILED"
    | "STATE_UNCHANGED"
    | "ENGINE_COMPLETED"
    | "ENGINE_ABORTED"
    | "ENGINE_FAILED"
    | "TRANSITION_CANDIDATES";

export interface TimelineEvent {
    type: TimelineEventType;
    timestamp: string;
    iteration: number;
    state?: RuntimeStateSnapshot;
    transitionId?: string;
    actionId?: string;
    message?: string;
    meta?: Record<string, unknown>;
}
