export type RatioRoi = {
    xRatio: number;
    yRatio: number;
    widthRatio: number;
    heightRatio: number;
};

export type RelativeCellBox = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export const AttendanceConfig = {
    detectors: {
        icon: {
            threshold: 0.75,
            scales: [0.85, 0.9, 1.0, 1.1],
            roi: {
                xRatio: 0.68,
                yRatio: 0.08,
                widthRatio: 0.22,
                heightRatio: 0.22,
            } satisfies RatioRoi,
        },

        popupHeader: {
            roi: {
                xRatio: 0.44,
                yRatio: 0.12,
                widthRatio: 0.32,
                heightRatio: 0.14,
            } satisfies RatioRoi,
        },

        popupCloseButton: {
            roi: {
                xRatio: 0.65,
                yRatio: 0.02,
                widthRatio: 0.3,
                heightRatio: 0.25,
            } satisfies RatioRoi,
        },

        dailyRewardPopup: {
            roi: {
                xRatio: 0.43,
                yRatio: 0.33,
                widthRatio: 0.15,
                heightRatio: 0.1,
            } satisfies RatioRoi,
        },

        dailyRewardCloseButton: {
            roi: {
                xRatio: 0.63,
                yRatio: 0.28,
                widthRatio: 0.08,
                heightRatio: 0.15,
            } satisfies RatioRoi,
        },
    },

    milestone: {
        days: [2, 5, 10, 20, 30] as const,

        slotRois: [
            {
                xRatio: 0.36,
                yRatio: 0.866,
                widthRatio: 0.048,
                heightRatio: 0.0946,
            },
            {
                xRatio: 0.45,
                yRatio: 0.862,
                widthRatio: 0.049,
                heightRatio: 0.0965,
            },
            {
                xRatio: 0.555,
                yRatio: 0.866,
                widthRatio: 0.048,
                heightRatio: 0.095,
            },
            {
                xRatio: 0.66,
                yRatio: 0.866,
                widthRatio: 0.048,
                heightRatio: 0.095,
            },
            {
                xRatio: 0.76,
                yRatio: 0.866,
                widthRatio: 0.048,
                heightRatio: 0.095,
            },
        ] satisfies RatioRoi[],

        barRoi: {
            xRatio: 0.362,
            yRatio: 0.857,
            widthRatio: 0.448,
            heightRatio: 0.11,
        } satisfies RatioRoi,
    },

    dailyGrid: {
        cols: 6,
        rows: 5,

        cyanMatchThreshold: 0.72,
        cyanWinnerMargin: 0.05,
        bestCellFallbackThreshold: 0.72,

        popupRelativeGridBox: {
            xOffsetByHeaderWidth: -0.95,
            yOffsetByHeaderHeight: 3.08,
            widthByHeaderWidth: 2.9,
            heightByHeaderHeight: 11,
        },

        cyanSampleBoxInCell: {
            x: 0.66,
            y: 0.26,
            width: 0.26,
            height: 0.36,
        } satisfies RelativeCellBox,

        tomorrowMarkerBoxInCell: {
            x: 0.31,
            y: 0.72,
            width: 0.72,
            height: 0.25,
        } satisfies RelativeCellBox,

        tomorrowMarkerMatch: {
            threshold: 0.72,
            scales: [0.9, 1.0, 1.1],
        },

        tickBoxInCell: {
            x: 0.28,
            y: 0.3,
            width: 0.4,
            height: 0.66,
        } satisfies RelativeCellBox,

        tickMatch: {
            threshold: 0.7,
            scales: [0.85, 0.95, 1.0, 1.1],
        },
    },

    retry: {
        maxRetry: 3,
        verifyWindowIterations: 2,
    },

    waits: {
        afterGameLoadMs: 5000,
        afterAttendanceClickShortMs: 200,
        afterAttendanceClickSettleMs: 700,
        afterDailyRewardCloseMs: 100,
        prepareCloseAttendancePopupMs: 100,
    },

    interactions: {
        pointerAwayAfterAttendanceClick: {
            xRatio: 0.08,
            yRatio: 0.92,
        },
    },
} as const;
