import type { ExecutionContext } from "../../runtime/scenario/scenario-types";
import { buildArtifactPath } from "./artifact-path";
import { writeBufferArtifact } from "./artifact-writer";

export interface CaptureScreenshotOptions {
    label?: string;
}

export async function captureScreenshotArtifact(
    ctx: ExecutionContext,
    options: CaptureScreenshotOptions,
): Promise<string | undefined> {
    if (!ctx.adapter.screenshot) {
        return undefined;
    }

    try {
        const raw = await ctx.adapter.screenshot(ctx.signal);
        const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);

        const timestamp = new Date()
            .toISOString()
            .replace(/:/g, "-")
            .replace(/\./g, "-");

        const fullPath = buildArtifactPath({
            scenarioId: ctx.scenario.id,
            timestamp,
            label: options.label ?? "screenshot",
            iteration: ctx.iteration,
            extension: "png",
        });

        await writeBufferArtifact(fullPath, buffer);
        return fullPath;
    } catch {
        return undefined;
    }
}
