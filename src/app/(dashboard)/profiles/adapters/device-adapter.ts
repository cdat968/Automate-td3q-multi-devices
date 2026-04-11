import { AutomationTarget } from "../types/automation-step";

export interface DeviceAdapter {
    click(target: AutomationTarget): Promise<void>;
    input(target: AutomationTarget, text: string): Promise<void>;
    wait(durationMs: number): Promise<void>;
    detect(
        target: AutomationTarget,
        options?: { timeoutMs?: number },
    ): Promise<boolean>;
    screenshot(): Promise<string>;
    emitLog?(message: string): void;
}
