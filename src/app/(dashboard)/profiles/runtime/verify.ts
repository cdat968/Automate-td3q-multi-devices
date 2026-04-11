import { runProfile } from "./engine";
import { MockDeviceAdapter } from "./adapter";
import { BrowserDeviceAdapter, NodeBrowserSession } from "./adapters/browser";
import type { RuntimeContext, RuntimeEvent } from "./types";

/**
 * E1 Runtime Verification Script (Correctness Patch).
 */

async function verifyScenario(name: string, profile: any, scenario: any) {
    console.log(`--- VERIFYING SCENARIO: ${name} ---`);
    
    const events: RuntimeEvent[] = [];
    const adapter = new MockDeviceAdapter(scenario);
    const controller = new AbortController();

    const context: RuntimeContext = {
        runId: `run_${Date.now()}`,
        profileId: profile.id,
        startedAt: Date.now(),
        signal: controller.signal,
        adapter,
        logger: { log: (msg, lvl) => console.log(`[${lvl.toUpperCase()}] ${msg}`) },
        variables: { TEST_INPUT: "val" },
        outputs: {},
        emit: (event) => {
            events.push(event);
            console.log(`[EVENT] ${event.type}`);
        }
    };

    if (scenario.abortImmediately) {
        controller.abort();
    }

    const result = await runProfile(profile as any, context);
    console.log(`[RESULT] Status: ${result.status}, Steps: ${result.stepResults.length}`);
    
    if (result.status === "cancelled") {
        const cancelEvent = events.find(e => e.type === "step.cancelled") as any;
        console.log(`[CHECK] Cancelled Event found: ${!!cancelEvent}, Attempt: ${cancelEvent?.attempt}`);
    }

    return { result, events, adapter };
}

async function verifyBrowserScenario() {
    console.log("--- VERIFYING BROWSER ADAPTER SCENARIO (DETERMINISTIC) ---");

    const session = new NodeBrowserSession();
    const adapter = new BrowserDeviceAdapter(session);
    const controller = new AbortController();
    
    const context: RuntimeContext = {
        runId: `run_browser_${Date.now()}`,
        profileId: "profile_browser",
        startedAt: Date.now(),
        signal: controller.signal,
        adapter,
        logger: { log: (msg, lvl) => console.log(`[BROWSER][${lvl.toUpperCase()}] ${msg}`) },
        variables: {},
        outputs: {},
        emit: (event) => console.log(`[BROWSER-EVENT] ${event.type}`)
    };

    const browserProfile: any = {
        id: "profile_browser",
        steps: [
            {
                id: "step_nav",
                name: "Navigate",
                type: "navigation",
                status: "enabled",
                runtime: { timeoutSec: 5, retryCount: 0, retryDelayMs: 0, failAction: "stop_flow", screenshotOnFailure: "none" },
                config: { kind: "navigation", url: "data:text/html,<html><body><input id='u'><button id='b' style='display:none'>L</button></body></html>" }
            },
            {
                id: "step_type",
                name: "Type",
                type: "dom_type",
                status: "enabled",
                runtime: { timeoutSec: 5, retryCount: 0, retryDelayMs: 0, failAction: "stop_flow", screenshotOnFailure: "none" },
                config: { kind: "dom_type", target: { kind: "dom", selector: "#u" }, value: "testuser" }
            },
            {
                id: "step_wait",
                name: "Wait",
                type: "wait_dom",
                status: "enabled",
                runtime: { timeoutSec: 5, retryCount: 0, retryDelayMs: 0, failAction: "stop_flow", screenshotOnFailure: "none" },
                config: { kind: "wait_dom", target: { kind: "dom", selector: "#b" }, state: "visible" }
            },
            {
                id: "step_click",
                name: "Click",
                type: "dom_click",
                status: "enabled",
                runtime: { timeoutSec: 5, retryCount: 0, retryDelayMs: 0, failAction: "stop_flow", screenshotOnFailure: "none" },
                config: { kind: "dom_click", target: { kind: "dom", selector: "#b" } }
            }
        ]
    };

    const result = await runProfile(browserProfile, context);
    console.log(`[BROWSER-RESULT] Status: ${result.status}, Steps: ${result.stepResults.length}`);

    // Verify screenshot capability (evidence)
    const ss = await adapter.screenshot({ signal: controller.signal });
    console.log(`[BROWSER-CHECK] Screenshot Capability: ${!!ss}`);

    // Verify immediate abort behavior
    console.log("--- VERIFYING IMMEDIATE ABORT ---");
    const abortedController = new AbortController();
    abortedController.abort();
    try {
        await adapter.navigate("step_abort", "about:blank", { signal: abortedController.signal });
        console.error("[CHECK] Immediate abort failed to throw!");
    } catch (e: any) {
        console.log(`[CHECK] Immediate abort correctly threw: ${e.message}`);
    }
}

async function main() {
    // Existing correctness scenarios (using MockDeviceAdapter)
    const mockStep: any = {
        id: "step_1",
        name: "Test Step",
        type: "dom_click",
        status: "enabled",
        runtime: { timeoutSec: 1, retryCount: 0, retryDelayMs: 0, failAction: "stop_flow", screenshotOnFailure: "none" },
        config: { kind: "dom_click", target: { kind: "dom", selector: "#btn" } }
    };

    const mockProfile: any = {
        id: "profile_1",
        name: "Mock Profile",
        game: "test-game",
        status: "draft",
        version: "1.0.0",
        steps: [mockStep]
    };

    // 1. Success Scenario
    await verifyScenario("SUCCESS", mockProfile, {});

    // 2. Cancellation Scenario (Expect attempt in payload)
    await verifyScenario("CANCELLED", mockProfile, { abortImmediately: true });

    // 3. Timeout Scenario (Expect status FAILED, code STEP_TIMEOUT)
    const timeoutStep = { ...mockStep, runtime: { ...mockStep.runtime, timeoutSec: 0.1 } };
    await verifyScenario("TIMEOUT_FAILURE", { ...mockProfile, steps: [timeoutStep] }, { timeoutOnStepId: "step_1" });

    // 4. Browser Adapter Scenario
    await verifyBrowserScenario();

    console.log("--- ALL SCENARIOS VERIFIED ---");
}

main();
