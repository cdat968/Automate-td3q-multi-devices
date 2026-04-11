export type OverlayColor =
    | "red"
    | "green"
    | "blue"
    | "yellow"
    | "orange"
    | "white";

export type OverlayShape =
    | {
          type: "box";
          x: number;
          y: number;
          width: number;
          height: number;
          color?: OverlayColor;
          label?: string;
          lineWidth?: number;
      }
    | {
          type: "point";
          x: number;
          y: number;
          color?: OverlayColor;
          radius?: number;
          label?: string;
      }
    | {
          type: "text";
          x: number;
          y: number;
          text: string;
          color?: OverlayColor;
          fontSize?: number;
          background?: boolean;
      };

export interface OverlayMeta {
    timestamp?: string;
    scenario?: string;
    scenarioId?: string;
    iteration?: number;
    state?: string;
    action?: string;
    actionId?: string;
    actionKind?: string;
    detector?: string;
    note?: string;
}
// export interface OverlayMeta {
//     scenarioId?: string;
//     timestamp?: string;
//     iteration?: number;
//     state?: string;
//     action?: string;
//     actionId?: string;
//     actionKind?: string;
//     detector?: string;
//     scenario?: string;
//     note?: string;
// }

export interface OverlayPayload {
    meta: OverlayMeta;
    shapes: OverlayShape[];
}
// export type OverlayColor =
//     | "red"
//     | "green"
//     | "blue"
//     | "yellow"
//     | "orange"
//     | "white";

// export type OverlayShape =
//     | {
//           type: "box";
//           x: number;
//           y: number;
//           width: number;
//           height: number;
//           color?: OverlayColor;
//           label?: string;
//           lineWidth?: number;
//       }
//     | {
//           type: "point";
//           x: number;
//           y: number;
//           color?: OverlayColor;
//           radius?: number;
//           label?: string;
//       }
//     | {
//           type: "text";
//           x: number;
//           y: number;
//           text: string;
//           color?: OverlayColor;
//           fontSize?: number;
//           background?: boolean;
//       }
//     | {
//           type: "line";
//           x1: number;
//           y1: number;
//           x2: number;
//           y2: number;
//           color?: OverlayColor;
//           lineWidth?: number;
//           label?: string;
//       };

// export interface OverlayMeta {
//     timestamp: string;
//     iteration?: number;
//     state?: string;
//     action?: string;
//     detector?: string;
//     scenario?: string;
//     note?: string;
// }

// export interface OverlayPayload {
//     meta: OverlayMeta;
//     shapes: OverlayShape[];
// }

// export interface OverlayRenderInput {
//     screenshotPath: string;
//     outputPath: string;
//     payload: OverlayPayload;
// }
