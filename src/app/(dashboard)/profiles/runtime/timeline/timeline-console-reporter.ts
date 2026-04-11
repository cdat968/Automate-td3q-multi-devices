import type { TimelineRecorder } from "./timeline-recorder";
import type { TimelineEvent } from "./timeline-types";

export class InMemoryTimelineRecorder implements TimelineRecorder {
    private readonly events: TimelineEvent[] = [];

    record(event: TimelineEvent): void {
        this.events.push(event);
        console.log(
            `[ENGINE][${event.type}] iter=${event.iteration} ${event.message ?? ""}`,
        );
    }

    getEvents(): TimelineEvent[] {
        return [...this.events];
    }
}
