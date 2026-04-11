/**
 * In-memory state of a running automation.
 * This is mutable during execution.
 */
export interface ExecutionState {
    /**
     * Browser session state for hybrid DOM/Visual runs.
     */
    browser: BrowserState;
    /**
     * Mutable registry for variables, counters, and flags.
     */
    variables: VariableRegistry;
    /**
     * Metrics and telemetry accumulated during the run.
     */
    metrics: Record<string, number>;
}

export interface BrowserState {
    activeTabId?: string;
    /**
     * Active browser tabs/windows indexed by ID.
     * Serialization-friendly (no Map).
     */
    tabRegistry: Record<string, TabMetadata>;
}

export interface TabMetadata {
    id: string;
    title: string;
    url: string;
    openedAt: number;
    /**
     * Indicates Ruffle game engine state if detected.
     */
    gameDetected: boolean;
}

/**
 * Stores dynamic variables extracted from step outputs.
 */
export type VariableRegistry = Record<string, string | number | boolean>;
