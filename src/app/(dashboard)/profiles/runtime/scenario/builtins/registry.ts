import { td3qAttendanceManifest } from "./td3q/attendance/attendance-manifest";
import { td3qAttendancePreset } from "./td3q/attendance/td3q-attendance-preset";
import { createAttendanceScenario } from "./td3q/attendance";

export const builtinScenarioRegistry = {
    manifests: [td3qAttendanceManifest],
    presets: [td3qAttendancePreset],
    scenarioFactories: {
        "td3q.attendance": createAttendanceScenario,
    },
} as const;
