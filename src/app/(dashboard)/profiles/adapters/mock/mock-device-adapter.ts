import { AutomationTarget } from "../../types/automation-step";
import { DeviceAdapter } from "../device-adapter";

export interface MockAdapterOptions {
    shouldFail?: boolean;
    failureMessage?: string;
    detectResult?: boolean;
}

export class MockDeviceAdapter implements DeviceAdapter {
    private logs: string[] = [];
    private options: MockAdapterOptions;

    constructor(options: MockAdapterOptions = {}) {
        this.options = {
            shouldFail: false,
            detectResult: true,
            ...options
        };
    }

    private formatTarget(target: AutomationTarget): string {
        switch (target.kind) {
            case "dom":
                return `dom("${target.selector}")${target.useXpath ? " [xpath]" : ""}`;
            case "visual-template":
                return `visual-template(asset=${target.assetId})`;
            case "visual-feature":
                return `visual-feature(asset=${target.assetId})`;
            case "ocr-text":
                return `ocr-text("${target.text}")`;
            case "point":
                return `point(x=${target.x}, y=${target.y}, space=${target.space})`;
            default: {
                const _exhaustiveCheck: never = target;
                return `UnknownTarget(${JSON.stringify(_exhaustiveCheck)})`;
            }
        }
    }

    async click(target: AutomationTarget): Promise<void> {
        this.emitLog(`Mock Click: ${this.formatTarget(target)}`);
        if (this.options.shouldFail) throw new Error(this.options.failureMessage || "Mock Click failed");
        return Promise.resolve();
    }

    async input(target: AutomationTarget, text: string): Promise<void> {
        this.emitLog(`Mock Input: "${text}" into ${this.formatTarget(target)}`);
        if (this.options.shouldFail) throw new Error(this.options.failureMessage || "Mock Input failed");
        return Promise.resolve();
    }

    async wait(durationMs: number): Promise<void> {
        this.emitLog(`Mock Wait: ${durationMs}ms`);
        return new Promise((resolve) => setTimeout(resolve, durationMs));
    }

    async detect(target: AutomationTarget, options?: { timeoutMs?: number }): Promise<boolean> {
        this.emitLog(`Mock Detect: ${this.formatTarget(target)} (timeout: ${options?.timeoutMs || 0}ms)`);
        return Promise.resolve(this.options.detectResult ?? true);
    }

    async screenshot(): Promise<string> {
        const path = `/tmp/mock-screenshot-${Date.now()}.png`;
        this.emitLog(`Mock Screenshot: ${path}`);
        return Promise.resolve(path);
    }

    emitLog(message: string): void {
        const timestamp = new Date().toISOString();
        this.logs.push(`[${timestamp}] ${message}`);
        console.log(`[MockDevice] ${message}`);
    }

    getLogs(): string[] {
        return [...this.logs];
    }
}
