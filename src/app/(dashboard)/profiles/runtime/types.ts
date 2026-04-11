import type { 
    PersistedAutomationStep, 
    PersistedStepRuntimePolicy, 
    PersistedStepConfig,
    PersistedAutomationTarget,
    PersistedDetectionConfig,
    PersistedAssertionConfig,
    PersistedStepCondition
} from "../types/persisted-step";
import type { PersistedGameProfile } from "../types/persisted-profile";

/**
 * The interface for platform-specific device interaction.
 * Acts as the boundary between the platform-agnostic engine and real hardware/simulators.
 */
export interface DeviceAdapter {
    tap(stepId: string, target: PersistedAutomationTarget, detection?: PersistedDetectionConfig, options?: { signal?: AbortSignal }): Promise<StepActionResult>;
    input(stepId: string, target: PersistedAutomationTarget, value: string, detection?: PersistedDetectionConfig, options?: { signal?: AbortSignal }): Promise<StepActionResult>;
    wait(stepId: string, target: PersistedAutomationTarget, state: "visible" | "hidden" | "presence", detection?: PersistedDetectionConfig, options?: { signal?: AbortSignal }): Promise<StepActionResult>;
    navigate(stepId: string, url: string, options?: { signal?: AbortSignal }): Promise<StepActionResult>;
    screenshot(options?: { signal?: AbortSignal }): Promise<string>; // Returns base64 or path
}

/**
 * The source of truth for an active execution run.
 * Segregates static input variables from dynamic step-produced outputs.
 */
export interface RuntimeContext {
    readonly runId: string;
    readonly profileId: string;
    readonly startedAt: number;
    readonly signal: AbortSignal;
    readonly adapter: DeviceAdapter;
    readonly logger: RuntimeLogger;
    
    readonly variables: Record<string, unknown>; // Static inputs
    outputs: Record<string, unknown>;            // Dynamic step outputs
    
    emit: (event: RuntimeEvent) => void;
}

export interface RuntimeLogger {
    log(message: string, level: "info" | "warn" | "error"): void;
}

/**
 * Dot-separated event taxonomy for ingress and telemetry.
 */
export type RuntimeEvent =
    | { type: "run.started"; runId: string; profileId: string; variables: Record<string, unknown>; timestamp: number }
    | { type: "run.completed"; runId: string; result: ProfileRunResult; timestamp: number }
    | { type: "run.failed"; runId: string; error: { message: string; stack?: string }; failedStepId?: string; timestamp: number }
    | { type: "step.started"; runId: string; stepId: string; attempt: number; timestamp: number }
    | { type: "step.succeeded"; runId: string; stepId: string; attempt: number; result: StepActionResult; durationMs: number; timestamp: number }
    | { type: "step.failed"; runId: string; stepId: string; attempt: number; error: { code: string; message: string }; durationMs: number; timestamp: number }
    | { type: "step.cancelled"; runId: string; stepId: string; attempt: number; timestamp: number }
    | { type: "step.skipped"; runId: string; stepId: string; condition: PersistedStepCondition | null | undefined; timestamp: number }
    | { type: "assertion.failed"; runId: string; stepId: string; assertionId: string; actual: unknown; expected: unknown; timestamp: number }
    | { type: "log"; runId: string; stepId?: string; level: "info" | "warn" | "error"; message: string; timestamp: number };

/**
 * The boundary result between Handlers and Adapters.
 */
export interface StepActionResult {
    ok: boolean;
    output?: Record<string, unknown>;
    evidence?: { screenshot?: string; logs?: string[] };
    error?: { code: string; message: string };
    meta?: Record<string, unknown>; // Performance metrics, confidence, etc.
}

/**
 * Finalized result of a single step execution.
 */
export interface StepRunResult {
    stepId: string;
    status: "succeeded" | "failed" | "skipped" | "cancelled";
    startedAt: number;
    finishedAt: number;
    attempts: number;
    output?: Record<string, unknown>;
    error?: { code: string; message: string };
}

/**
 * Finalized result of a complete profile run.
 */
export interface ProfileRunResult {
    runId: string;
    profileId: string;
    status: "completed" | "failed" | "cancelled";
    startedAt: number;
    finishedAt: number;
    stepResults: StepRunResult[];
}
