/**
 * Describes the static execution environment for a profile.
 */
export interface RuntimeBinding {
    target: "macos-local" | "windows-local" | "android-remote" | "mock";
    adapter: "browser-dom" | "browser-visual" | "system-native" | "mock";
    browser?: "chrome" | "chromium" | "edge" | "brave";
    mode?: "launch" | "attach";
    viewport?: {
        width: number;
        height: number;
    };
    /**
     * DOM selector used to locate the Ruffle/game container bounding box
     * for game-normalized visual searches.
     */
    gameRegionSelector?: string;
}
