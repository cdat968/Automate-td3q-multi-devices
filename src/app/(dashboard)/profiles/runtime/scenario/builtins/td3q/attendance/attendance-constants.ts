export const ATTENDANCE_STATE = {
    GAME_RUNNING: "GAME_RUNNING",
    ATTENDANCE_POPUP_OPEN: "ATTENDANCE_POPUP_OPEN",
    ATTENDANCE_DAILY_READY: "ATTENDANCE_DAILY_READY",
    ATTENDANCE_DAILY_REWARD_POPUP_OPEN: "ATTENDANCE_DAILY_REWARD_POPUP_OPEN",
    ATTENDANCE_DAILY_DONE: "ATTENDANCE_DAILY_DONE",
    ATTENDANCE_MILESTONE_READY: "ATTENDANCE_MILESTONE_READY",
    ATTENDANCE_MILESTONE_DONE: "ATTENDANCE_MILESTONE_DONE",
    ATTENDANCE_CLOSE_READY: "ATTENDANCE_CLOSE_READY",
    ATTENDANCE_FLOW_DONE: "ATTENDANCE_FLOW_DONE",
    ATTENDANCE_FLOW_FAILED: "ATTENDANCE_FLOW_FAILED",
} as const;

export const ATTENDANCE_TRANSITION = {
    OPEN_ATTENDANCE_POPUP: "open-attendance-popup",
    CLAIM_ATTENDANCE_DAILY: "claim-attendance-daily",
    CLOSE_ATTENDANCE_DAILY_REWARD_POPUP: "close-attendance-daily-reward-popup",
    ADVANCE_AFTER_ATTENDANCE_DAILY_DONE: "advance-after-attendance-daily-done",
    CLAIM_ATTENDANCE_MILESTONE: "claim-attendance-milestone",
    PREPARE_CLOSE_ATTENDANCE_POPUP: "prepare-close-attendance-popup",
    CLOSE_ATTENDANCE_POPUP: "close-attendance-popup",
} as const;

// Re-export constants from features if necessary to centralize
export { AttendanceVars } from "../../../features/attendance/attendance-runtime";
export { AttendanceConfig } from "../../../features/attendance/attendance-config";
