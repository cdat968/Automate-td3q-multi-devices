import fs from "fs/promises";
import path from "path";
import type {
    RuntimeAction,
    ActionExecutionResult,
    ClickRelativePointAction,
} from "../actions/action-types";
import type { ExecutionContext } from "../scenario/scenario-types";
import { captureScreenshotArtifact } from "../../diagnostics/artifact/screenshot-helper";
import { createRelativeClickOverlayArtifacts } from "../actions/click-relative-point";

export interface ActionExecutor {
    execute(
        ctx: ExecutionContext,
        action: RuntimeAction,
    ): Promise<ActionExecutionResult>;
}

function isValidRatio(value: number): boolean {
    return Number.isFinite(value) && value >= 0 && value <= 1;
}

// async function saveScreenshotArtifact(
//     ctx: ExecutionContext,
//     label: string,
// ): Promise<string | undefined> {
//     if (!ctx.adapter.screenshot) {
//         return undefined;
//     }

//     try {
//         const buffer = await ctx.adapter.screenshot(ctx.signal);
//         const timestamp = new Date()
//             .toISOString()
//             .replace(/:/g, "-")
//             .replace(/\./g, "-");

//         const filename = `${timestamp}_${label}_iter${ctx.iteration}.png`;
//         const dir = path.join(process.cwd(), "artifacts", ctx.scenario.id);
//         const fullPath = path.join(dir, filename);

//         await fs.mkdir(dir, { recursive: true });
//         await fs.writeFile(fullPath, buffer);

//         return fullPath;
//     } catch {
//         return undefined;
//     }
// }

export class AdapterBackedActionExecutor implements ActionExecutor {
    async execute(
        ctx: ExecutionContext,
        action: RuntimeAction,
    ): Promise<ActionExecutionResult> {
        switch (action.kind) {
            case "NOOP":
                return { ok: true, message: "No operation" };

            case "WAIT":
                await ctx.adapter.wait(action.durationMs, ctx.signal);
                return { ok: true, message: `Waited ${action.durationMs}ms` };

            case "CLICK":
                await ctx.adapter.click(action.target, ctx.signal);
                return { ok: true, message: `Clicked ${action.target.id}` };

            case "CLICK_AND_ADOPT_NEW_PAGE":
                if (!ctx.adapter.clickAndAdoptNewPage) {
                    throw new Error(
                        "Adapter does not support clickAndAdoptNewPage",
                    );
                }

                await ctx.adapter.clickAndAdoptNewPage(
                    action.target,
                    ctx.signal,
                );
                return {
                    ok: true,
                    message: `Clicked ${action.target.id} and adopted new page`,
                };

            case "TYPE":
                await ctx.adapter.type(
                    action.target,
                    action.value,
                    { clearBeforeType: action.clearBeforeType },
                    ctx.signal,
                );
                return { ok: true, message: `Typed into ${action.target.id}` };

            case "FOCUS":
                await ctx.adapter.focus(action.target, ctx.signal);
                return { ok: true, message: `Focused ${action.target.id}` };

            case "PRESS_KEY":
                await ctx.adapter.pressKey(action.key, ctx.signal);
                return { ok: true, message: `Pressed key ${action.key}` };

            case "ASSERT_TARGET": {
                const target = await ctx.adapter.queryTarget(
                    action.target,
                    ctx.signal,
                );
                return {
                    ok: target.found,
                    message: target.found
                        ? `Target ${action.target.id} found`
                        : `Target ${action.target.id} not found`,
                    evidence: target.meta,
                };
            }

            case "COMPOSITE": {
                const childResults: Array<Record<string, unknown>> = [];

                for (const childAction of action.actions) {
                    const childResult = await this.execute(ctx, childAction);

                    childResults.push({
                        actionId: childAction.id,
                        actionKind: childAction.kind,
                        ok: childResult.ok,
                        message: childResult.message,
                        evidence: childResult.evidence,
                    });

                    if (!childResult.ok) {
                        return {
                            ok: false,
                            message: childResult.message,
                            evidence: {
                                compositeActionId: action.id,
                                childResults,
                            },
                        };
                    }
                }

                return {
                    ok: true,
                    message: `Composite action ${action.id} completed`,
                    evidence: {
                        compositeActionId: action.id,
                        childResults,
                    },
                };
            }
            // case "CLICK_RELATIVE_POINT":
            //     if (!ctx.adapter.clickRelativePoint) {
            //         throw new Error(
            //             "Adapter does not support clickRelativePoint",
            //         );
            //     }

            //     await ctx.adapter.clickRelativePoint(
            //         action.target,
            //         action.xRatio,
            //         action.yRatio,
            //         ctx.signal,
            //     );

            //     return {
            //         ok: true,
            //         message: `Clicked relative point (${action.xRatio}, ${action.yRatio}) on ${action.target.id}`,
            //     };
            case "CLICK_RELATIVE_POINT":
                return this.executeClickRelativePoint(ctx, action);

            default: {
                const exhaustiveCheck: never = action;
                throw new Error(
                    `Unhandled action kind: ${JSON.stringify(exhaustiveCheck)}`,
                );
            }
        }
    }

    private async executeClickRelativePoint(
        ctx: ExecutionContext,
        action: ClickRelativePointAction,
    ): Promise<ActionExecutionResult> {
        if (!ctx.adapter.clickRelativePoint) {
            throw new Error("Adapter does not support clickRelativePoint");
        }

        if (!isValidRatio(action.xRatio)) {
            throw new Error(
                `INVALID_RELATIVE_RATIO: xRatio must be in [0..1], got ${action.xRatio}`,
            );
        }

        if (!isValidRatio(action.yRatio)) {
            throw new Error(
                `INVALID_RELATIVE_RATIO: yRatio must be in [0..1], got ${action.yRatio}`,
            );
        }

        const targetState = await ctx.adapter.queryTarget(
            action.target,
            ctx.signal,
        );

        if (!targetState.found) {
            return {
                ok: false,
                message: `Relative click target ${action.target.id} not found`,
                evidence: {
                    actionKind: action.kind,
                    targetId: action.target.id,
                    xRatio: action.xRatio,
                    yRatio: action.yRatio,
                },
            };
        }

        const requireVisible = action.requireVisible ?? true;
        if (requireVisible && targetState.visible !== true) {
            return {
                ok: false,
                message: `Relative click target ${action.target.id} is not visible`,
                evidence: {
                    actionKind: action.kind,
                    targetId: action.target.id,
                    xRatio: action.xRatio,
                    yRatio: action.yRatio,
                    visible: targetState.visible ?? false,
                },
            };
        }

        const screenshotBefore = action.screenshotBefore
            ? await captureScreenshotArtifact(ctx, {
                  label: `${action.id}_before_click_relative_point`,
              })
            : undefined;

        const clickEvidence = await ctx.adapter.clickRelativePoint(
            action.target,
            action.xRatio,
            action.yRatio,
            ctx.signal,
        );

        const screenshotAfter = action.screenshotAfter
            ? await captureScreenshotArtifact(ctx, {
                  label: `${action.id}_after_click_relative_point`,
              })
            : undefined;

        let beforeAnnotatedPath: string | undefined;
        let afterAnnotatedPath: string | undefined;

        if (screenshotBefore || screenshotAfter) {
            try {
                const overlayArtifacts =
                    await createRelativeClickOverlayArtifacts({
                        scenarioId: ctx.scenario.id,
                        iteration: ctx.iteration,
                        actionId: action.id,
                        actionKind: action.kind,
                        targetStateMeta: targetState.meta,
                        clickEvidence,
                        xRatio: action.xRatio,
                        yRatio: action.yRatio,
                        beforeRawPath: screenshotBefore,
                        afterRawPath: screenshotAfter,
                    });

                beforeAnnotatedPath = overlayArtifacts.beforeAnnotatedPath;
                afterAnnotatedPath = overlayArtifacts.afterAnnotatedPath;
            } catch (error) {
                ctx.timeline.record({
                    type: "ACTION_EXECUTION_FAILED",
                    timestamp: new Date().toISOString(),
                    iteration: ctx.iteration,
                    state: { id: "UNKNOWN", confidence: 0 },
                    message: `Overlay render failed for ${action.id}`,
                    meta: {
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                        actionId: action.id,
                        actionKind: action.kind,
                    },
                });
            }
        }
        return {
            ok: true,
            message: `Clicked relative point (${action.xRatio}, ${action.yRatio}) on ${action.target.id}`,
            evidence: {
                actionKind: action.kind,
                targetId: action.target.id,
                xRatio: action.xRatio,
                yRatio: action.yRatio,
                requireVisible,
                targetPresence: {
                    found: targetState.found,
                    visible: targetState.visible,
                    enabled: targetState.enabled,
                },
                click: clickEvidence,
                screenshotBefore,
                screenshotAfter,
                beforeAnnotatedPath,
                afterAnnotatedPath,
            },
        };
        // return {
        //     ok: true,
        //     message: `Clicked relative point (${action.xRatio}, ${action.yRatio}) on ${action.target.id}`,
        //     evidence: {
        //         actionKind: action.kind,
        //         targetId: action.target.id,
        //         targetPresence: {
        //             found: targetState.found,
        //             visible: targetState.visible,
        //             enabled: targetState.enabled,
        //         },
        //         click: clickEvidence,
        //         screenshotBefore,
        //         screenshotAfter,
        //     },
        // };
    }
}
