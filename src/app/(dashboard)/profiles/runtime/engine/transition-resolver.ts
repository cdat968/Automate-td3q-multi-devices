import type {
    ExecutionContext,
    ScenarioTransition,
} from "../scenario/scenario-types";
import type { RuntimeStateSnapshot } from "../state/runtime-state";

export interface TransitionResolver {
    resolve(
        ctx: ExecutionContext,
        state: RuntimeStateSnapshot,
    ): Promise<ScenarioTransition | null>;
}

export class PriorityTransitionResolver implements TransitionResolver {
    constructor(private readonly transitions: ScenarioTransition[]) {}

    async resolve(
        ctx: ExecutionContext,
        state: RuntimeStateSnapshot,
    ): Promise<ScenarioTransition | null> {
        const candidates = this.transitions
            .filter((transition) => {
                return (
                    transition.from === state.id ||
                    transition.from === "UNKNOWN"
                );
            })
            .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

        // ctx.timeline.record({
        //     type: "TRANSITION_CANDIDATES",
        //     timestamp: new Date().toISOString(),
        //     iteration: ctx.iteration,
        //     state,
        //     message: `Found ${candidates.length} transition candidates`,
        //     meta: {
        //         candidateIds: candidates.map((t) => t.id),
        //     },
        // });

        for (const transition of candidates) {
            if (!transition.canRun) {
                ctx.timeline.record({
                    type: "TRANSITION_SELECTED",
                    timestamp: new Date().toISOString(),
                    iteration: ctx.iteration,
                    state,
                    transitionId: transition.id,
                    message: "Selected transition without guard",
                });
                return transition;
            }

            const guard = await transition.canRun(ctx, state);
            if (guard.allowed) {
                ctx.timeline.record({
                    type: "TRANSITION_SELECTED",
                    timestamp: new Date().toISOString(),
                    iteration: ctx.iteration,
                    state,
                    transitionId: transition.id,
                    message: "Transition guard passed",
                    meta: guard.meta,
                });
                return transition;
            }

            ctx.timeline.record({
                type: "TRANSITION_BLOCKED",
                timestamp: new Date().toISOString(),
                iteration: ctx.iteration,
                state,
                transitionId: transition.id,
                message: guard.reason ?? "Transition blocked",
                meta: guard.meta,
            });
        }

        return null;
    }
}
