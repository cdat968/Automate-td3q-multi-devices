import fs from "fs/promises";
import path from "path";

export async function ensureParentDir(filePath: string): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
}

export async function writeBufferArtifact(
    filePath: string,
    buffer: Buffer,
): Promise<void> {
    await ensureParentDir(filePath);
    await fs.writeFile(filePath, buffer);
}
// import fs from "node:fs/promises";
// import path from "node:path";

// export async function ensureParentDir(filePath: string): Promise<void> {
//     await fs.mkdir(path.dirname(filePath), { recursive: true });
// }

// export async function writeJsonArtifact(
//     filePath: string,
//     data: unknown,
// ): Promise<void> {
//     await ensureParentDir(filePath);
//     await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
// }
