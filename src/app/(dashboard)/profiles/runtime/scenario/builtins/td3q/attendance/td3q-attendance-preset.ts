import { AttendanceConfig } from "../../../features/attendance/attendance-config";

export const td3qAttendancePreset = {
  id: "td3q.attendance.default",
  gameId: "td3q",
  scenarioId: "td3q.attendance",
  runtime: "browser",
  config: AttendanceConfig,
} as const;

export type Td3qAttendancePreset = typeof td3qAttendancePreset;
export type Td3qAttendancePresetId = typeof td3qAttendancePreset.id;
