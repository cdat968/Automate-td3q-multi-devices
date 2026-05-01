import path from "path";

export const ATTENDANCE_FIXTURE_CONFIG = {
    fixturesDir: path.join(
        process.cwd(),
        "src/app/(dashboard)/profiles/runtime/scenario/builtins/td3q/attendance/__fixtures__",
    ),
    expectedFixtures: [
        "attendance-popup-open.png",
        "daily-ready.png",
        "daily-done.png",
        "daily-reward-popup-open.png",
        "milestone-ready.png",
        "close-ready.png",
    ],
} as const;
