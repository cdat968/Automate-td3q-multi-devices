import { td3qAttendancePreset } from "./td3q-attendance-preset";

export const td3qAttendanceManifest = {
  id: "td3q.attendance",
  name: "TD3Q Attendance",
  version: "1.0.0",
  description: "Runs the TD3Q attendance reward flow.",
  gameId: "td3q",
  runtime: "browser",
  scenarioModule: "builtins/td3q/attendance",
  defaultPresetId: td3qAttendancePreset.id,
  presets: [td3qAttendancePreset],
  capabilities: [
    "visual-detection",
    "template-matching",
    "diagnostics-overlay",
    "fixture-verification"
  ],
  diagnostics: {
    screenshots: true,
    overlays: true,
  },
  fixtures: {
    supported: true,
    directory: "__fixtures__",
  },
} as const;

export type Td3qAttendanceManifest = typeof td3qAttendanceManifest;
