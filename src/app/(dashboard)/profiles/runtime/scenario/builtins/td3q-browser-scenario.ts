import type { ExecutionContext, ScenarioDefinition } from "../scenario-types";
import type { RuntimeTargetRef } from "../../actions/action-types";
import { DiagnosticOverlayMeta } from "../../../diagnostics/diagnostic-types";
import { AttendanceDailyCellClassification } from "../features/attendance/attendance-daily-classification";
import { createAttendanceFlow } from "../features/attendance/attendance-flow";
import { analyzeAttendanceDaily } from "../features/attendance/attendance-daily-analyzer";
import { decideAttendanceDailyState } from "../features/attendance/attendance-daily-decision";
import {
    OverlayShape,
    OverlayColor,
} from "../../../diagnostics/overlay/overlay-types";

const targets = {
    emailInput: {
        id: "login.email",
        kind: "dom",
        locator: "input[type='text'], input[name='email']",
    } satisfies RuntimeTargetRef,

    passwordInput: {
        id: "login.password",
        kind: "dom",
        locator: "input[type='password']",
    } satisfies RuntimeTargetRef,

    submitButton: {
        id: "login.submit",
        kind: "dom",
        locator: "input[type='submit']",
    } satisfies RuntimeTargetRef,

    playButton: {
        id: "dashboard.play",
        kind: "dom",
        locator: "a.dl-play",
    } satisfies RuntimeTargetRef,

    serverListItem: {
        id: "dashboard.server.listItem",
        kind: "dom",
        locator: "a[href*='server=']",
    } satisfies RuntimeTargetRef,

    server7Item: {
        id: "dashboard.server.7",
        kind: "dom",
        locator: "a[href*='server=7']",
    } satisfies RuntimeTargetRef,

    openInNewTab: {
        id: "warning.openInNewTab",
        kind: "dom",
        locator: "a:has-text('Mở trong thẻ mới')",
    } satisfies RuntimeTargetRef,

    rufflePlayer: {
        id: "game.rufflePlayer",
        kind: "dom",
        locator: "ruffle-player#player",
    } satisfies RuntimeTargetRef,

    gameHost: {
        id: "game.host",
        kind: "dom",
        locator: "ruffle-player#player",
    } satisfies RuntimeTargetRef,

    attendancePopupClose: {
        id: "attendance.popup.close",
        kind: "dom",
        locator: "", // chỉ dùng nếu về sau bạn xác nhận close button là DOM thật
    } satisfies RuntimeTargetRef,
};

const attendanceFlow = createAttendanceFlow({
    targets: {
        gameHost: targets.gameHost,
    },
    classifyAttendanceTodayCell,
});

async function classifyAttendanceTodayCell(
    ctx: ExecutionContext,
): Promise<AttendanceDailyCellClassification> {
    const analysis = await analyzeAttendanceDaily(ctx);
    const baseClassification = decideAttendanceDailyState(analysis);

    if (analysis.status !== "OK") {
        return baseClassification;
    }

    const { facts, debug, evidence } = analysis;
    const screenshotPath = evidence.screenshotPath;

    const scan = {
        found: facts.found,
        gridBox: facts.gridBox!,
        cells: facts.cells,
        bestCell: facts.bestCell,
        bestRatio: facts.bestRatio,
        secondBestRatio: facts.secondBestRatio,
        winnerMargin: facts.winnerMargin,
    };

    const tomorrowOverlayShapes = debug.tomorrowOverlayShapes;
    const checkinOverlayShapes = debug.checkinOverlayShapes;
    const ticketOverlayShapes = debug.tickOverlayShapes;

    // const gridOverlay: DiagnosticOverlayMeta[] = screenshotPath
    //     ? [
    //           {
    //               purpose: "debug_view",
    //               screenshotPath,
    //               shapes: [
    //                   {
    //                       type: "box",
    //                       x: scan.gridBox.x,
    //                       y: scan.gridBox.y,
    //                       width: scan.gridBox.width,
    //                       height: scan.gridBox.height,
    //                       color: "blue",
    //                       label: "attendance-grid-roi",
    //                       lineWidth: 2,
    //                   },
    //                   ...scan.cells.map((cell) => {
    //                       let color:
    //                           | "green"
    //                           | "yellow"
    //                           | "red"
    //                           | "white"
    //                           | "gray"
    //                           | "blue"
    //                           | "orange" = "white";
    //                       let label = `cell #${cell.index}`;
    //                       let lineWidth = 1;

    //                       if (cell.index === todayCell?.index) {
    //                           color = "green";
    //                           label = `[TODAY] ${label}`;
    //                           lineWidth = 3;
    //                       } else if (cell.index === tomorrowCell?.index) {
    //                           color = "yellow";
    //                           label = `[TOMORROW] ${label}`;
    //                           lineWidth = 3;
    //                       } else if (cell.index === scan.bestCell?.index) {
    //                           color = "orange";
    //                           label = `[BEST] ${label}`;
    //                           lineWidth = 2;
    //                       }

    //                       return {
    //                           type: "box" as const,
    //                           x: cell.x,
    //                           y: cell.y,
    //                           width: cell.width,
    //                           height: cell.height,
    //                           color,
    //                           label,
    //                           lineWidth,
    //                       };
    //                   }),
    //                   ...tomorrowOverlayShapes,
    //                   ...checkinOverlayShapes,
    //                   ...ticketOverlayShapes,
    //               ],
    //               renderNote: "attendance grid scan (all 30 cells)",
    //           },
    //       ]
    //     : [];
    const gridRoiShape: OverlayShape = {
        type: "box",
        x: scan.gridBox.x,
        y: scan.gridBox.y,
        width: scan.gridBox.width,
        height: scan.gridBox.height,
        color: "blue",
        label: "attendance-grid-roi",
        lineWidth: 4,
    };

    const cellOverlayShapes: OverlayShape[] = scan.cells.map((cell) => {
        let color: OverlayColor = "white";
        let label = `cell #${cell.index}`;
        let lineWidth = 3;

        if (cell.index === baseClassification.meta.todayCellIndex) {
            color = "green";
            label = `[TODAY] ${label}`;
            lineWidth = 4;
        } else if (cell.index === baseClassification.meta.tomorrowCellIndex) {
            color = "yellow";
            label = `[TOMORROW] ${label}`;
            lineWidth = 4;
        } else if (cell.index === scan.bestCell?.index) {
            color = "orange";
            label = `[BEST] ${label}`;
            lineWidth = 4;
        }

        return {
            type: "box",
            x: cell.x,
            y: cell.y,
            width: cell.width,
            height: cell.height,
            color,
            label,
            lineWidth,
        };
    });

    const gridOverlay: DiagnosticOverlayMeta[] = screenshotPath
        ? [
              {
                  purpose: "debug_view",
                  screenshotPath,
                  shapes: [
                      gridRoiShape,
                      ...cellOverlayShapes,
                      ...tomorrowOverlayShapes,
                      ...checkinOverlayShapes,
                      ...ticketOverlayShapes,
                  ],
                  renderNote: "attendance grid scan (all 30 cells)",
              },
          ]
        : [];

    console.log(
        "[ATTENDANCE][GRID_OVERLAY_COUNTS]",
        JSON.stringify({
            baseCells: scan.cells.length,
            tomorrowOverlayCount: tomorrowOverlayShapes.length,
            checkinOverlayCount: checkinOverlayShapes.length,
            tickOverlayCount: ticketOverlayShapes.length,
            totalShapes: gridOverlay[0]?.shapes?.length ?? 0,
        }),
    );

    const finalOverlays = gridOverlay;

    console.log(
        "[ATTENDANCE][CLASSIFY_RETURN_OVERLAYS]",
        JSON.stringify(
            finalOverlays.map((o, i) => ({
                index: i,
                purpose: o.purpose,
                screenshotPath: o.screenshotPath,
                shapeCount: o.shapes?.length ?? 0,
                labels: (o.shapes ?? [])
                    .filter((s) => s.type === "box")
                    .map((s) => s.label ?? null),
            })),
            null,
            2,
        ),
    );

    return {
        ...baseClassification,
        screenshotPath,
        attachments: evidence.attachments,
        overlays: gridOverlay,
    };
}

export const td3qBrowserScenario: ScenarioDefinition = {
    id: "td3q-browser",
    name: "TD3Q Browser Scenario",
    version: "0.1.0",
    maxIterations: 15,
    idleIterationLimit: 5,

    detectionRules: [
        //login page
        {
            id: "detect-login-page",
            state: "LOGIN_PAGE",
            async detect(ctx) {
                const submit = await ctx.adapter.queryTarget(
                    targets.submitButton,
                    ctx.signal,
                );
                const password = await ctx.adapter.queryTarget(
                    targets.passwordInput,
                    ctx.signal,
                );
                return submit.found && password.found;
            },
        },

        ...attendanceFlow.detectionRules,
        //game error
        {
            id: "detect-game-error",
            state: "GAME_ERROR",
            async detect(ctx) {
                const screenshot = await ctx.adapter.screenshot?.(ctx.signal);
                if (!screenshot) return false;

                // MVP: detect black screen / stuck frame / error overlay
                // (tạm thời return false → sẽ mở rộng sau)

                return false;
            },
        },
        //game running
        {
            id: "detect-game-running",
            state: "GAME_RUNNING",
            async detect(ctx) {
                const player = await ctx.adapter.queryTarget(
                    targets.gameHost,
                    ctx.signal,
                );
                const warning = await ctx.adapter.queryTarget(
                    targets.openInNewTab,
                    ctx.signal,
                );

                return (
                    player.found && player.visible === true && !warning.found
                );
            },
        },
        // warning page
        {
            id: "detect-warning-page",
            state: "WARNING_PAGE",
            async detect(ctx) {
                const warning = await ctx.adapter.queryTarget(
                    targets.openInNewTab,
                    ctx.signal,
                );
                return warning.found;
            },
        },
        //list serser
        {
            id: "detect-dashboard-server-list-open",
            state: "DASHBOARD_SERVER_LIST_OPEN",
            async detect(ctx) {
                const play = await ctx.adapter.queryTarget(
                    targets.playButton,
                    ctx.signal,
                );
                const serverListItem = await ctx.adapter.queryTarget(
                    targets.server7Item,
                    ctx.signal,
                );
                return play.found && serverListItem.found;
            },
        },
        //dashboard idle
        {
            id: "detect-dashboard-idle",
            state: "DASHBOARD_IDLE",
            async detect(ctx) {
                const play = await ctx.adapter.queryTarget(
                    targets.playButton,
                    ctx.signal,
                );
                const serverListItem = await ctx.adapter.queryTarget(
                    targets.serverListItem,
                    ctx.signal,
                );
                return play.found && !serverListItem.found;
            },
        },
    ],

    transitions: [
        //login
        {
            id: "submit-login",
            from: "LOGIN_PAGE",
            to: "DASHBOARD",
            priority: 100,
            async canRun(ctx) {
                const hasUser = Boolean(ctx.variables.TEST_USER?.trim());
                const hasPass = Boolean(ctx.variables.TEST_PASS?.trim());

                if (!hasUser) {
                    return { allowed: false, reason: "Missing TEST_USER" };
                }
                if (!hasPass) {
                    return { allowed: false, reason: "Missing TEST_PASS" };
                }

                const email = await ctx.adapter.queryTarget(
                    targets.emailInput,
                    ctx.signal,
                );
                const password = await ctx.adapter.queryTarget(
                    targets.passwordInput,
                    ctx.signal,
                );
                const submit = await ctx.adapter.queryTarget(
                    targets.submitButton,
                    ctx.signal,
                );

                return {
                    allowed: email.found && password.found && submit.found,
                    reason:
                        email.found && password.found && submit.found
                            ? undefined
                            : "Login form targets not found",
                };
            },
            async buildAction(ctx) {
                return {
                    id: "action-fill-and-submit-login",
                    kind: "COMPOSITE",
                    actions: [
                        {
                            id: "fill-user",
                            kind: "TYPE",
                            target: targets.emailInput,
                            value: ctx.variables.TEST_USER ?? "",
                        },
                        {
                            id: "fill-pass",
                            kind: "TYPE",
                            target: targets.passwordInput,
                            value: ctx.variables.TEST_PASS ?? "",
                        },
                        {
                            id: "click-submit",
                            kind: "CLICK",
                            target: targets.submitButton,
                        },
                    ],
                };
            },
        },
        //open server list
        {
            id: "open-server-list",
            from: "DASHBOARD_IDLE",
            to: "DASHBOARD_SERVER_LIST_OPEN",
            priority: 90,
            async canRun(ctx) {
                const play = await ctx.adapter.queryTarget(
                    targets.playButton,
                    ctx.signal,
                );
                const serverListItem = await ctx.adapter.queryTarget(
                    targets.serverListItem,
                    ctx.signal,
                );

                return {
                    allowed: play.found && !serverListItem.found,
                    reason:
                        play.found && !serverListItem.found
                            ? undefined
                            : "Server list already open or play button missing",
                };
            },
            async buildAction() {
                return {
                    id: "action-open-server-list",
                    kind: "CLICK",
                    target: targets.playButton,
                };
            },
        },
        //select server
        {
            id: "select-server-7",
            from: "DASHBOARD_SERVER_LIST_OPEN",
            to: "WARNING_PAGE",
            priority: 80,
            async canRun(ctx) {
                const server7 = await ctx.adapter.queryTarget(
                    targets.server7Item,
                    ctx.signal,
                );
                return {
                    allowed: server7.found,
                    reason: server7.found ? undefined : "Server 7 not found",
                };
            },
            async buildAction() {
                return {
                    id: "action-select-server-7",
                    kind: "CLICK",
                    target: targets.server7Item,
                };
            },
        },
        //open game in new tab
        {
            id: "open-in-new-tab",
            from: "WARNING_PAGE",
            to: "GAME_RUNNING",
            priority: 70,
            async canRun(ctx) {
                const open = await ctx.adapter.queryTarget(
                    targets.openInNewTab,
                    ctx.signal,
                );
                return { allowed: open.found };
            },
            async buildAction() {
                return {
                    id: "action-open-in-new-tab",
                    kind: "CLICK_AND_ADOPT_NEW_PAGE",
                    target: targets.openInNewTab,
                };
            },
        },
        ...attendanceFlow.transitions,
    ],
};
