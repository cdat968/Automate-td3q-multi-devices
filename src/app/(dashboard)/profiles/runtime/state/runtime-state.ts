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
    | "ATTENDANCE_POPUP_CONFIRMED"
    | "ATTENDANCE_DAILY_READY"
    | "ATTENDANCE_DAILY_REWARD_POPUP_OPEN"
    | "ATTENDANCE_DAILY_DONE"
    | "ATTENDANCE_MILESTONE_READY"
    | "ATTENDANCE_MILESTONE_DONE"
    | "ATTENDANCE_CLOSE_READY"
    | "ATTENDANCE_FLOW_DONE"
    | "ATTENDANCE_FLOW_FAILED"
    | "GAME_ERROR"
    | "ERROR_STATE";

export interface RuntimeStateSnapshot {
    id: RuntimeStateId;
    confidence?: number;
    meta?: Record<string, unknown>;
}
