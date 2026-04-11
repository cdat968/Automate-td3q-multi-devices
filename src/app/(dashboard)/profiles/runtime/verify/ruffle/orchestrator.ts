import fs from "fs/promises";
import path from "path";
import type { Page } from "playwright";
import {
    RuffleFlowState,
    RuffleFailureReason,
    type RuffleFlowConfig,
    type RuffleFlowResult,
    type RuffleFlowDiagnostics,
} from "./ruffle-flow.types";
import { detectCurrentState } from "./detect";
import { PersistentChromiumSession } from "../../adapters/browser/persistent-chromium-session";
import { BrowserDeviceAdapter } from "../../adapters/browser/adapter";

/**
 * Ruffle Game Flow Orchestrator.
 * Features: Real-time timeout guards, multi-tab context synchronization,
 * structured diagnostic results, and failure evidence capture.
 */
export async function runRuffleGameFlow(
    session: PersistentChromiumSession,
    // Reserved for future platform binding parity with non-browser drivers.
    _adapter: BrowserDeviceAdapter,
    config: RuffleFlowConfig,
): Promise<RuffleFlowResult> {
    // Explicit Page Context Reference (Orchestrator's Source of Truth)
    let currentPage: Page = session.getPage()!;
    let iteration = 0;
    let unknownStateStreak = 0;
    const maxUnknownStates = 3;
    const startTime = Date.now();
    let lastDetectedState: RuffleFlowState = RuffleFlowState.UNKNOWN;

    console.log(
        `[ORCHESTRATOR] Starting Verified Flow (Target: ${config.entryUrl})`,
    );

    while (iteration < config.maxIterations) {
        iteration++;
        const elapsedMs = Date.now() - startTime;

        // 1. Check Real-Time Execution Guard
        if (elapsedMs > config.timeoutMs) {
            return await fail(currentPage, {
                iteration,
                state: lastDetectedState,
                url: currentPage.url(),
                failureReason: RuffleFailureReason.TIMEOUT,
                elapsedMs,
            });
        }

        if (currentPage.url().includes("vao-game.html")) {
            console.log("[ORCHESTRATOR][WAIT] Waiting for Ruffle to render...");
            await currentPage.waitForTimeout(2500);
        }
        const state = await detectCurrentState(currentPage, config);
        const url = currentPage.url();
        lastDetectedState = state;

        console.log(
            `[ORCHESTRATOR][ITER ${iteration}][${elapsedMs}ms] State: ${state}, URL: ${url}`,
        );

        if (state === RuffleFlowState.GAME_RUNNING) {
            console.log(
                `[ORCHESTRATOR][SUCCESS] Target State GAME_RUNNING reached at iteration ${iteration}.`,
            );
            return {
                status: "success",
                finalState: state,
                diagnostics: { iteration, state, url, elapsedMs },
            };
        }

        unknownStateStreak = 0;
        let actionLabel = "wait_for_transition";

        try {
            switch (state) {
                case RuffleFlowState.LOGIN_PAGE:
                    actionLabel = "perform_login";
                    await performLoginAction(currentPage, config);
                    break;
                case RuffleFlowState.DASHBOARD:
                    actionLabel = "navigate_to_game";
                    await performDashboardAction(currentPage, config);
                    break;
                case RuffleFlowState.SERVER_SELECT:
                    actionLabel = "select_game_server";
                    await performServerSelectAction(currentPage, config);
                    break;
                case RuffleFlowState.RUFFLE_WARNING:
                    actionLabel = "capture_game_tab";
                    currentPage = await captureGameTab(
                        session,
                        currentPage,
                        config,
                    );
                    break;
                case RuffleFlowState.GAME_LOADING:
                    actionLabel = "wait_for_game_load";
                    await currentPage.waitForTimeout(5000);
                    break;
            }
            console.log(
                `[ORCHESTRATOR][ACTION] ${actionLabel} completed successfully.`,
            );
        } catch (error: any) {
            return await fail(currentPage, {
                iteration,
                state,
                url,
                action: actionLabel,
                error: error.message,
                failureReason: RuffleFailureReason.ACTION_FAILED,
                elapsedMs,
            });
        }

        // Stabilization pause after confirmed interaction
        await currentPage.waitForTimeout(1000);
    }

    return await fail(currentPage, {
        iteration,
        state: RuffleFlowState.UNKNOWN,
        url: currentPage.url(),
        failureReason: RuffleFailureReason.MAX_ITERATIONS,
        elapsedMs: Date.now() - startTime,
    });
}

/**
 * HELPER: Unified failure handler. Captures evidence and returns structured RuffleFlowResult.
 */
async function fail(
    page: Page,
    diagnostics: RuffleFlowDiagnostics,
): Promise<RuffleFlowResult> {
    console.error(
        `[ORCHESTRATOR][FAIL] Reason: ${diagnostics.failureReason} @ URL: ${diagnostics.url}`,
    );

    let screenshotPath: string | undefined = undefined;
    try {
        // Generate deterministic filename: ISO timestamp (safe chars) + reason + iteration
        const timestamp = new Date()
            .toISOString()
            .replace(/:/g, "-")
            .replace(/\./g, "-");
        const filename = `${timestamp}_${diagnostics.failureReason}_iter${diagnostics.iteration}.png`;
        const dir = path.join(process.cwd(), "artifacts", "ruffle");
        const fullPath = path.join(dir, filename);

        await fs.mkdir(dir, { recursive: true });
        await page.screenshot({ path: fullPath, timeout: 5000 });

        screenshotPath = fullPath;
        console.log(
            `[ORCHESTRATOR][CAPTURE] Evidence saved to: ${screenshotPath}`,
        );
    } catch (e) {
        console.warn(`[ORCHESTRATOR][WARN] Evidence capture failed.`);
    }

    return {
        status: "failure",
        finalState: diagnostics.state,
        diagnostics: { ...diagnostics, screenshotPath },
    };
}

/**
 * Multi-Tab Correctness Fix: Interactions now occur directly on the currentPage
 * reference managed by the orchestrator loop, bypassing session potential staleness.
 */
async function performLoginAction(page: Page, config: RuffleFlowConfig) {
    const { user, pass, submit } = config.selectors.login;
    await page.fill(user, config.credentials.user);
    await page.fill(pass, config.credentials.pass);
    await page.click(submit);
}

async function performDashboardAction(page: Page, config: RuffleFlowConfig) {
    await page.click(config.selectors.dashboard.playBtn);
}

async function performServerSelectAction(page: Page, config: RuffleFlowConfig) {
    await page.click(config.selectors.serverSelect.serverItem);
}

// async function captureGameTab(
//     session: PersistentChromiumSession,
//     sourcePage: Page,
//     config: RuffleFlowConfig
// ): Promise<Page> {
//     const context = session.getContext();
//     if (!context) throw new Error("Browser Context is missing.");

//     const pagePromise = context.waitForEvent("page");
//     await sourcePage.click(config.selectors.warning.openInNewTab);

//     const newPage = await pagePromise;
//     await newPage.waitForLoadState("domcontentloaded");

//     console.log(`[ORCHESTRATOR][TAB] Shifted focus to game tab: ${newPage.url()}`);
//     return newPage;
// }
async function captureGameTab(
    session: PersistentChromiumSession,
    sourcePage: Page,
    config: RuffleFlowConfig,
): Promise<Page> {
    const context = session.getContext();
    if (!context) throw new Error("Browser Context is missing.");

    const pagePromise = context.waitForEvent("page").catch(() => null);

    const clicked = await sourcePage.evaluate(() => {
        const host = document.querySelector("ruffle-object") as any;
        const shadow = host?.shadowRoot as ShadowRoot | null;
        const link = shadow?.querySelector(
            "#message-overlay a",
        ) as HTMLAnchorElement | null;

        if (!link) return false;
        link.click();
        return true;
    });

    if (!clicked) {
        throw new Error("Ruffle warning button not found inside shadowRoot.");
    }

    const newPage = await pagePromise;

    if (newPage) {
        await newPage.waitForLoadState("domcontentloaded");
        console.log(
            `[ORCHESTRATOR][TAB] Shifted focus to game tab: ${newPage.url()}`,
        );
        return newPage;
    }

    await sourcePage.waitForTimeout(1500);
    console.log(
        "[ORCHESTRATOR][TAB] No new tab detected; staying on current page.",
    );
    return sourcePage;
}
