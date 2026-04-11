import { AutomationTarget } from "./automation-step";

export type DeviceCommand = 
    | { kind: "click"; target: AutomationTarget }
    | { kind: "input"; target: AutomationTarget; value: string }
    | { kind: "wait"; durationMs: number }
    | { kind: "detect"; target: AutomationTarget; timeoutMs: number }
    | { kind: "screenshot"; label?: string };
