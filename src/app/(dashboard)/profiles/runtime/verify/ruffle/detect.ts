import type { Page } from "playwright";
import { RuffleFlowState, type RuffleFlowConfig } from "./ruffle-flow.types";

/**
 * Pure detection logic for the Ruffle game flow.
 * Resilience: All DOM checks are wrapped in try/catch within page.evaluate 
 * to handle invalid selectors and transient loading states gracefully.
 */

export async function detectCurrentState(page: Page, config: RuffleFlowConfig): Promise<RuffleFlowState> {
    const url = page.url();

    try {
        if (await isLoginPage(page, config)) return RuffleFlowState.LOGIN_PAGE;

        if (await isServerSelect(page, config)) return RuffleFlowState.SERVER_SELECT;

        if (await isDashboard(page, config)) return RuffleFlowState.DASHBOARD;

        if (isRuffleEmbedPage(url)) {
            return await detectRuffleEmbedPageState(page);
        }

        if (isRuffleExtensionPlayerPage(url)) {
            return await detectExtensionPlayerState(page);
        }

        if (await isGameRunning(page, config)) return RuffleFlowState.GAME_RUNNING;

    } catch (err) {
        // Rejection signals 'UNKNOWN' state rather than crashing the orchestrator
        return RuffleFlowState.UNKNOWN;
    }

    return RuffleFlowState.UNKNOWN;
}

async function isGameRunning(page: Page, config: RuffleFlowConfig): Promise<boolean> {
    const { canvas, rufflePlayer, container, urlIncludes, forbiddenUrlIncludes, requiredText } = config.selectors.game;
    const { warningText } = config.selectors.warning;

    // 1. URL Signal Check
    const url = page.url();
    if (urlIncludes && !urlIncludes.some(inc => url.includes(inc))) return false;
    if (forbiddenUrlIncludes && forbiddenUrlIncludes.some(inc => url.includes(inc))) return false;

    // 2. DOM Signal Check
    const [hasCanvas, hasRufflePlayer, hasContainer] = await Promise.all([
        safeHasElement(page, canvas),
        safeHasElement(page, rufflePlayer),
        container ? safeHasElement(page, container) : Promise.resolve(true),
    ]);

    const hasPlayer = hasCanvas || hasRufflePlayer;
    if (!hasPlayer || !hasContainer) return false;

    try {
        const bodyText = await page.locator("body").innerText();

        if (bodyText.includes(warningText)) return false;

        if (requiredText && !requiredText.every((t) => bodyText.includes(t))) {
            return false;
        }

        return true;
    } catch {
        return false;
    }
}

async function isRuffleWarning(page: Page, config: RuffleFlowConfig): Promise<boolean> {
    const { openInNewTab, warningText } = config.selectors.warning;

    const hasLink = await safeHasElement(page, openInNewTab);
    if (!hasLink) return false;

    try {
        const bodyText = await page.locator("body").innerText();
        return bodyText.includes(warningText);
    } catch {
        return false;
    }
}

async function isServerSelect(page: Page, config: RuffleFlowConfig): Promise<boolean> {
    return await safeHasElement(page, config.selectors.serverSelect.serverItem);
}

async function isDashboard(page: Page, config: RuffleFlowConfig): Promise<boolean> {
    const url = page.url();

    // Không coi là dashboard nếu đang ở login page
    if (url.includes("dang-nhap")) return false;

    if (await isServerSelect(page, config)) return false;

    return await safeHasElement(page, config.selectors.dashboard.playBtn);
}

async function isLoginPage(page: Page, config: RuffleFlowConfig): Promise<boolean> {
    const { user, pass, submit } = config.selectors.login;
    const url = page.url();

    if (url.includes("dang-nhap")) {
        const [hasUser, hasPass, hasSubmit] = await Promise.all([
            safeHasElement(page, user),
            safeHasElement(page, pass),
            safeHasElement(page, submit),
        ]);
        return hasUser && hasPass && hasSubmit;
    }

    const [hasUser, hasPass, hasSubmit] = await Promise.all([
        safeHasElement(page, user),
        safeHasElement(page, pass),
        safeHasElement(page, submit),
    ]);

    return hasUser && hasPass && hasSubmit;
}

/**
 * HELPER: Performs a safe element check that won't throw on invalid selector syntax.
 */
async function safeHasElement(page: Page, selector: string): Promise<boolean> {
    if (!selector) return false;

    try {
        const locator = page.locator(selector).first();
        return (await locator.count()) > 0;
    } catch {
        return false;
    }
}

function isRuffleEmbedPage(url: string): boolean {
    return url.includes("vao-game.html");
}

function isRuffleExtensionPlayerPage(url: string): boolean {
    return url.includes("/player.html#") && url.includes(".swf");
}

async function detectRuffleEmbedPageState(page: Page): Promise<RuffleFlowState> {
    const ruffleState = await page.evaluate(() => {
        const host = document.querySelector("ruffle-object") as HTMLElement | null;
        if (!host) {
            return {
                hasHost: false,
                hasShadowRoot: false,
                hasOverlay: false,
                hasCanvas: false,
                overlayVisible: false,
                canvasVisible: false
            };
        }

        const shadow = (host as any).shadowRoot as ShadowRoot | null;
        if (!shadow) {
            return {
                hasHost: true,
                hasShadowRoot: false,
                hasOverlay: false,
                hasCanvas: false,
                overlayVisible: false,
                canvasVisible: false
            };
        }

        const overlay = shadow.querySelector("#message-overlay") as HTMLElement | null;
        const canvas = shadow.querySelector("canvas") as HTMLCanvasElement | null;

        return {
            hasHost: true,
            hasShadowRoot: true,
            hasOverlay: !!overlay,
            hasCanvas: !!canvas,
            overlayVisible: !!overlay && overlay.offsetParent !== null,
            canvasVisible: !!canvas && canvas.offsetParent !== null
        };
    });

    console.log("[DETECT][EMBED]", ruffleState);

    if (ruffleState.hasOverlay && ruffleState.overlayVisible) {
        return RuffleFlowState.RUFFLE_WARNING;
    }

    if (ruffleState.hasCanvas && ruffleState.canvasVisible) {
        return RuffleFlowState.GAME_RUNNING;
    }

    return RuffleFlowState.UNKNOWN;
}

async function detectExtensionPlayerState(page: Page): Promise<RuffleFlowState> {
    const state = await page.evaluate(() => {
        // Tìm canvas ở root DOM
        const rootCanvas = document.querySelector("canvas") as HTMLCanvasElement | null;

        // Tìm canvas trong shadow DOM
        const hosts = Array.from(document.querySelectorAll("*"));
        let shadowCanvas: HTMLCanvasElement | null = null;

        for (const el of hosts) {
            const shadow = (el as any).shadowRoot as ShadowRoot | null;
            if (!shadow) continue;

            const found = shadow.querySelector("canvas") as HTMLCanvasElement | null;
            if (found) {
                shadowCanvas = found;
                break;
            }
        }

        const canvas = rootCanvas ?? shadowCanvas;

        return {
            hasRootCanvas: !!rootCanvas,
            hasShadowCanvas: !!shadowCanvas,
            hasCanvas: !!canvas,
            canvasVisible: !!canvas && canvas.offsetParent !== null,
        };
    });

    console.log("[DETECT][PLAYER]", state);
    // 👉 RULE QUAN TRỌNG

    // 1. Nếu chưa có canvas → chắc chắn đang loading
    if (!state.hasCanvas) {
        return RuffleFlowState.GAME_LOADING;
    }

    // 2. Có canvas nhưng chưa visible → vẫn loading
    if (!state.canvasVisible) {
        return RuffleFlowState.GAME_LOADING;
    }

    // 3. Có canvas + visible → game đã render → RUNNING
    return RuffleFlowState.GAME_RUNNING;
}
