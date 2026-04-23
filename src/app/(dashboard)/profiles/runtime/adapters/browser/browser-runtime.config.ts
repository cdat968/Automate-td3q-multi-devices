import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Local Runtime Configuration.
 * Manages paths and target details for real-world browser automation.
 * Update these values for your specific local environment.
 */
export const BROWSER_CONFIG = {
    // The actual target game/site URL
    targetUrl: "https://td3q.com/", // Example site with Flash content

    // Target-specific ready selector (e.g., game container or player)
    readySelector: "#game_container",

    // Persistent profile location (isolated within the project root)
    // Points to .runtime/user_data/chromium relative to the project root
    userDataDir: path.resolve(
        __dirname,
        "../../../../../../../.runtime/user_data/chromium",
    ),

    // Path to the UNPACKED Ruffle extension directory (Browser Extension version)
    ruffleExtensionPath: path.resolve(
        __dirname,
        "../../../../../../../extensions/ruffle",
    ),

    // Execution options
    headless: false, // Default to false for extension support and visual verification
    slowMoMs: 50, // Small delay between actions for realistic execution
    timeoutMs: 30000, // Global execution timeout for browser journeys
};
