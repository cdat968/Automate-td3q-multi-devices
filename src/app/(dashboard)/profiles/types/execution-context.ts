import { StepExecutionResult } from "./execution-result";

export type ExecutionPlatform = "windows" | "android" | "mock";

export type ExecutionVariables = Record<string, unknown>;
export type ExecutionMemory = Record<string, unknown>;

export interface ExecutionContext {
    runId: string;
    profileId: string;
    deviceId: string;
    platform: ExecutionPlatform;
    variables: ExecutionVariables;
    memory: ExecutionMemory;
    now: number;
    lastResult?: StepExecutionResult;
    onEvent?: (event: import("./execution-event").ExecutionEvent) => void;
}
