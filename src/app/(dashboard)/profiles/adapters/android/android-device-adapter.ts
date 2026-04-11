import type { AutomationTarget } from "../../types/automation-step";
import { DeviceAdapter } from "../device-adapter";

/**
 * Android-specific device adapter implementation.
 * Currently a structural draft simulating Android/mobile automation semantics.
 */
export class AndroidDeviceAdapter implements DeviceAdapter {
    private logs: string[] = [];

    /**
     * Simulates a mobile tap interaction.
     * Future: Will use ADB input tap or UIAutomator click pattern.
     */
    async click(target: AutomationTarget): Promise<void> {
        if (!target) throw new Error("Target selector is required");
        this.emitLog(`Android Tap -> ${this.formatTarget(target)}`);
        // Simulate mobile input latency (Dispatch / UI thread sync)
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    /**
     * Simulates text entry into a mobile element.
     * Future: Will use ADB input text or UIAutomator setText pattern.
     */
    async input(target: AutomationTarget, text: string): Promise<void> {
        if (!target) throw new Error("Target selector is required");
        this.emitLog(`Android SetText -> "${text}" into ${this.formatTarget(target)}`);
        // Simulate IME overhead and typing execution
        await new Promise(resolve => setTimeout(resolve, 400));
    }

    /**
     * Standard promise-based delay for mobile execution pacing.
     */
    async wait(durationMs: number): Promise<void> {
        this.emitLog(`Android Wait -> ${durationMs}ms`);
        await new Promise((resolve) => setTimeout(resolve, durationMs));
    }

    /**
     * Simulates mobile element detection.
     * Future: Will use UIAutomator selector matching or View hierarchy traversal.
     */
    async detect(target: AutomationTarget, options?: { timeoutMs?: number }): Promise<boolean> {
        if (!target) throw new Error("Target selector is required");
        const timeout = options?.timeoutMs ?? 0;
        this.emitLog(`Android Detect -> ${this.formatTarget(target)} (timeout: ${timeout}ms)`);
        
        // Simulate discovery search time
        await new Promise(resolve => setTimeout(resolve, Math.min(timeout, 250)));
        return true;
    }

    /**
     * Simulates Android screen capture.
     * Future: Will use screencap or MediaProjection API.
     */
    async screenshot(): Promise<string> {
        const path = `/sdcard/automation/screenshots/android-${Date.now()}.png`;
        this.emitLog(`Android Screenshot -> ${path}`);
        return path;
    }

    /**
     * Internal logger for recording Android runtime activities.
     */
    emitLog(message: string): void {
        const timestamp = new Date().toISOString();
        this.logs.push(`[${timestamp}] ${message}`);
    }

    /**
     * Exhaustive target formatter using Android/Mobile terminology.
     */
    private formatTarget(target: AutomationTarget): string {
        switch (target.kind) {
            case "dom":
                return `[selector: "${target.selector}"]`;
            case "visual-template":
                return `[template-asset: ${target.assetId}]`;
            case "visual-feature":
                return `[feature-asset: ${target.assetId}]`;
            case "ocr-text":
                return `[ocr-text: "${target.text}"]`;
            case "point":
                return `[tap-coord: (${target.x}, ${target.y})]`;
            default: {
                const _exhaustiveCheck: never = target;
                return String(_exhaustiveCheck);
            }
        }
    }

    /**
     * Returns a copy of the internal execution logs.
     */
    getLogs(): string[] {
        return [...this.logs];
    }
}
