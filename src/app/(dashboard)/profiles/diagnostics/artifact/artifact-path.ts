import path from "path";

export interface BuildArtifactPathOptions {
    scenarioId: string;
    timestamp: string;
    label: string;
    iteration?: number;
    extension?: "png" | "json";
}

function sanitize(value: string): string {
    return value.replace(/[^a-zA-Z0-9_-]+/g, "_");
}

export function buildArtifactPath(options: BuildArtifactPathOptions): string {
    const dir = path.join(
        process.cwd(),
        "artifacts",
        sanitize(options.scenarioId),
    );

    const filename = [
        options.timestamp,
        sanitize(options.label),
        options.iteration != null ? `iter${options.iteration}` : undefined,
    ]
        .filter(Boolean)
        .join("_");

    return path.join(dir, `${filename}.${options.extension ?? "png"}`);
}

// import path from "node:path";

// export interface ArtifactPathOptions {
//     rootDir?: string;
//     namespace?: string;
//     timestamp: string;
//     iteration?: number;
//     state?: string;
//     action?: string;
//     phase?: "before" | "after" | "single";
//     suffix?: string;
//     extension?: "png" | "json";
// }

// function sanitize(value?: string): string {
//     if (!value) return "unknown";
//     return value.replace(/[^a-zA-Z0-9_-]+/g, "_");
// }

// export function buildArtifactPath(options: ArtifactPathOptions): string {
//     const rootDir =
//         options.rootDir ?? path.join(process.cwd(), "artifacts", "ruffle");
//     const namespace = sanitize(options.namespace ?? "overlay");

//     const parts = [
//         options.timestamp,
//         options.iteration != null ? `iter${options.iteration}` : undefined,
//         sanitize(options.state),
//         sanitize(options.action),
//         options.phase,
//         sanitize(options.suffix),
//     ].filter(Boolean);

//     const fileName = `${parts.join("_")}.${options.extension ?? "png"}`;
//     return path.join(rootDir, namespace, fileName);
// }
