import type { ScenarioDefinition } from "../../../scenario-types";
import type { AttendanceFlowTargets } from "./attendance-types";
import { getAttendanceDetectors } from "./attendance-detectors";
import {
    getAttendanceDetectionRules,
    getAttendanceTransitions,
} from "./attendance-transitions";
import type { ClassifyAttendanceTodayCell } from "../../../features/attendance/attendance-today-detectors";

type DetectionRule = ScenarioDefinition["detectionRules"][number];
type Transition = ScenarioDefinition["transitions"][number];

export type AttendanceScenarioDefinition = {
    detectionRules: DetectionRule[];
    transitions: Transition[];
};

export function createAttendanceScenario(params: {
    targets: AttendanceFlowTargets;
    classifyAttendanceTodayCell: ClassifyAttendanceTodayCell;
}): AttendanceScenarioDefinition {
    const detectors = getAttendanceDetectors(
        params.classifyAttendanceTodayCell,
    );

    return {
        detectionRules: getAttendanceDetectionRules(detectors, params.targets),
        transitions: getAttendanceTransitions(detectors, params.targets),
    };
}
