import type { ExecutionContext, ScenarioDefinition } from "../scenario-types";
import type { RuntimeTargetRef } from "../../actions/action-types";
import { DiagnosticOverlayMeta } from "../../../diagnostics/diagnostic-types";
import { AttendanceConfig } from "../features/attendance/attendance-config";
import {
    attendancePopupAnchorDetector,
    attendanceTomorrowReceiveTemplate,
    attendanceTodayCheckedTemplate,
} from "../features/attendance/attendance-detectors";
import {
    ATTENDANCE_CELL_MATCH_THRESHOLD,
    decodePng,
    scanAttendanceGridFromPopupHeader,
    GridCellBox,
    PixelBox,
    buildTomorrowMarkerBox,
    cropAbsoluteRectFromScreenshot,
    buildInnerCellBox,
    computeCyanRatioFromBuffer,
    buildTickCheckBox,
    matchTemplateInPixelBox,
} from "../features/attendance/attendance-vision";
import { AttendanceDailyCellClassification } from "../features/attendance/attendance-daily-classification";
import { createAttendanceFlow } from "../features/attendance/attendance-flow";

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
    const popup = await attendancePopupAnchorDetector.detect(ctx);

    const screenshotPath = popup.screenshotPath;

    if (!popup.matched || !popup.matchBox) {
        return {
            state: "UNKNOWN",
            reason: "popup_anchor_not_matched",
            screenshotPath: popup.screenshotPath,
            attachments: popup.attachments,
            overlays: popup.overlays,
            meta: {
                templateMatched: popup.matched,
            },
            matchBox: popup.matchBox,
        };
    }

    const raw = await ctx.adapter.screenshot?.(ctx.signal);
    if (!raw) {
        return {
            state: "UNKNOWN",
            reason: "no_screenshot",
            screenshotPath: popup.screenshotPath,
            attachments: popup.attachments,
            overlays: popup.overlays,
            meta: {
                templateMatched: popup.matched,
            },
            matchBox: popup.matchBox,
        };
    }

    const buffer = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
    const { width, height } = decodePng(buffer);

    const scan = scanAttendanceGridFromPopupHeader(buffer, popup.matchBox);

    const ATTENDANCE_TODAY_BEST_CELL_FALLBACK_THRESHOLD =
        AttendanceConfig.dailyGrid.bestCellFallbackThreshold;

    console.log(
        "[ATTENDANCE][CLASSIFY_START]",
        JSON.stringify({
            screenshotPath,
            screenshotWidth: width,
            screenshotHeight: height,
            popupMatchBox: popup.matchBox,
            scanGridBox: scan.gridBox,
            bestCellIndex: scan.bestCell?.index,
            bestRatio: Number(scan.bestRatio.toFixed(4)),
            totalCells: scan.cells.length,
        }),
    );

    // gridOverlay moved below after todayCell is resolved

    let tomorrowCell: GridCellBox | undefined;
    let tomorrowScore = -1;
    let matchedTomorrowMarkerBox: PixelBox | undefined;

    const tomorrowOverlayShapes: DiagnosticOverlayMeta["shapes"] = [];
    if (attendanceTomorrowReceiveTemplate) {
        for (const cell of scan.cells) {
            const tomorrowBox = buildTomorrowMarkerBox(cell, width, height);
            tomorrowOverlayShapes.push({
                type: "box",
                x: tomorrowBox.x,
                y: tomorrowBox.y,
                width: tomorrowBox.width,
                height: tomorrowBox.height,
                color: "red",
                label: `tomorrow-roi #${cell.index}`,
                lineWidth: 4,
            });
            const result = matchTemplateInPixelBox(
                buffer,
                attendanceTomorrowReceiveTemplate,
                width,
                height,
                tomorrowBox,
                AttendanceConfig.dailyGrid.tomorrowMarkerMatch.threshold,
                AttendanceConfig.dailyGrid.tomorrowMarkerMatch.scales,
            );

            if (result.score > tomorrowScore) {
                tomorrowScore = result.score;
            }

            console.log(
                "[ATTENDANCE][TOMORROW_CHECK]",
                JSON.stringify({
                    cellIndex: cell.index,
                    matched: result.matched,
                    score: Number(result.score.toFixed(4)),
                    threshold:
                        AttendanceConfig.dailyGrid.tomorrowMarkerMatch
                            .threshold,
                    tomorrowBox,
                }),
            );

            if (result.matched) {
                tomorrowOverlayShapes.push({
                    type: "box",
                    x: tomorrowBox.x,
                    y: tomorrowBox.y,
                    width: tomorrowBox.width,
                    height: tomorrowBox.height,
                    color: "red",
                    label: `tomorrow-match #${cell.index} score=${result.score.toFixed(3)}`,
                    lineWidth: 3,
                });
                tomorrowCell = cell;
                matchedTomorrowMarkerBox = tomorrowBox;
                console.log(
                    "[ATTENDANCE][TOMORROW_FOUND]",
                    JSON.stringify({
                        tomorrowCellIndex: cell.index,
                        score: Number(result.score.toFixed(4)),
                        tomorrowBox,
                    }),
                );
                break;
            }
        }
    }

    console.log(
        "[ATTENDANCE][TOMORROW_SUMMARY]",
        JSON.stringify({
            bestTomorrowScore: Number(tomorrowScore.toFixed(4)),
            threshold: AttendanceConfig.dailyGrid.tomorrowMarkerMatch.threshold,
            found: tomorrowCell ? true : false,
            tomorrowCellIndex: tomorrowCell?.index ?? null,
        }),
    );

    let todayCell: GridCellBox | undefined;
    let cyanRatio = 0;
    let tickMatched = false;
    let tickScore = 0;
    let tickBox: PixelBox | undefined;

    if (tomorrowCell && tomorrowCell.index > 0) {
        todayCell = scan.cells[tomorrowCell.index - 1];
    }

    console.log(
        "[ATTENDANCE][CELL_RESOLUTION]",
        JSON.stringify({
            todayCellIndex: todayCell?.index ?? null,
            // todayCellSource: todayCellSource ?? null,
            tomorrowCellIndex: tomorrowCell?.index ?? null,
            bestCellIndex: scan.bestCell?.index ?? null,
            bestRatio: Number(scan.bestRatio.toFixed(4)),
            totalCells: scan.cells.length,
            scanGridBox: scan.gridBox,
            popupMatchBox: popup.matchBox,
        }),
    );

    const checkinOverlayShapes: DiagnosticOverlayMeta["shapes"] = [];
    const ticketOverlayShapes: DiagnosticOverlayMeta["shapes"] = [];

    if (todayCell) {
        const todayInner = buildInnerCellBox(todayCell, width, height);
        checkinOverlayShapes.push({
            type: "box",
            x: todayInner.x,
            y: todayInner.y,
            width: todayInner.width,
            height: todayInner.height,
            color: "red",
            label: `checkin-roi`,
            lineWidth: 4,
        });
        const todayInnerBuffer = cropAbsoluteRectFromScreenshot(
            buffer,
            todayInner,
        );
        cyanRatio = computeCyanRatioFromBuffer(todayInnerBuffer);

        console.log(
            "[ATTENDANCE][TODAY_CELL_READY_FOR_TICK]",
            JSON.stringify({
                todayCellIndex: todayCell.index,
                todayCellBox: {
                    x: todayCell.x,
                    y: todayCell.y,
                    width: todayCell.width,
                    height: todayCell.height,
                },
                tickBox: buildTickCheckBox(todayCell, width, height),
                cyanRatio: Number(cyanRatio.toFixed(4)),
                enteringTickEvaluation: true,
            }),
        );

        tickBox = buildTickCheckBox(todayCell, width, height);
        ticketOverlayShapes.push({
            type: "box",
            x: tickBox.x,
            y: tickBox.y,
            width: tickBox.width,
            height: tickBox.height,
            color: "orange",
            label: `ticket-roi`,
            lineWidth: 6,
        });
        const tickResult = matchTemplateInPixelBox(
            buffer,
            attendanceTodayCheckedTemplate,
            width,
            height,
            tickBox,
            AttendanceConfig.dailyGrid.tickMatch.threshold,
            AttendanceConfig.dailyGrid.tickMatch.scales,
        );

        tickMatched = tickResult.matched;
        tickScore = tickResult.score;

        console.log(
            "[ATTENDANCE][TICK_CHECK]",
            JSON.stringify({
                todayCellIndex: todayCell.index,
                tickMatched,
                tickScore: Number(tickScore.toFixed(4)),
                threshold: AttendanceConfig.dailyGrid.tickMatch.threshold,
                tickBox,
                cyanRatio: Number(cyanRatio.toFixed(4)),
                todayCellBox: {
                    x: todayCell.x,
                    y: todayCell.y,
                    width: todayCell.width,
                    height: todayCell.height,
                },
            }),
        );
    }

    const gridOverlay: DiagnosticOverlayMeta[] = screenshotPath
        ? [
              {
                  purpose: "debug_view",
                  screenshotPath,
                  shapes: [
                      {
                          type: "box",
                          x: scan.gridBox.x,
                          y: scan.gridBox.y,
                          width: scan.gridBox.width,
                          height: scan.gridBox.height,
                          color: "blue",
                          label: "attendance-grid-roi",
                          lineWidth: 2,
                      },
                      ...scan.cells.map((cell) => {
                          let color:
                              | "green"
                              | "yellow"
                              | "red"
                              | "white"
                              | "gray"
                              | "blue"
                              | "orange" = "white";
                          let label = `cell #${cell.index}`;
                          let lineWidth = 1;

                          if (cell.index === todayCell?.index) {
                              color = "green";
                              label = `[TODAY] ${label}`;
                              lineWidth = 3;
                          } else if (cell.index === tomorrowCell?.index) {
                              color = "yellow";
                              label = `[TOMORROW] ${label}`;
                              lineWidth = 3;
                          } else if (cell.index === scan.bestCell?.index) {
                              color = "orange";
                              label = `[BEST] ${label}`;
                              lineWidth = 2;
                          }

                          return {
                              type: "box" as const,
                              x: cell.x,
                              y: cell.y,
                              width: cell.width,
                              height: cell.height,
                              color,
                              label,
                              lineWidth,
                          };
                      }),
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
    // 1) Semantic path: if tomorrow marker found, classify the previous cell.
    if (todayCell && tickMatched) {
        console.log(
            "[ATTENDANCE][CLASSIFY_DECISION]",
            JSON.stringify({
                state: "DONE",
                reason: "semantic_tick_on_today_cell",
                todayCellIndex: todayCell.index,
                tomorrowCellIndex: tomorrowCell?.index,
                tickMatched,
                tickScore: Number(tickScore.toFixed(4)),
                tomorrowScore: Number(tomorrowScore.toFixed(4)),
                cyanRatio: Number(cyanRatio.toFixed(4)),
            }),
        );
        return {
            state: "DONE",
            reason: "semantic_tick_on_today_cell",
            screenshotPath,
            attachments: popup.attachments,
            overlays: gridOverlay,
            meta: {
                todayCellIndex: todayCell.index,
                // todayCellSource,
                tomorrowCellIndex: tomorrowCell?.index,
                cyanRatio: Number(cyanRatio.toFixed(4)),
                tickMatched,
                tickScore: Number(tickScore.toFixed(4)),
                tomorrowMatched: true,
                tomorrowScore: Number(tomorrowScore.toFixed(4)),
                gridBestRatio: Number(scan.bestRatio.toFixed(4)),
                bestCellIndex: scan.bestCell?.index,
                todayCellBox: todayCell
                    ? {
                          x: todayCell.x,
                          y: todayCell.y,
                          width: todayCell.width,
                          height: todayCell.height,
                      }
                    : undefined,
                tomorrowCellBox: tomorrowCell
                    ? {
                          x: tomorrowCell.x,
                          y: tomorrowCell.y,
                          width: tomorrowCell.width,
                          height: tomorrowCell.height,
                      }
                    : undefined,
                tickBox: tickBox
                    ? {
                          x: tickBox.x,
                          y: tickBox.y,
                          width: tickBox.width,
                          height: tickBox.height,
                      }
                    : undefined,
                tomorrowMarkerBox: matchedTomorrowMarkerBox
                    ? {
                          x: matchedTomorrowMarkerBox.x,
                          y: matchedTomorrowMarkerBox.y,
                          width: matchedTomorrowMarkerBox.width,
                          height: matchedTomorrowMarkerBox.height,
                      }
                    : undefined,
            },
            matchBox: {
                x: todayCell.x,
                y: todayCell.y,
                width: todayCell.width,
                height: todayCell.height,
            },
        };
    }

    if (todayCell && cyanRatio >= ATTENDANCE_CELL_MATCH_THRESHOLD) {
        console.log(
            "[ATTENDANCE][CLASSIFY_DECISION]",
            JSON.stringify({
                state: "READY",
                reason: "semantic_cyan_on_today_cell",
                todayCellIndex: todayCell.index,
                tomorrowCellIndex: tomorrowCell?.index,
                tickMatched,
                tickScore: Number(tickScore.toFixed(4)),
                tomorrowScore: Number(tomorrowScore.toFixed(4)),
                cyanRatio: Number(cyanRatio.toFixed(4)),
                cyanThreshold: ATTENDANCE_CELL_MATCH_THRESHOLD,
            }),
        );
        return {
            state: "READY",
            reason: "semantic_cyan_on_today_cell",
            screenshotPath,
            overlays: gridOverlay,
            attachments: popup.attachments,
            meta: {
                todayCellIndex: todayCell.index,
                // todayCellSource,
                tomorrowCellIndex: tomorrowCell?.index,
                cyanRatio: Number(cyanRatio.toFixed(4)),
                tickMatched,
                tickScore: Number(tickScore.toFixed(4)),
                tomorrowMatched: true,
                tomorrowScore: Number(tomorrowScore.toFixed(4)),
                gridBestRatio: Number(scan.bestRatio.toFixed(4)),
                bestCellIndex: scan.bestCell?.index,
                todayCellBox: todayCell
                    ? {
                          x: todayCell.x,
                          y: todayCell.y,
                          width: todayCell.width,
                          height: todayCell.height,
                      }
                    : undefined,
                tomorrowCellBox: tomorrowCell
                    ? {
                          x: tomorrowCell.x,
                          y: tomorrowCell.y,
                          width: tomorrowCell.width,
                          height: tomorrowCell.height,
                      }
                    : undefined,
                tickBox: tickBox
                    ? {
                          x: tickBox.x,
                          y: tickBox.y,
                          width: tickBox.width,
                          height: tickBox.height,
                      }
                    : undefined,
                tomorrowMarkerBox: matchedTomorrowMarkerBox
                    ? {
                          x: matchedTomorrowMarkerBox.x,
                          y: matchedTomorrowMarkerBox.y,
                          width: matchedTomorrowMarkerBox.width,
                          height: matchedTomorrowMarkerBox.height,
                      }
                    : undefined,
            },
            matchBox: {
                x: todayCell.x,
                y: todayCell.y,
                width: todayCell.width,
                height: todayCell.height,
            },
        };
    }

    // 2) Fallback path: if semantic marker not found or semantic state unresolved,
    // use the existing best-cyan heuristic.
    if (scan.found && scan.bestCell) {
        console.log(
            "[ATTENDANCE][CLASSIFY_DECISION]",
            JSON.stringify({
                state: "READY",
                reason: "fallback_best_cyan_cell",
                bestCellIndex: scan.bestCell.index,
                bestRatio: Number(scan.bestRatio.toFixed(4)),
                tomorrowCellIndex: tomorrowCell?.index,
                tomorrowScore: Number(tomorrowScore.toFixed(4)),
            }),
        );
        return {
            state: "READY",
            reason: "fallback_best_cyan_cell",
            screenshotPath,
            attachments: popup.attachments,
            overlays: gridOverlay,
            meta: {
                todayCellIndex: scan.bestCell.index,
                // todayCellSource,
                cyanRatio: Number(scan.bestRatio.toFixed(4)),
                tickMatched: false,
                tickScore: 0,
                tomorrowMatched: Boolean(tomorrowCell),
                tomorrowScore: Number(tomorrowScore.toFixed(4)),
                gridBestRatio: Number(scan.bestRatio.toFixed(4)),
                bestCellIndex: scan.bestCell.index,
                todayCellBox: scan.bestCell
                    ? {
                          x: scan.bestCell.x,
                          y: scan.bestCell.y,
                          width: scan.bestCell.width,
                          height: scan.bestCell.height,
                      }
                    : undefined,
                tomorrowCellBox: tomorrowCell
                    ? {
                          x: tomorrowCell.x,
                          y: tomorrowCell.y,
                          width: tomorrowCell.width,
                          height: tomorrowCell.height,
                      }
                    : undefined,
                tickBox: undefined,
                tomorrowMarkerBox: matchedTomorrowMarkerBox
                    ? {
                          x: matchedTomorrowMarkerBox.x,
                          y: matchedTomorrowMarkerBox.y,
                          width: matchedTomorrowMarkerBox.width,
                          height: matchedTomorrowMarkerBox.height,
                      }
                    : undefined,
            },
            matchBox: {
                x: scan.bestCell.x,
                y: scan.bestCell.y,
                width: scan.bestCell.width,
                height: scan.bestCell.height,
            },
        };
    }

    if (!tomorrowCell && !scan.found) {
        console.log(
            "[ATTENDANCE][CLASSIFY_DECISION]",
            JSON.stringify({
                state: "DONE",
                reason: "fallback_no_tomorrow_no_cyan",
                bestCellIndex: scan.bestCell?.index,
                bestRatio: Number(scan.bestRatio.toFixed(4)),
                secondBestRatio: Number(scan.secondBestRatio.toFixed(4)),
                winnerMargin: Number(scan.winnerMargin.toFixed(4)),
                tomorrowCellIndex: null,
                tomorrowScore: Number(tomorrowScore.toFixed(4)),
                cyanThreshold: ATTENDANCE_CELL_MATCH_THRESHOLD,
            }),
        );

        return {
            state: "DONE",
            reason: "fallback_no_tomorrow_no_cyan",
            screenshotPath,
            attachments: popup.attachments,
            overlays: gridOverlay,
            meta: {
                todayCellIndex: undefined,
                // todayCellSource,
                tomorrowCellIndex: undefined,
                cyanRatio: Number(scan.bestRatio.toFixed(4)),
                tickMatched: false,
                tickScore: 0,
                tomorrowMatched: false,
                tomorrowScore: Number(tomorrowScore.toFixed(4)),
                gridBestRatio: Number(scan.bestRatio.toFixed(4)),
                bestCellIndex: scan.bestCell?.index,
                todayCellBox: undefined,
                tomorrowCellBox: undefined,
                tickBox: undefined,
                tomorrowMarkerBox: undefined,
            },
            matchBox: scan.bestCell
                ? {
                      x: scan.bestCell.x,
                      y: scan.bestCell.y,
                      width: scan.bestCell.width,
                      height: scan.bestCell.height,
                  }
                : undefined,
        };
    }

    if (!todayCell) {
        console.log(
            "[ATTENDANCE][TODAY_CELL_MISSING]",
            JSON.stringify({
                todayCellIndex: null,
                tomorrowCellIndex: tomorrowCell?.index ?? null,
                bestCellIndex: scan.bestCell?.index ?? null,
                bestRatio: Number(scan.bestRatio.toFixed(4)),
                tickMatched,
                tickScore: Number(tickScore.toFixed(4)),
                tomorrowScore: Number(tomorrowScore.toFixed(4)),
                cyanRatio: Number(cyanRatio.toFixed(4)),
            }),
        );
    }

    console.log(
        "[ATTENDANCE][CLASSIFY_DECISION]",
        JSON.stringify({
            state: "UNKNOWN",
            // todayCellSource,
            reason: tomorrowCell
                ? "semantic_today_cell_unresolved"
                : "no_semantic_marker_and_no_fallback_match",
            todayCellIndex: todayCell?.index,
            tomorrowCellIndex: tomorrowCell?.index,
            tickMatched,
            tickScore: Number(tickScore.toFixed(4)),
            tomorrowScore: Number(tomorrowScore.toFixed(4)),
            cyanRatio: Number(cyanRatio.toFixed(4)),
            bestCellIndex: scan.bestCell?.index,
            bestRatio: Number(scan.bestRatio.toFixed(4)),
        }),
    );

    return {
        state: "UNKNOWN",
        reason: tomorrowCell
            ? "semantic_today_cell_unresolved"
            : "no_semantic_marker_and_no_fallback_match",
        screenshotPath,
        attachments: popup.attachments,
        overlays: gridOverlay,
        meta: {
            todayCellIndex: todayCell?.index,
            // todayCellSource,
            tomorrowCellIndex: tomorrowCell?.index,
            cyanRatio: Number(cyanRatio.toFixed(4)),
            tickMatched,
            tickScore: Number(tickScore.toFixed(4)),
            tomorrowMatched: Boolean(tomorrowCell),
            tomorrowScore: Number(tomorrowScore.toFixed(4)),
            gridBestRatio: Number(scan.bestRatio.toFixed(4)),
            bestCellIndex: scan.bestCell?.index,
            todayCellBox: todayCell
                ? {
                      x: todayCell.x,
                      y: todayCell.y,
                      width: todayCell.width,
                      height: todayCell.height,
                  }
                : undefined,
            tomorrowCellBox: tomorrowCell
                ? {
                      x: tomorrowCell.x,
                      y: tomorrowCell.y,
                      width: tomorrowCell.width,
                      height: tomorrowCell.height,
                  }
                : undefined,
            tickBox: tickBox
                ? {
                      x: tickBox.x,
                      y: tickBox.y,
                      width: tickBox.width,
                      height: tickBox.height,
                  }
                : undefined,
            tomorrowMarkerBox: matchedTomorrowMarkerBox
                ? {
                      x: matchedTomorrowMarkerBox.x,
                      y: matchedTomorrowMarkerBox.y,
                      width: matchedTomorrowMarkerBox.width,
                      height: matchedTomorrowMarkerBox.height,
                  }
                : undefined,
        },
        matchBox: todayCell
            ? {
                  x: todayCell.x,
                  y: todayCell.y,
                  width: todayCell.width,
                  height: todayCell.height,
              }
            : scan.bestCell
              ? {
                    x: scan.bestCell.x,
                    y: scan.bestCell.y,
                    width: scan.bestCell.width,
                    height: scan.bestCell.height,
                }
              : undefined,
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
