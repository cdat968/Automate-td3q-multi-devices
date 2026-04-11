/**
 * Standardized AbortSignal utilities for the runtime.
 */

/**
 * Throws a standardized error if the signal is already aborted.
 * Use this at the start of async operations to ensure immediate cancellation.
 */
export function throwIfAborted(signal?: AbortSignal): void {
    if (signal?.aborted) {
        throw signal.reason ?? new Error("ABORTED");
    }
}

/**
 * A reusable, cancellation-aware delay function.
 * Resolves after `ms` or rejects immediately if `signal` is aborted.
 */
export async function abortableDelay(ms: number, signal?: AbortSignal): Promise<void> {
    throwIfAborted(signal);

    if (!signal) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    return new Promise<void>((resolve, reject) => {
        const onAbort = () => {
            clearTimeout(timer);
            signal.removeEventListener("abort", onAbort);
            reject(signal.reason ?? new Error("ABORTED"));
        };

        const timer = setTimeout(() => {
            signal.removeEventListener("abort", onAbort);
            resolve();
        }, ms);

        signal.addEventListener("abort", onAbort, { once: true });
    });
}
