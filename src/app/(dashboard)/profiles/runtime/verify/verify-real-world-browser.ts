import { PersistentChromiumSession } from "../adapters/browser/persistent-chromium-session";
import { BrowserDeviceAdapter } from "../adapters/browser/adapter";
import { BROWSER_CONFIG } from "../adapters/browser/browser-runtime.config";
import { runRuffleGameFlow } from "./ruffle/orchestrator";
import type { RuffleFlowConfig } from "./ruffle/ruffle-flow.types";
import "dotenv/config";

/**
 * Real-World multi-tab Ruffle Flow Verification Harness.
 * Environment-driven: Reads credentials from TEST_USER and TEST_PASS variables.
 * Keeps implementation logic strictly decoupled from the bootstrap harness.
 */

async function verifyRuffleOrchestration(): Promise<number> {
    // 1. Requirement Check: Environment Credentials
    const user = process.env.TEST_USER;
    const pass = process.env.TEST_PASS;

    if (!user || !pass) {
        console.error("\n[FATAL] Missing required environment variables: TEST_USER and TEST_PASS.");
        console.log("Usage: TEST_USER=admin TEST_PASS=123 npx tsx src/app/(dashboard)/profiles/runtime/verify/verify-real-world-browser.ts");
        return 1;
    }

    // 2. Strongly Typed Configuration Definition
    const config: RuffleFlowConfig = {
        entryUrl: BROWSER_CONFIG.targetUrl,
        credentials: { user, pass },
        selectors: {
            login: {
                user: "#LoginForm_email",
                pass: "#LoginForm_password",
                submit: "input.submit.button2[value='Đăng Nhập']"
            },
            dashboard: {
                playBtn: "a.dl-play[href='http://td3q.com/game/play']"
            },
            serverSelect: {
                serverItem: "a[href*='server=7']"
            },
            warning: {
                openInNewTab: "a:has-text('Mở trong thẻ mới')",
                warningText: "Mở trong thẻ mới"
            },
            game: {
                container: "ruffle-player#player",
                canvas: "ruffle-player#player canvas",
                rufflePlayer: "ruffle-player#player",
                urlIncludes: ["choi-game", "server=7"]
            }
        },
        timeoutMs: BROWSER_CONFIG.timeoutMs,
        maxIterations: 20
    };

    console.log(`[VERIFY][START] Harnessing Ruffle Orchestrator...`);
    console.log(`[VERIFY][INFO] Entry: ${config.entryUrl}`);
    console.log(`[VERIFY][INFO] Max Timeout: ${config.timeoutMs}ms`);

    // 3. Initialize Execution Layer
    const session = new PersistentChromiumSession({
        userDataDir: BROWSER_CONFIG.userDataDir,
        extensionPath: BROWSER_CONFIG.ruffleExtensionPath,
        headless: BROWSER_CONFIG.headless,
        slowMo: BROWSER_CONFIG.slowMoMs,
    });

    const adapter = new BrowserDeviceAdapter(session);

    try {
        // Bootstrap Initial Navigation
        console.log(`[VERIFY][ACTION] Bootstrapping Initial Navigation...`);
        await session.goto(config.entryUrl);

        // 4. Hand over execution to the Game State Orchestrator
        console.log(`[VERIFY][EXEC] Starting runRuffleGameFlow loop...`);
        const result = await runRuffleGameFlow(session, adapter, config);

        // 5. Final Report Generation
        console.log("\n" + "=".repeat(50));
        console.log(`FINAL REPORT: ${result.status.toUpperCase()}`);
        console.log(`Terminated at State: ${result.finalState}`);
        console.log(`Diagnostics:`, JSON.stringify(result.diagnostics, null, 2));
        console.log("=".repeat(50));

        if (result.status === "success") {
            console.log("\n[SUCCESS] Ruffle flow orchestration verified successfully.");
            return 0;
        } else {
            console.error("\n[FAILURE] Machine-state orchestration failed to reach terminal success.");
            return 1;
        }

    } catch (error: any) {
        console.error(`\n[FATAL] Verification Harness Crash:\n${error.stack}`);
        return 1;
    } finally {
        // Enforce cleanup to release profile lock
        await session.close();
    }
}

// Execute the bootstrap harness
verifyRuffleOrchestration()
    .then((code) => {
        process.exit(code);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
