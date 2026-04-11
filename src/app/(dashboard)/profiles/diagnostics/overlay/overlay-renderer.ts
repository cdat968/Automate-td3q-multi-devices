import sharp from "sharp";
import { ensureParentDir } from "../artifact/artifact-writer";
import type {
    OverlayColor,
    OverlayPayload,
    OverlayShape,
} from "./overlay-types";

function colorToCss(color?: OverlayColor): string {
    switch (color) {
        case "green":
            return "#22c55e";
        case "blue":
            return "#3b82f6";
        case "yellow":
            return "#eab308";
        case "orange":
            return "#f97316";
        case "white":
            return "#ffffff";
        case "red":
        default:
            return "#ef4444";
    }
}

function escapeXml(text: string): string {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}

function renderShape(shape: OverlayShape): string {
    if (shape.type === "box") {
        const stroke = colorToCss(shape.color);
        const lineWidth = shape.lineWidth ?? 3;
        const labelWidth = Math.max(60, (shape.label?.length ?? 8) * 8);

        return `
      <rect
        x="${shape.x}"
        y="${shape.y}"
        width="${shape.width}"
        height="${shape.height}"
        fill="none"
        stroke="${stroke}"
        stroke-width="${lineWidth}"
        rx="4"
      />
      ${
          shape.label
              ? `
        <rect
          x="${shape.x}"
          y="${Math.max(0, shape.y - 22)}"
          width="${labelWidth}"
          height="18"
          fill="rgba(0,0,0,0.7)"
          rx="4"
        />
        <text
          x="${shape.x + 6}"
          y="${Math.max(14, shape.y - 8)}"
          fill="${stroke}"
          font-size="13"
          font-family="Arial, sans-serif"
          font-weight="700"
        >${escapeXml(shape.label)}</text>
      `
              : ""
      }
    `;
    }

    if (shape.type === "point") {
        const fill = colorToCss(shape.color);
        const radius = shape.radius ?? 6;
        const labelWidth = Math.max(60, (shape.label?.length ?? 8) * 8);

        return `
      <circle cx="${shape.x}" cy="${shape.y}" r="${radius}" fill="${fill}" />
      <line x1="${shape.x - 10}" y1="${shape.y}" x2="${shape.x + 10}" y2="${shape.y}" stroke="${fill}" stroke-width="2" />
      <line x1="${shape.x}" y1="${shape.y - 10}" x2="${shape.x}" y2="${shape.y + 10}" stroke="${fill}" stroke-width="2" />
      ${
          shape.label
              ? `
        <rect
          x="${shape.x + 10}"
          y="${Math.max(0, shape.y - 22)}"
          width="${labelWidth}"
          height="18"
          fill="rgba(0,0,0,0.7)"
          rx="4"
        />
        <text
          x="${shape.x + 16}"
          y="${Math.max(14, shape.y - 8)}"
          fill="${fill}"
          font-size="13"
          font-family="Arial, sans-serif"
          font-weight="700"
        >${escapeXml(shape.label)}</text>
      `
              : ""
      }
    `;
    }

    const fill = colorToCss(shape.color);
    const fontSize = shape.fontSize ?? 15;
    const width = Math.max(80, shape.text.length * 8);

    return `
    ${
        shape.background
            ? `
      <rect
        x="${shape.x - 4}"
        y="${shape.y - fontSize}"
        width="${width}"
        height="${fontSize + 8}"
        fill="rgba(0,0,0,0.7)"
        rx="4"
      />
    `
            : ""
    }
    <text
      x="${shape.x}"
      y="${shape.y}"
      fill="${fill}"
      font-size="${fontSize}"
      font-family="Arial, sans-serif"
      font-weight="700"
    >${escapeXml(shape.text)}</text>
  `;
}

function buildSvgOverlay(
    width: number,
    height: number,
    payload: OverlayPayload,
): Buffer {
    const header = `${payload.meta.scenarioId} | iter=${payload.meta.iteration} | ${payload.meta.actionKind} | ${payload.meta.actionId}`;
    const note = payload.meta.note ?? "";

    const svg = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="12" width="${Math.max(340, header.length * 8)}" height="24" fill="rgba(0,0,0,0.75)" rx="6" />
    <text x="20" y="29" fill="#ffffff" font-size="14" font-family="Arial, sans-serif" font-weight="700">
      ${escapeXml(header)}
    </text>

    ${
        note
            ? `
      <rect x="12" y="42" width="${Math.max(220, note.length * 8)}" height="22" fill="rgba(0,0,0,0.65)" rx="6" />
      <text x="20" y="57" fill="#facc15" font-size="13" font-family="Arial, sans-serif" font-weight="700">
        ${escapeXml(note)}
      </text>
    `
            : ""
    }

    ${payload.shapes.map(renderShape).join("\n")}
  </svg>`;

    return Buffer.from(svg);
}

export async function renderOverlayImage(params: {
    screenshotPath: string;
    outputPath: string;
    payload: OverlayPayload;
}): Promise<void> {
    await ensureParentDir(params.outputPath);

    const image = sharp(params.screenshotPath);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
        throw new Error(
            `Unable to determine screenshot dimensions for ${params.screenshotPath}`,
        );
    }

    const svgBuffer = buildSvgOverlay(
        metadata.width,
        metadata.height,
        params.payload,
    );

    await image
        .composite([
            {
                input: svgBuffer,
                top: 0,
                left: 0,
            },
        ])
        .png()
        .toFile(params.outputPath);
}
// import sharp from "sharp";
// import { ensureParentDir } from "../artifact/artifact-writer";
// import {
//     OverlayColor,
//     OverlayPayload,
//     OverlayRenderInput,
//     OverlayShape,
// } from "./overlay-types";

// function colorToCss(color?: OverlayColor): string {
//     switch (color) {
//         case "green":
//             return "#22c55e";
//         case "blue":
//             return "#3b82f6";
//         case "yellow":
//             return "#eab308";
//         case "orange":
//             return "#f97316";
//         case "white":
//             return "#ffffff";
//         case "red":
//         default:
//             return "#ef4444";
//     }
// }

// function escapeXml(text: string): string {
//     return text
//         .replaceAll("&", "&amp;")
//         .replaceAll("<", "&lt;")
//         .replaceAll(">", "&gt;")
//         .replaceAll('"', "&quot;")
//         .replaceAll("'", "&apos;");
// }

// function renderShape(shape: OverlayShape): string {
//     if (shape.type === "box") {
//         const stroke = colorToCss(shape.color);
//         const lineWidth = shape.lineWidth ?? 3;

//         const labelSvg = shape.label
//             ? `
//         <rect x="${shape.x}" y="${Math.max(0, shape.y - 24)}" width="${Math.max(
//             60,
//             shape.label.length * 8,
//         )}" height="20" fill="rgba(0,0,0,0.7)" rx="4" />
//         <text x="${shape.x + 6}" y="${Math.max(14, shape.y - 9)}"
//           fill="${stroke}" font-size="14" font-family="Arial, sans-serif"
//           font-weight="700">${escapeXml(shape.label)}</text>
//       `
//             : "";

//         return `
//       <rect
//         x="${shape.x}"
//         y="${shape.y}"
//         width="${shape.width}"
//         height="${shape.height}"
//         fill="none"
//         stroke="${stroke}"
//         stroke-width="${lineWidth}"
//         rx="4"
//       />
//       ${labelSvg}
//     `;
//     }

//     if (shape.type === "point") {
//         const fill = colorToCss(shape.color);
//         const radius = shape.radius ?? 6;

//         const labelSvg = shape.label
//             ? `
//         <rect x="${shape.x + 10}" y="${shape.y - 22}" width="${Math.max(
//             50,
//             shape.label.length * 8,
//         )}" height="20" fill="rgba(0,0,0,0.7)" rx="4" />
//         <text x="${shape.x + 16}" y="${shape.y - 8}"
//           fill="${fill}" font-size="14" font-family="Arial, sans-serif"
//           font-weight="700">${escapeXml(shape.label)}</text>
//       `
//             : "";

//         return `
//       <circle cx="${shape.x}" cy="${shape.y}" r="${radius}" fill="${fill}" />
//       <line x1="${shape.x - 12}" y1="${shape.y}" x2="${shape.x + 12}" y2="${shape.y}"
//         stroke="${fill}" stroke-width="2" />
//       <line x1="${shape.x}" y1="${shape.y - 12}" x2="${shape.x}" y2="${shape.y + 12}"
//         stroke="${fill}" stroke-width="2" />
//       ${labelSvg}
//     `;
//     }

//     if (shape.type === "line") {
//         const stroke = colorToCss(shape.color);
//         const lineWidth = shape.lineWidth ?? 2;

//         const midX = (shape.x1 + shape.x2) / 2;
//         const midY = (shape.y1 + shape.y2) / 2;

//         const labelSvg = shape.label
//             ? `
//         <rect x="${midX + 6}" y="${midY - 18}" width="${Math.max(
//             50,
//             shape.label.length * 8,
//         )}" height="20" fill="rgba(0,0,0,0.7)" rx="4" />
//         <text x="${midX + 12}" y="${midY - 4}"
//           fill="${stroke}" font-size="14" font-family="Arial, sans-serif"
//           font-weight="700">${escapeXml(shape.label)}</text>
//       `
//             : "";

//         return `
//       <line x1="${shape.x1}" y1="${shape.y1}" x2="${shape.x2}" y2="${shape.y2}"
//         stroke="${stroke}" stroke-width="${lineWidth}" />
//       ${labelSvg}
//     `;
//     }

//     const color = colorToCss(shape.color);
//     const fontSize = shape.fontSize ?? 16;
//     const bg = shape.background
//         ? `<rect x="${shape.x - 4}" y="${shape.y - fontSize}" width="${Math.max(
//               80,
//               shape.text.length * fontSize * 0.6,
//           )}" height="${fontSize + 8}" fill="rgba(0,0,0,0.7)" rx="4" />`
//         : "";

//     return `
//     ${bg}
//     <text x="${shape.x}" y="${shape.y}"
//       fill="${color}" font-size="${fontSize}"
//       font-family="Arial, sans-serif" font-weight="700">
//       ${escapeXml(shape.text)}
//     </text>
//   `;
// }

// function buildSvgOverlay(
//     width: number,
//     height: number,
//     payload: OverlayPayload,
// ): Buffer {
//     const headerText = [
//         payload.meta.scenario,
//         payload.meta.state,
//         payload.meta.action,
//         payload.meta.iteration != null
//             ? `iter=${payload.meta.iteration}`
//             : undefined,
//     ]
//         .filter(Boolean)
//         .join(" | ");

//     const noteText = payload.meta.note ?? "";
//     const headerBlock = `
//     <rect x="12" y="12" width="${Math.max(320, headerText.length * 9)}" height="28"
//       fill="rgba(0,0,0,0.75)" rx="6" />
//     <text x="20" y="31" fill="#ffffff" font-size="16"
//       font-family="Arial, sans-serif" font-weight="700">
//       ${escapeXml(headerText)}
//     </text>
//     ${
//         noteText
//             ? `
//       <rect x="12" y="48" width="${Math.max(260, noteText.length * 8)}" height="26"
//         fill="rgba(0,0,0,0.65)" rx="6" />
//       <text x="20" y="66" fill="#facc15" font-size="14"
//         font-family="Arial, sans-serif" font-weight="600">
//         ${escapeXml(noteText)}
//       </text>
//     `
//             : ""
//     }
//   `;

//     const shapesSvg = payload.shapes.map(renderShape).join("\n");

//     const svg = `
//     <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
//       ${headerBlock}
//       ${shapesSvg}
//     </svg>
//   `;

//     return Buffer.from(svg);
// }

// export async function renderOverlay(input: OverlayRenderInput): Promise<void> {
//     await ensureParentDir(input.outputPath);

//     const image = sharp(input.screenshotPath);
//     const meta = await image.metadata();

//     if (!meta.width || !meta.height) {
//         throw new Error(
//             `Unable to determine image dimensions for ${input.screenshotPath}`,
//         );
//     }

//     const svgBuffer = buildSvgOverlay(meta.width, meta.height, input.payload);

//     await image
//         .composite([
//             {
//                 input: svgBuffer,
//                 top: 0,
//                 left: 0,
//             },
//         ])
//         .png()
//         .toFile(input.outputPath);
// }
