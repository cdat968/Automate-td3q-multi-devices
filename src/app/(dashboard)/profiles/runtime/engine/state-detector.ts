import type {
    ExecutionContext,
    StateDetectionRule,
} from "../scenario/scenario-types";
import type { RuntimeStateSnapshot } from "../state/runtime-state";

export interface StateDetector {
    detect(ctx: ExecutionContext): Promise<RuntimeStateSnapshot>;
}

export class RuleBasedStateDetector implements StateDetector {
    constructor(private readonly rules: StateDetectionRule[]) {}

    async detect(ctx: ExecutionContext): Promise<RuntimeStateSnapshot> {
        for (const rule of this.rules) {
            let matched = false;
            try {
                matched = await rule.detect(ctx);
            } catch (error) {
                ctx.timeline.record({
                    type: "STATE_RULE_ERROR",
                    timestamp: new Date().toISOString(),
                    iteration: ctx.iteration,
                    state: { id: "UNKNOWN", confidence: 0 },
                    message:
                        error instanceof Error ? error.message : String(error),
                    meta: {
                        detectionRuleId: rule.id,
                        targetState: rule.state,
                    },
                });
                continue;
            }

            // ctx.timeline.record({
            //     type: "STATE_RULE_EVALUATED",
            //     timestamp: new Date().toISOString(),
            //     iteration: ctx.iteration,
            //     state: { id: "UNKNOWN", confidence: 0 },
            //     message: `Rule ${rule.id} => ${matched ? "MATCH" : "MISS"}`,
            //     meta: {
            //         detectionRuleId: rule.id,
            //         targetState: rule.state,
            //     },
            // });

            if (matched) {
                return {
                    id: rule.state,
                    confidence: rule.confidence ?? 1,
                    meta: {
                        detectionRuleId: rule.id,
                        ...(rule.meta ?? {}),
                    },
                };
            }
        }

        return {
            id: "UNKNOWN",
            confidence: 0,
        };
    }
}
