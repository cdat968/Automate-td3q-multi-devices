export type RuntimeStateId =
    | "UNKNOWN"
    | "LOGIN_PAGE"
    | "DASHBOARD"
    | "DASHBOARD_IDLE"
    | "DASHBOARD_SERVER_LIST_OPEN"
    | "GAME_LOADING"
    | "WARNING_PAGE"
    | "GAME_RUNNING"
    | "ATTENDANCE_POPUP_OPEN"
    | "GAME_ERROR"
    | "ERROR_STATE";

export interface RuntimeStateSnapshot {
    id: RuntimeStateId;
    confidence?: number;
    meta?: Record<string, unknown>;
}
