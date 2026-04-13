import fs from "fs";
import path from "path";

export const templates = {
    attendanceClose: fs.readFileSync(
        path.join(process.cwd(), "templates/attendance-close.png"),
    ),
    attendanceIcon: fs.readFileSync(
        path.join(process.cwd(), "templates/attendance_icon.png"),
    ),
};
