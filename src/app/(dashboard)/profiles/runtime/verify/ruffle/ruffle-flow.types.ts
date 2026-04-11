/**
 * Machine-states for the Ruffle game flow verification.
 */
export enum RuffleFlowState {
    LOGIN_PAGE = "LOGIN_PAGE",
    DASHBOARD = "DASHBOARD",
    SERVER_SELECT = "SERVER_SELECT",
    RUFFLE_WARNING = "RUFFLE_WARNING",
    GAME_LOADING = "GAME_LOADING",
    GAME_RUNNING = "GAME_RUNNING",
    UNKNOWN = "UNKNOWN"
}

/**
 * Failure classifications for structured diagnostic reporting.
 */
export enum RuffleFailureReason {
    TIMEOUT = "TIMEOUT",
    UNKNOWN_STREAK = "UNKNOWN_STREAK",
    ACTION_FAILED = "ACTION_FAILED",
    MAX_ITERATIONS = "MAX_ITERATIONS",
    HARNESS_ERROR = "HARNESS_ERROR"
}

/**
 * Strongly typed configuration for the Ruffle machine-state orchestrator.
 * Defines nested selectors and multi-signal conditions for robust automation.
 */
export interface RuffleFlowConfig {
    entryUrl: string;
    credentials: {
        user: string;
        pass: string;
    };
    selectors: {
        login: {
            user: string;
            pass: string;
            submit: string;
        };
        dashboard: {
            playBtn: string;
        };
        serverSelect: {
            serverItem: string;
        };
        warning: {
            openInNewTab: string;
            warningText: string;
        };
        game: {
            container?: string;
            canvas: string;
            rufflePlayer: string;
            urlIncludes?: string[];
            forbiddenUrlIncludes?: string[];
            requiredText?: string[];
        };
    };
    timeoutMs: number;
    maxIterations: number;
}

/**
 * Structured diagnostics capture for orchestration monitoring and debugging.
 */
export interface RuffleFlowDiagnostics {
    iteration: number;
    state: RuffleFlowState;
    url: string;
    action?: string;
    error?: string;
    failureReason?: RuffleFailureReason;
    unknownStateStreak?: number;
    screenshotPath?: string;
    elapsedMs?: number;
}

/**
 * Unified return type for the Ruffle flow execution.
 */
export interface RuffleFlowResult {
    status: "success" | "failure";
    finalState: RuffleFlowState;
    diagnostics: RuffleFlowDiagnostics;
}
