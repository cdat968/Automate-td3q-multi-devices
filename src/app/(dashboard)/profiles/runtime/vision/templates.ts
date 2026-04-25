import fs from "fs";
import path from "path";

export const templates = {
    attendanceHeader: fs.readFileSync(
        path.join(process.cwd(), "templates/header_attendance.png"),
    ),
    headerPopupWard: fs.readFileSync(
        path.join(process.cwd(), "templates/header_popup_ward.png"),
    ),
    closeButtonReward: fs.readFileSync(
        path.join(process.cwd(), "templates/close_button_reward.png"),
    ),
    attendanceTomorrowReceive: fs.readFileSync(
        path.join(process.cwd(), "templates/attendance-tomorrow-receive_1.png"),
    ),
    attendanceClose: fs.readFileSync(
        path.join(process.cwd(), "templates/attendance-close.png"),
    ),
    attendanceIcon: fs.readFileSync(
        path.join(process.cwd(), "templates/attendance_icon.png"),
    ),
    attendanceTodayClaimable: fs.readFileSync(
        path.join(process.cwd(), "templates/attendance-today-claimable_1.png"),
    ),
    attendanceTodayChecked: fs.readFileSync(
        path.join(process.cwd(), "templates/attendance-today-checked-in_3.png"),
    ),
    attendanceMilestoneClaimable: fs.readFileSync(
        path.join(
            process.cwd(),
            "templates/attendance-milestone-claimable.png",
        ),
    ),
    attendanceMilestone2: fs.readFileSync(
        path.join(
            process.cwd(),
            "templates/attendance-milestone-2-claimable.png",
        ),
    ),
    attendanceMilestone5: fs.readFileSync(
        path.join(
            process.cwd(),
            "templates/attendance-milestone-5-claimable.png",
        ),
    ),
    attendanceMilestone10: fs.readFileSync(
        path.join(
            process.cwd(),
            "templates/attendance-milestone-10-claimable_3.png",
        ),
    ),
    attendanceMilestone20: fs.readFileSync(
        path.join(
            process.cwd(),
            "templates/attendance-milestone-20-claimable.png",
        ),
    ),
    attendanceMilestone30: fs.readFileSync(
        path.join(
            process.cwd(),
            "templates/attendance-milestone-30-claimable.png",
        ),
    ),
};
