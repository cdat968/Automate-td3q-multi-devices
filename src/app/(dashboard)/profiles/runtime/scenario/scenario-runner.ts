import { ExecutionEngine } from "../engine/execution-engine";
import { RuleBasedStateDetector } from "../engine/state-detector";
import { PriorityTransitionResolver } from "../engine/transition-resolver";
import { AdapterBackedActionExecutor } from "../engine/action-executor";
import type { DeviceAdapter } from "../adapters/device-adapter";
import type { ScenarioDefinition } from "./scenario-types";
import type { TimelineRecorder } from "../timeline/timeline-recorder";
import type { DiagnosticCollector } from "../../diagnostics/diagnostic-collector";

export interface RunScenarioOptions {
    scenario: ScenarioDefinition;
    adapter: DeviceAdapter;
    timeline: TimelineRecorder;
    diagnostics?: DiagnosticCollector;
    variables?: Record<string, string>;
    signal?: AbortSignal;
    maxIterations?: number;
    idleIterationLimit?: number;
    iterationDelayMs?: number;
}

export async function runScenario(options: RunScenarioOptions) {
    const engine = new ExecutionEngine(
        (scenario) => new RuleBasedStateDetector(scenario.detectionRules),
        (scenario) => new PriorityTransitionResolver(scenario.transitions),
        new AdapterBackedActionExecutor(),
        {
            maxIterations:
                options.maxIterations ?? options.scenario.maxIterations ?? 30,
            idleIterationLimit:
                options.idleIterationLimit ?? options.scenario.idleIterationLimit ?? 5,
            iterationDelayMs: options.iterationDelayMs ?? 800,
        },
    );

    return engine.run({
        adapter: options.adapter,
        scenario: options.scenario,
        timeline: options.timeline,
        diagnostics: options.diagnostics,
        variables: options.variables,
        signal: options.signal,
    });
}
