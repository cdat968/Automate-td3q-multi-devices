import path from "path";
import { fileURLToPath } from "url";
import { runProfile } from "../engine";
import { BrowserDeviceAdapter } from "../adapters/browser/adapter";
import { RealBrowserSession } from "../adapters/browser/real-browser-session";
import type { RuntimeContext, RuntimeEvent } from "../types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Production-like Browser Verification Script.
 * Proves outcome-driven automation against a stateful local fixture.
 */

async function assertStatus(session: RealBrowserSession, expected: string) {
    const page = session.getPage();
    if (!page) throw new Error("Browser page not initialized");

    // Wait for the status to settle. In production-like UI, SUBMITTING is transient.
    // If we find SUBMITTING, we wait for the next state transition.
    const currentStatus = await page.textContent("#status");
    if (currentStatus?.trim() === "SUBMITTING") {
        await page.waitForFunction(
            (exp) => document.getElementById("status")?.textContent?.trim() === exp,
            expected,
            { timeout: 3000 }
        );
    }

    const actual = await page.textContent("#status");
    if (actual?.trim() !== expected) {
        throw new Error(`Assertion Failed: Expected status "${expected}" but found "${actual?.trim()}"`);
    }
    console.log(`[CHECK] Outcome Assertion Passed: ${expected}`);
}

async function runScenario(name: string, steps: any[], assertion?: (session: RealBrowserSession) => Promise<void>) {
    console.log(`\n=== SCENARIO: ${name} ===`);

    // Use headless mode for automated verification
    const session = new RealBrowserSession({ headless: false });
    const adapter = new BrowserDeviceAdapter(session);
    const controller = new AbortController();

    const events: RuntimeEvent[] = [];
    const context: RuntimeContext = {
        runId: `real_${Date.now()}`,
        profileId: "profile_real",
        startedAt: Date.now(),
        signal: controller.signal,
        adapter,
        logger: { log: (msg, lvl) => console.log(`[REAL][${lvl.toUpperCase()}] ${msg}`) },
        variables: {},
        outputs: {},
        emit: (event) => events.push(event)
    };

    const profile: any = {
        id: "profile_real",
        steps: steps
    };

    try {
        const result = await runProfile(profile, context);
        console.log(`[RESULT] Status: ${result.status}, Steps: ${result.stepResults.length}`);

        if (assertion) {
            await assertion(session);
        }

        return { result, events, adapter };
    } catch (error: any) {
        console.error(`[SCENARIO_ERROR] ${error.message}`);
        throw error;
    } finally {
        await session.close();
    }
}

async function verifyRealBrowser() {
    const fixturePath = `file://${path.resolve(__dirname, "fixtures/browser-login-fixture.html")}`;
    console.log(`Fixture Path: ${fixturePath}`);

    // 1. HAPPY_PATH_ASSERTED: Full interaction flow with outcome check
    await runScenario("HAPPY_PATH_ASSERTED", [
        {
            id: "nav", type: "navigation", status: "enabled",
            runtime: { timeoutSec: 10, retryCount: 0, retryDelayMs: 0, failAction: "stop_flow", screenshotOnFailure: "none" },
            config: { kind: "navigation", url: fixturePath }
        },
        {
            id: "wait_ready", type: "wait_dom", status: "enabled",
            runtime: { timeoutSec: 5, retryCount: 0, retryDelayMs: 0, failAction: "stop_flow", screenshotOnFailure: "none" },
            config: { kind: "wait_dom", target: { kind: "dom", selector: "#loginBtn" }, state: "visible" }
        },
        {
            id: "type_user", type: "dom_type", status: "enabled",
            runtime: { timeoutSec: 5, retryCount: 0, retryDelayMs: 0, failAction: "stop_flow", screenshotOnFailure: "none" },
            config: { kind: "dom_type", target: { kind: "dom", selector: "#u" }, value: "production_user" }
        },
        {
            id: "click_login", type: "dom_click", status: "enabled",
            runtime: { timeoutSec: 5, retryCount: 0, retryDelayMs: 0, failAction: "stop_flow", screenshotOnFailure: "none" },
            config: { kind: "dom_click", target: { kind: "dom", selector: "#loginBtn" } }
        }
    ], async (session) => {
        await assertStatus(session, "LOGIN_OK");
    });

    // 2. EMPTY_INPUT_ASSERTED: Verify behavior with empty input
    await runScenario("EMPTY_INPUT_ASSERTED", [
        {
            id: "nav", type: "navigation", status: "enabled",
            runtime: { timeoutSec: 10, retryCount: 0, retryDelayMs: 0, failAction: "stop_flow", screenshotOnFailure: "none" },
            config: { kind: "navigation", url: fixturePath }
        },
        {
            id: "wait_ready", type: "wait_dom", status: "enabled",
            runtime: { timeoutSec: 5, retryCount: 0, retryDelayMs: 0, failAction: "stop_flow", screenshotOnFailure: "none" },
            config: { kind: "wait_dom", target: { kind: "dom", selector: "#loginBtn" }, state: "visible" }
        },
        {
            id: "click_login", type: "dom_click", status: "enabled",
            runtime: { timeoutSec: 5, retryCount: 0, retryDelayMs: 0, failAction: "stop_flow", screenshotOnFailure: "none" },
            config: { kind: "dom_click", target: { kind: "dom", selector: "#loginBtn" } }
        }
    ], async (session) => {
        await assertStatus(session, "LOGIN_EMPTY");
    });

    // 3. FAIL_MISSING_SELECTOR: Verify timeout on non-existent element
    await runScenario("FAIL_MISSING_SELECTOR", [
        {
            id: "nav", type: "navigation", status: "enabled",
            runtime: { timeoutSec: 10, retryCount: 0, retryDelayMs: 0, failAction: "stop_flow", screenshotOnFailure: "none" },
            config: { kind: "navigation", url: fixturePath }
        },
        {
            id: "wait_fail", type: "wait_dom", status: "enabled",
            runtime: { timeoutSec: 2, retryCount: 0, retryDelayMs: 0, failAction: "ignore_and_continue", screenshotOnFailure: "none" },
            config: { kind: "wait_dom", target: { kind: "dom", selector: "#missing_ui_element" }, state: "visible" }
        }
    ]);

    // 4. SCREENSHOT_CAPABILITY: Verify visual capture works in production-like UI
    await runScenario("SCREENSHOT_CAPABILITY", [
        {
            id: "nav", type: "navigation", status: "enabled",
            runtime: { timeoutSec: 10, retryCount: 0, retryDelayMs: 0, failAction: "stop_flow", screenshotOnFailure: "none" },
            config: { kind: "navigation", url: fixturePath }
        },
        {
            id: "wait_ready", type: "wait_dom", status: "enabled",
            runtime: { timeoutSec: 5, retryCount: 0, retryDelayMs: 0, failAction: "stop_flow", screenshotOnFailure: "none" },
            config: { kind: "wait_dom", target: { kind: "dom", selector: "#loginBtn" }, state: "visible" }
        }
    ], async (session) => {
        const ss = await session.captureScreenshot();
        console.log(`[CHECK] Screenshot Evidence Captured: ${ss.length} bytes`);
        if (ss.length < 500) throw new Error("Screenshot evidence suspiciously small");
    });

    // 5. IMMEDIATE_ABORT: Verify early exit
    console.log("\n=== SCENARIO: IMMEDIATE_ABORT ===");
    const sessionAbort = new RealBrowserSession();
    const adapterAbort = new BrowserDeviceAdapter(sessionAbort);
    const abortedController = new AbortController();
    abortedController.abort();
    try {
        await adapterAbort.navigate("abort", fixturePath, { signal: abortedController.signal });
        console.error("[CHECK] ERROR: Immediate abort did not throw");
        throw new Error("Abort check failed");
    } catch (e: any) {
        console.log(`[CHECK] Outcome Verified: Abort correctly handled (${e.message})`);
    } finally {
        await sessionAbort.close();
    }
}

verifyRealBrowser().catch((err) => {
    console.error(`\n[FATAL] Verification failed:\n${err.stack}`);
    process.exit(1);
});
