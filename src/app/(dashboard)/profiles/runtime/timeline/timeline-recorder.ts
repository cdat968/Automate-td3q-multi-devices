import type { TimelineEvent } from "./timeline-types";

export interface TimelineRecorder {
    record(event: TimelineEvent): void;
    getEvents(): TimelineEvent[];
}
