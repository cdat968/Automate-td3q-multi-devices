import fs from "fs/promises";
import path from "path";
import { ATTENDANCE_FIXTURE_CONFIG } from "@td3q/attendance/attendance-fixture.config";
import { fileURLToPath } from "url";

const isMain = fileURLToPath(import.meta.url) === process.argv[1];

async function verifyFixtures() {
    console.log("[FIXTURES][START] Verifying TD3Q Attendance fixtures...");

    let missing = 0;
    let found = 0;

    for (const file of ATTENDANCE_FIXTURE_CONFIG.expectedFixtures) {
        const fullPath = path.join(ATTENDANCE_FIXTURE_CONFIG.fixturesDir, file);
        try {
            await fs.access(fullPath);
            console.log(`[FIXTURES][FOUND] ${file}`);
            found++;
        } catch {
            console.warn(`[FIXTURES][MISSING] ${file} (Skipping...)`);
            missing++;
        }
    }

    console.log("=".repeat(50));
    console.log(`[FIXTURES][SUMMARY] Found: ${found}, Missing: ${missing}`);
    console.log("=".repeat(50));

    if (missing > 0) {
        console.log(
            "To fully test attendance detectors locally, please add the missing screenshots to the __fixtures__ directory.",
        );
    }
}

if (isMain) {
    verifyFixtures().catch((error) => {
        console.error("[FIXTURES][ERROR]", error);
        process.exitCode = 1;
    });
}

export { verifyFixtures };
