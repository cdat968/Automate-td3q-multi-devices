import type { RuntimeTargetRef } from "../actions/action-types";

export interface TargetPresenceResult {
    found: boolean;
    visible?: boolean;
    enabled?: boolean;
    value?: string | null;
    text?: string | null;
    meta?: Record<string, unknown>;
}

export interface RelativeClickEvidence {
    targetSelector: string;
    x: number;
    y: number;
    xRatio: number;
    yRatio: number;
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export interface DeviceAdapter {
    navigate?(url: string, signal?: AbortSignal): Promise<void>;
    movePointer(x: number, y: number, signal?: AbortSignal): Promise<void>;
    clickAndAdoptNewPage?(
        target: RuntimeTargetRef,
        signal?: AbortSignal,
    ): Promise<void>;

    click(target: RuntimeTargetRef, signal?: AbortSignal): Promise<void>;

    clickPoint?(x: number, y: number, signal?: AbortSignal): Promise<void>;

    type(
        target: RuntimeTargetRef,
        value: string,
        options?: { clearBeforeType?: boolean },
        signal?: AbortSignal,
    ): Promise<void>;
    focus(target: RuntimeTargetRef, signal?: AbortSignal): Promise<void>;
    pressKey(key: string, signal?: AbortSignal): Promise<void>;
    wait(durationMs: number, signal?: AbortSignal): Promise<void>;

    queryTarget(
        target: RuntimeTargetRef,
        signal?: AbortSignal,
    ): Promise<TargetPresenceResult>;
    clickRelativePoint?(
        target: RuntimeTargetRef,
        xRatio: number,
        yRatio: number,
        signal?: AbortSignal,
    ): Promise<RelativeClickEvidence>;
    screenshot?(signal?: AbortSignal): Promise<Uint8Array | Buffer>;
}
