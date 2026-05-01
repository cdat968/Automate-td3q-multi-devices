import "dotenv/config";

import { PersistentChromiumSession } from "../adapters/browser/persistent-chromium-session";
import { BrowserRuntimeAdapter } from "../adapters/browser/browser-runtime-adapter";
import { BROWSER_CONFIG } from "../adapters/browser/browser-runtime.config";

import { InMemoryTimelineRecorder } from "../timeline/timeline-console-reporter";
import { executeTd3qBrowserScenario, td3qBrowserScenario } from "../scenario/builtins/td3q-browser-scenario";
import { InMemoryDiagnosticCollector } from "../../diagnostics/diagnostic-collector";

async function verifyBrowserFlow(): Promise<number> {
    const user = process.env.TEST_USER;
    const pass = process.env.TEST_PASS;

    if (!user || !pass) {
        console.error(
            "\n[FATAL] Missing required environment variables: TEST_USER and TEST_PASS.",
        );
        console.log(
            "Usage: TEST_USER=admin TEST_PASS=123 npx tsx src/app/(dashboard)/profiles/runtime/verify/verify-browser-flow.ts",
        );
        return 1;
    }

    console.log("[VERIFY][START] Browser Runtime Engine Verification");
    console.log(`[VERIFY][INFO] Entry: ${BROWSER_CONFIG.targetUrl}`);
    console.log(`[VERIFY][INFO] Timeout: ${BROWSER_CONFIG.timeoutMs}ms`);

    const session = new PersistentChromiumSession({
        userDataDir: BROWSER_CONFIG.userDataDir,
        extensionPath: BROWSER_CONFIG.ruffleExtensionPath,
        headless: BROWSER_CONFIG.headless,
        slowMo: BROWSER_CONFIG.slowMoMs,
    });

    const adapter = new BrowserRuntimeAdapter(session);
    const timeline = new InMemoryTimelineRecorder();
    const diagnostics = new InMemoryDiagnosticCollector();

    try {
        console.log("[VERIFY][ACTION] Navigate to entry URL...");
        await adapter.navigate(BROWSER_CONFIG.targetUrl);

        const result = await executeTd3qBrowserScenario({
            adapter,
            timeline,
            diagnostics,
            variables: {
                TEST_USER: user,
                TEST_PASS: pass,
                ATTENDANCE_VERIFY_ARMED: "false",
                ATTENDANCE_VERIFY_ARMED_AT_ITERATION: "",
            },
            maxIterations: td3qBrowserScenario.maxIterations ?? 30,
            idleIterationLimit: td3qBrowserScenario.idleIterationLimit ?? 5,
            iterationDelayMs: 800,
        });

        console.log("\n" + "=".repeat(50));
        console.log(`FINAL REPORT: ${result.ok ? "SUCCESS" : "FAILED"}`);
        console.log(`Iterations: ${result.iterations}`);
        console.log(`Final State: ${result.finalState?.id ?? "UNKNOWN"}`);
        console.log(`Reason: ${result.reason ?? "N/A"}`);
        console.log(`Timeline Events: ${result.timelineEvents}`);
        console.log("=".repeat(50));

        if (result.ok) {
            console.log(
                "\n[SUCCESS] Browser runtime engine verified successfully.",
            );
            return 0;
        }

        console.error("\n[FAILURE] Browser runtime engine failed.");
        console.log(
            "[VERIFY][TIMELINE]",
            JSON.stringify(timeline.getEvents(), null, 2),
        );
        return 1;
    } catch (error: unknown) {
        const message =
            error instanceof Error
                ? (error.stack ?? error.message)
                : String(error);

        console.error(`\n[FATAL] Verification Harness Crash:\n${message}`);
        return 1;
    } finally {
        await session.close();
    }
}

verifyBrowserFlow()
    .then((code) => {
        process.exit(code);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
