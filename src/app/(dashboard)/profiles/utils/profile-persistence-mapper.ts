import type { GameProfile } from "../types/game-profile";
import type { 
    AutomationStep, 
    StepRuntimePolicy, 
    StepConfig, 
    StepCondition, 
    AssertionConfig, 
    OutputMapping,
    AutomationTarget,
    DetectionConfig,
    StepType,
    ConditionOperator,
    AssertionKind,
    ScreenRegion,
    DomTarget,
    VisualTarget
} from "../types/automation-step";
import type { 
    PersistedGameProfile, 
    PersistedProfileAssignment, 
    PersistedProfileMetrics 
} from "../types/persisted-profile";
import type { 
    PersistedAutomationStep, 
    PersistedStepRuntimePolicy, 
    PersistedStepCondition, 
    PersistedAssertionConfig, 
    PersistedOutputMapping,
    PersistedStepConfig,
    PersistedAutomationTarget,
    PersistedDetectionConfig,
    PersistedStepType,
    PersistedScreenRegion,
    PersistedDomTarget,
    PersistedVisualTarget,
    PersistedAssertionStepConfig
} from "../types/persisted-step";

export const PERSISTENCE_SCHEMA_VERSION = "1.0.0";

const VALID_STEP_KINDS: PersistedStepType[] = [
    "navigation", "tab_management", "dom_click", "dom_type", 
    "visual_click", "visual_type", "wait_dom", "wait_visual", 
    "wait_tab", "delay", "assertion", "loop", "branch"
];

// --- Internal Mapping Helpers (To Persisted) ---

function mapToPersistedTarget(target: AutomationTarget): PersistedAutomationTarget {
    if (target.kind === "dom") {
        return { kind: "dom", selector: target.selector, useXpath: target.useXpath };
    }
    if (target.kind === "visual-template" || target.kind === "visual-feature") {
        return { kind: target.kind, assetId: target.assetId };
    }
    if (target.kind === "ocr-text") {
        return { kind: "ocr-text", text: target.text, matchMode: target.matchMode };
    }
    throw new Error(`Target kind "${target.kind}" is not supported in the persisted contract.`);
}

function mapToPersistedScreenRegion(region: ScreenRegion | null | undefined): PersistedScreenRegion | null | undefined {
    if (!region) return region;
    return { x: region.x, y: region.y, width: region.width, height: region.height };
}

function mapToPersistedDetection(detection: DetectionConfig): PersistedDetectionConfig {
    if (detection.kind === "visual-template") {
        return { 
            kind: "visual-template", 
            threshold: detection.threshold, 
            multiScale: detection.multiScale, 
            grayscale: detection.grayscale, 
            region: mapToPersistedScreenRegion(detection.region) 
        };
    }
    if (detection.kind === "visual-feature") {
        return { 
            kind: "visual-feature", 
            minMatches: detection.minMatches, 
            limitFeatures: detection.limitFeatures, 
            region: mapToPersistedScreenRegion(detection.region) 
        };
    }
    return { 
        kind: "ocr-text", 
        language: detection.language, 
        denoise: detection.denoise, 
        region: mapToPersistedScreenRegion(detection.region) 
    };
}

function mapToPersistedCondition(condition: StepCondition | null | undefined): PersistedStepCondition | null | undefined {
    if (!condition) return condition === null ? null : undefined;
    const source = condition.source;
    return {
        source: {
            kind: source.kind,
            key: "key" in source ? (source as any).key : undefined,
            targetId: "targetId" in source ? (source as any).targetId : undefined,
            name: "name" in source ? (source as any).name : undefined,
        } as PersistedStepCondition["source"],
        operator: condition.operator as PersistedStepCondition["operator"],
        value: condition.value,
    };
}

function mapToPersistedRuntime(runtime: StepRuntimePolicy): PersistedStepRuntimePolicy {
    return {
        timeoutSec: runtime.timeoutSec,
        retryCount: runtime.retryCount,
        retryDelayMs: runtime.retryDelayMs,
        failAction: runtime.failAction as PersistedStepRuntimePolicy["failAction"],
        failTarget: runtime.failTarget ? { ...runtime.failTarget } : null,
        screenshotOnFailure: runtime.screenshotOnFailure,
        continueOnSuccess: runtime.continueOnSuccess,
    };
}

function mapFromPersistedRuntime(persisted: PersistedStepRuntimePolicy): StepRuntimePolicy {
    return {
        timeoutSec: persisted.timeoutSec,
        retryCount: persisted.retryCount,
        retryDelayMs: persisted.retryDelayMs,
        failAction: persisted.failAction as any, // FailAction union is large and matches
        failTarget: persisted.failTarget ? { ...persisted.failTarget } : null,
        screenshotOnFailure: persisted.screenshotOnFailure,
        continueOnSuccess: persisted.continueOnSuccess,
    };
}

function mapToPersistedConfig(config: StepConfig): PersistedStepConfig {
    switch (config.kind) {
        case "navigation":
            return { kind: "navigation", url: config.url };
        case "tab_management":
            return { kind: "tab_management", mode: config.mode, index: config.index, title: config.title, url: config.url };
        case "dom_click":
            return { kind: "dom_click", target: mapToPersistedTarget(config.target) as PersistedDomTarget };
        case "dom_type":
            return { kind: "dom_type", target: mapToPersistedTarget(config.target) as PersistedDomTarget, value: config.value };
        case "visual_click":
            return { kind: "visual_click", target: mapToPersistedTarget(config.target) as PersistedVisualTarget, detection: mapToPersistedDetection(config.detection) };
        case "visual_type":
            return { kind: "visual_type", target: mapToPersistedTarget(config.target) as PersistedVisualTarget, detection: mapToPersistedDetection(config.detection), value: config.value };
        case "wait_dom":
            return { kind: "wait_dom", target: mapToPersistedTarget(config.target) as PersistedDomTarget, state: config.state };
        case "wait_visual":
            return { kind: "wait_visual", target: mapToPersistedTarget(config.target) as PersistedVisualTarget, detection: mapToPersistedDetection(config.detection), state: config.state };
        case "wait_tab":
            return { kind: "wait_tab", mode: config.mode, pattern: config.pattern };
        case "delay":
            return { kind: "delay", durationMs: config.durationMs };
        case "assertion":
            return { 
                kind: "assertion", 
                type: config.type, 
                target: config.target ? mapToPersistedTarget(config.target) : undefined, 
                detection: config.detection ? mapToPersistedDetection(config.detection) : undefined, 
                expectedValue: config.expectedValue, 
                assertionKind: config.assertionKind as PersistedAssertionStepConfig["assertionKind"]
            };
        case "loop":
            return { 
                kind: "loop", 
                mode: config.mode, 
                count: config.count, 
                untilCondition: mapToPersistedCondition(config.untilCondition), 
                delayBetweenIterationsMs: config.delayBetweenIterationsMs,
                bodyStepIds: config.bodyStepIds ? [...config.bodyStepIds] : []
            };
        case "branch":
            return { 
                kind: "branch", 
                ifCondition: mapToPersistedCondition(config.ifCondition)!, 
                onTrue: { ...config.onTrue }, 
                onFalse: { ...config.onFalse } 
            };
    }
}

// --- Internal Mapping Helpers (From Persisted) ---

function mapFromPersistedTarget(persisted: PersistedAutomationTarget): AutomationTarget {
    if (persisted.kind === "dom") {
        return { kind: "dom", selector: persisted.selector, useXpath: persisted.useXpath };
    }
    if (persisted.kind === "visual-template" || persisted.kind === "visual-feature") {
        return { kind: persisted.kind, assetId: persisted.assetId };
    }
    return { kind: "ocr-text", text: persisted.text, matchMode: persisted.matchMode };
}

function mapFromPersistedScreenRegion(region: PersistedScreenRegion | null | undefined): ScreenRegion | null | undefined {
    if (!region) return region;
    return { x: region.x, y: region.y, width: region.width, height: region.height };
}

function mapFromPersistedDetection(persisted: PersistedDetectionConfig): DetectionConfig {
    if (persisted.kind === "visual-template") {
        return { ...persisted, region: mapFromPersistedScreenRegion(persisted.region) };
    }
    if (persisted.kind === "visual-feature") {
        return { ...persisted, region: mapFromPersistedScreenRegion(persisted.region) };
    }
    return { ...persisted, region: mapFromPersistedScreenRegion(persisted.region) };
}

function mapFromPersistedStepCondition(persisted: PersistedStepCondition | null | undefined): StepCondition | null | undefined {
    if (!persisted) return persisted === null ? null : undefined;
    const source = persisted.source;
    return {
        source: {
            kind: source.kind,
            ...(source.key ? { key: source.key } : {}),
            ...(source.targetId ? { targetId: source.targetId } : {}),
            ...(source.name ? { name: source.name } : {}),
        } as StepCondition["source"],
        operator: persisted.operator as ConditionOperator,
        value: persisted.value,
    };
}

function mapFromPersistedConfig(persisted: PersistedStepConfig): StepConfig {
    switch (persisted.kind) {
        case "navigation":
            return { kind: "navigation", url: persisted.url };
        case "tab_management":
            return { 
                kind: "tab_management", 
                mode: persisted.mode, 
                index: persisted.index, 
                title: persisted.title, 
                url: persisted.url 
            };
        case "dom_click":
            return { kind: "dom_click", target: mapFromPersistedTarget(persisted.target) as DomTarget };
        case "dom_type":
            return { kind: "dom_type", target: mapFromPersistedTarget(persisted.target) as DomTarget, value: persisted.value };
        case "visual_click":
            return { 
                kind: "visual_click", 
                target: mapFromPersistedTarget(persisted.target) as VisualTarget, 
                detection: mapFromPersistedDetection(persisted.detection) 
            };
        case "visual_type":
            return { 
                kind: "visual_type", 
                target: mapFromPersistedTarget(persisted.target) as VisualTarget, 
                detection: mapFromPersistedDetection(persisted.detection), 
                value: persisted.value 
            };
        case "wait_dom":
            return { kind: "wait_dom", target: mapFromPersistedTarget(persisted.target) as DomTarget, state: persisted.state };
        case "wait_visual":
            return { 
                kind: "wait_visual", 
                target: mapFromPersistedTarget(persisted.target) as VisualTarget, 
                detection: mapFromPersistedDetection(persisted.detection), 
                state: persisted.state 
            };
        case "wait_tab":
            return { kind: "wait_tab", mode: persisted.mode, pattern: persisted.pattern };
        case "delay":
            return { kind: "delay", durationMs: persisted.durationMs };
        case "assertion":
            return { 
                kind: "assertion", 
                type: persisted.type, 
                target: persisted.target ? mapFromPersistedTarget(persisted.target) : undefined, 
                detection: persisted.detection ? mapFromPersistedDetection(persisted.detection) : undefined, 
                expectedValue: persisted.expectedValue, 
                assertionKind: persisted.assertionKind as AssertionKind 
            };
        case "loop":
            return { 
                kind: "loop", 
                mode: persisted.mode, 
                count: persisted.count, 
                untilCondition: mapFromPersistedStepCondition(persisted.untilCondition), 
                delayBetweenIterationsMs: persisted.delayBetweenIterationsMs,
                bodyStepIds: persisted.bodyStepIds ? [...persisted.bodyStepIds] : []
            };
        case "branch":
            return { 
                kind: "branch", 
                ifCondition: mapFromPersistedStepCondition(persisted.ifCondition)!, 
                onTrue: { ...persisted.onTrue }, 
                onFalse: { ...persisted.onFalse } 
            };
    }
}

// --- Public Mapper Exports ---

export function mapToPersistedStep(step: AutomationStep): PersistedAutomationStep {
    return {
        id: step.id,
        order: step.order,
        name: step.name,
        type: step.type as PersistedStepType,
        status: step.status,
        description: step.description,
        label: step.label,
        condition: mapToPersistedCondition(step.condition),
        runtime: mapToPersistedRuntime(step.runtime),
        config: mapToPersistedConfig(step.config),
        assertions: (step.assertions || []).map((a: AssertionConfig) => ({
            id: a.id,
            kind: a.kind as PersistedAssertionConfig["kind"],
            target: a.target ? mapToPersistedTarget(a.target) : undefined,
            detection: a.detection ? mapToPersistedDetection(a.detection) : undefined,
            expectedValue: a.expectedValue,
            failAction: a.failAction,
        })),
        outputMappings: (step.outputMappings || []).map((om: OutputMapping) => ({ ...om })),
    };
}

export function mapFromPersistedStep(persisted: PersistedAutomationStep): AutomationStep {
    return {
        id: persisted.id,
        order: persisted.order,
        name: persisted.name,
        type: persisted.config.kind as StepType,
        status: persisted.status,
        description: persisted.description,
        label: persisted.label,
        condition: mapFromPersistedStepCondition(persisted.condition),
        runtime: mapFromPersistedRuntime(persisted.runtime),
        config: mapFromPersistedConfig(persisted.config),
        assertions: (persisted.assertions || []).map((a: PersistedAssertionConfig) => ({
            id: a.id,
            kind: a.kind as AssertionKind,
            target: a.target ? mapFromPersistedTarget(a.target) : undefined,
            detection: a.detection ? mapFromPersistedDetection(a.detection) : undefined,
            expectedValue: a.expectedValue,
            failAction: a.failAction,
        })),
        outputMappings: (persisted.outputMappings || []).map((om: PersistedOutputMapping) => ({ ...om })),
    };
}

export function serializeProfile(profile: GameProfile): PersistedGameProfile {
    return {
        schemaVersion: PERSISTENCE_SCHEMA_VERSION,
        id: profile.id,
        name: profile.name,
        game: profile.game,
        description: profile.description,
        tags: profile.tags || [],
        icon: profile.icon,
        status: profile.status,
        version: profile.version,
        ownerId: profile.ownerId,
        workspaceId: profile.workspaceId,
        steps: (profile.steps || []).map(mapToPersistedStep),
        assignment: {
            ...profile.assignment,
            deviceIds: profile.assignment.deviceIds || []
        },
        metrics: profile.metrics ? { ...profile.metrics } : undefined,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
    };
}

export function hydrateProfile(persisted: PersistedGameProfile): GameProfile {
    return {
        id: persisted.id,
        name: persisted.name,
        game: persisted.game,
        description: persisted.description,
        tags: persisted.tags || [],
        icon: persisted.icon,
        status: persisted.status,
        version: persisted.version,
        ownerId: persisted.ownerId,
        workspaceId: persisted.workspaceId,
        steps: (persisted.steps || []).map(mapFromPersistedStep),
        assignment: {
            ...persisted.assignment,
            deviceIds: persisted.assignment.deviceIds || []
        },
        metrics: persisted.metrics ? { ...persisted.metrics } : undefined,
        createdAt: persisted.createdAt,
        updatedAt: persisted.updatedAt,
    };
}

export function isValidPersistedProfile(obj: any): obj is PersistedGameProfile {
    if (!obj || typeof obj !== "object") return false;
    
    // 1. Profile Level Identity
    const hasBaseIdentity = (
        typeof obj.schemaVersion === "string" &&
        typeof obj.id === "string" &&
        typeof obj.name === "string" &&
        typeof obj.game === "string"
    );
    if (!hasBaseIdentity) return false;

    // 2. Assignment Guard
    if (obj.assignment && !Array.isArray(obj.assignment.deviceIds)) return false;

    // 3. Step Sequence Guard
    if (!Array.isArray(obj.steps)) return false;

    // 4. Per-Step Structural Guard (Strict Kind/Type check)
    for (const step of obj.steps) {
        if (!step || typeof step !== "object") return false;
        if (typeof step.id !== "string" || typeof step.name !== "string") return false;
        
        // Ensure both type and config.kind exist and belong to the allowed set
        if (!VALID_STEP_KINDS.includes(step.type)) return false;
        if (!step.config || !VALID_STEP_KINDS.includes(step.config.kind)) return false;
        
        // Final structural invariant: step.type MUST match step.config.kind
        if (step.type !== step.config.kind) return false;
    }

    return true;
}
