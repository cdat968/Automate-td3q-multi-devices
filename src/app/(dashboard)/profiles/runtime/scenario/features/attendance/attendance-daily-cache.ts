import type { ExecutionContext } from "../../scenario-types";
import type { AttendanceDailyCellClassification } from "./attendance-daily-classification";

type DailyClassificationCacheEntry = {
    iteration: number;
    value: Promise<AttendanceDailyCellClassification>;
};

const dailyClassificationCache = new WeakMap<
    ExecutionContext,
    DailyClassificationCacheEntry
>();

export function getOrCreateAttendanceDailyClassification(
    ctx: ExecutionContext,
    classify: () => Promise<AttendanceDailyCellClassification>,
): Promise<AttendanceDailyCellClassification> {
    const cached = dailyClassificationCache.get(ctx);

    if (cached?.iteration === ctx.iteration) {
        console.log(
            "[ATTENDANCE][DAILY_CACHE_HIT]",
            JSON.stringify({
                iteration: ctx.iteration,
            }),
        );

        return cached.value;
    }

    console.log(
        "[ATTENDANCE][DAILY_CACHE_MISS]",
        JSON.stringify({
            iteration: ctx.iteration,
        }),
    );

    const value = classify().catch((error) => {
        const current = dailyClassificationCache.get(ctx);

        if (current?.value === value) {
            dailyClassificationCache.delete(ctx);
        }

        throw error;
    });

    dailyClassificationCache.set(ctx, {
        iteration: ctx.iteration,
        value,
    });

    return value;
}
