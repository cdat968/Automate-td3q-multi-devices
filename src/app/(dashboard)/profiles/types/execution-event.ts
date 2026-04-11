import { StepExecutionResult, FlowExecutionResult } from "./execution-result";

export type ExecutionEvent =
    | { kind: "flow_started"; runId: string; profileId: string; timestamp: number }
    | { kind: "step_started"; stepId: string; timestamp: number }
    | { kind: "step_finished"; stepId: string; result: StepExecutionResult; timestamp: number }
    | { kind: "flow_finished"; runId: string; result: FlowExecutionResult; timestamp: number }
    | { kind: "log"; message: string; level: "info" | "warn" | "error"; timestamp: number };
