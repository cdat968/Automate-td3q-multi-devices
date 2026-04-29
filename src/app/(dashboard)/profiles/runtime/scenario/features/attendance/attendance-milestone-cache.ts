import type { StateDetectionResult } from "../../../../diagnostics/diagnostic-types";
import type { ExecutionContext } from "../../scenario-types";

type MilestoneScanCacheEntry = {
    iteration: number;
    value: Promise<StateDetectionResult>;
};

const milestoneScanCache = new WeakMap<
    ExecutionContext,
    MilestoneScanCacheEntry
>();

export function getOrCreateAttendanceMilestoneScan(
    ctx: ExecutionContext,
    scan: () => Promise<StateDetectionResult>,
): Promise<StateDetectionResult> {
    const cached = milestoneScanCache.get(ctx);

    if (cached?.iteration === ctx.iteration) {
        console.log(
            "[MILESTONE][SCAN_CACHE_HIT]",
            JSON.stringify({
                iteration: ctx.iteration,
            }),
        );

        return cached.value;
    }

    console.log(
        "[MILESTONE][SCAN_CACHE_MISS]",
        JSON.stringify({
            iteration: ctx.iteration,
        }),
    );

    const value = scan().catch((error) => {
        const current = milestoneScanCache.get(ctx);

        if (current?.value === value) {
            milestoneScanCache.delete(ctx);
        }

        throw error;
    });

    milestoneScanCache.set(ctx, {
        iteration: ctx.iteration,
        value,
    });

    return value;
}
