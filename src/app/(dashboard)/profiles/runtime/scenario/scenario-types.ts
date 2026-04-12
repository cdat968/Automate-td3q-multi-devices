import type {
    RuntimeStateId,
    RuntimeStateSnapshot,
} from "../state/runtime-state";
import type {
    RuntimeAction,
    ActionExecutionResult,
} from "../actions/action-types";
import type { DeviceAdapter } from "../adapters/device-adapter";
import type { TimelineRecorder } from "../timeline/timeline-recorder";
import type { DiagnosticCollector } from "../../diagnostics/diagnostic-collector";

export interface ExecutionContext {
    adapter: DeviceAdapter;
    timeline: TimelineRecorder;
    scenario: ScenarioDefinition;
    variables: Record<string, string>;
    iteration: number;
    signal?: AbortSignal;
    /**
     * Optional shared diagnostics collector.
     * Producers (detector, action executor) emit structured DiagnosticRecords here.
     * Omitting it is safe — all emit calls are guarded with optional chaining.
     */
    diagnostics?: DiagnosticCollector;
    /**
     * Runtime variable mutation hook for orchestration-style flags.
     * Use sparingly for scenario-level verification gates.
     */
    setVariable?: (key: string, value: string) => void;
}

export interface TransitionGuardResult {
    allowed: boolean;
    reason?: string;
    meta?: Record<string, unknown>;
}

export interface ScenarioTransition {
    id: string;
    from: RuntimeStateId;
    to: RuntimeStateId | "SELF" | "ANY";
    priority?: number;

    canRun?: (
        ctx: ExecutionContext,
        state: RuntimeStateSnapshot,
    ) => Promise<TransitionGuardResult>;

    buildAction: (
        ctx: ExecutionContext,
        state: RuntimeStateSnapshot,
    ) => Promise<RuntimeAction>;

    verifyAfterRun?: (
        ctx: ExecutionContext,
        before: RuntimeStateSnapshot,
        result: ActionExecutionResult,
    ) => Promise<boolean>;
}

import type { StateDetectionResult } from "../../diagnostics/diagnostic-types";

export interface StateDetectionRule {
    id: string;
    state: RuntimeStateId;
    detect: (ctx: ExecutionContext) => Promise<boolean | StateDetectionResult>;
    confidence?: number;
    meta?: Record<string, unknown>;
}

export interface ScenarioDefinition {
    id: string;
    name: string;
    version: string;
    initialState?: RuntimeStateId;
    maxIterations?: number;
    idleIterationLimit?: number;
    detectionRules: StateDetectionRule[];
    transitions: ScenarioTransition[];
}
