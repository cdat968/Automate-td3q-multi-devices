/**
 * diagnostic-helpers.ts
 *
 * Compatibility bridge for the diagnostics pipeline.
 * Use diagnostic-emitters.ts and diagnostic-overlay-builders.ts for new code.
 */

export * from "./diagnostic-emitters";
export * from "./diagnostic-overlay-builders";

// ─── Compatibility Mappings ──────────────────────────────────────────────────

import { 
    buildRelativeClickOverlay,
    buildDetectorMatchOverlay 
} from "./diagnostic-overlay-builders";

/** @deprecated Use buildRelativeClickOverlay */
export const buildRelativeClickOverlayMeta = buildRelativeClickOverlay;

/** @deprecated Use buildDetectorMatchOverlay */
export const buildDetectorMatchOverlayMeta = buildDetectorMatchOverlay;
