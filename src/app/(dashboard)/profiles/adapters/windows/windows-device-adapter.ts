import type { AutomationTarget } from "../../types/automation-step";
import { DeviceAdapter } from "../device-adapter";

/**
 * Windows-specific device adapter implementation.
 * Currently a structural draft simulating Windows automation semantics.
 */
export class WindowsDeviceAdapter implements DeviceAdapter {
    private logs: string[] = [];

    /**
     * Simulates a Windows UI click event.
     * Future: Will use Win32 PostMessage or UI Automation Invoke pattern.
     */
    async click(target: AutomationTarget): Promise<void> {
        if (!target) throw new Error("Target selector is required");
        this.emitLog(`Windows Click -> ${this.formatTarget(target)}`);
        // Simulate system interaction delay (COM marshaling / Message queue)
        await new Promise(resolve => setTimeout(resolve, 150));
    }

    /**
     * Simulates Windows keyboard input.
     * Future: Will use SendInput or UI Automation ValuePattern.
     */
    async input(target: AutomationTarget, text: string): Promise<void> {
        if (!target) throw new Error("Target selector is required");
        this.emitLog(`Windows Input -> "${text}" into ${this.formatTarget(target)}`);
        // Simulate realistic typing delay
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    /**
     * Standard promise-based delay for execution pacing.
     */
    async wait(durationMs: number): Promise<void> {
        this.emitLog(`Windows Wait -> ${durationMs}ms`);
        await new Promise((resolve) => setTimeout(resolve, durationMs));
    }

    /**
     * Simulates Windows element detection.
     * Future: Will use UI Automation tree search / FindFirst.
     */
    async detect(target: AutomationTarget, options?: { timeoutMs?: number }): Promise<boolean> {
        if (!target) throw new Error("Target selector is required");
        const timeout = options?.timeoutMs ?? 0;
        this.emitLog(`Windows Detect -> ${this.formatTarget(target)} (timeout: ${timeout}ms)`);

        // Simulate element discovery overhead
        await new Promise(resolve => setTimeout(resolve, Math.min(timeout, 200)));
        return true;
    }

    /**
     * Simulates Windows screen capture.
     * Future: Will use GDI+ or Windows Graphics Capture API.
     */
    async screenshot(): Promise<string> {
        const path = `C:\\ProgramData\\Automation\\Screenshots\\win-${Date.now()}.png`;
        this.emitLog(`Windows Screenshot -> ${path}`);
        return path;
    }

    /**
     * Internal logger for recording adapter-specific activities.
     */
    emitLog(message: string): void {
        const timestamp = new Date().toISOString();
        this.logs.push(`[${timestamp}] ${message}`);
    }

    /**
     * Exhaustive target formatter using Windows-specific terminology.
     */
    private formatTarget(target: AutomationTarget): string {
        switch (target.kind) {
            case "dom":
                return `[Selector: "${target.selector}"]`;
            case "visual-template":
                return `[TemplateAsset: ${target.assetId}]`;
            case "visual-feature":
                return `[FeatureAsset: ${target.assetId}]`;
            case "ocr-text":
                return `[OcrText: "${target.text}"]`;
            case "point":
                return `[DesktopCoordinates: (${target.x}, ${target.y})]`;
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
