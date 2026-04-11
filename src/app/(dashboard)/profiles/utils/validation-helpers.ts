import type { ValidationIssue } from "./step-validation";

export type GroupedIssues = Record<
    string,
    { errors: ValidationIssue[]; warnings: ValidationIssue[] }
>;

/**
 * Groups validation issues by stepId.
 * Standardizes to "global" for issues without a stepId (e.g., flow-level issues).
 * NOTE: "global" is only a UI grouping bucket, not a real stepId.
 */
export function groupIssuesByStep(issues: ValidationIssue[]): GroupedIssues {
    const groups: GroupedIssues = {};
    issues.forEach((issue) => {
        const key = issue.stepId || "global";
        if (!groups[key]) {
            groups[key] = { errors: [], warnings: [] };
        }
        if (issue.severity === "error") {
            groups[key].errors.push(issue);
        } else {
            groups[key].warnings.push(issue);
        }
    });
    return groups;
}

/**
 * Returns the first error message for a specific field path if it exists.
 * Supports a fallback array of paths.
 */
export function getFieldError(
    issues: ValidationIssue[],
    path: string | string[],
): string | undefined {
    const paths = Array.isArray(path) ? path : [path];
    return issues.find((i) => paths.includes(i.path) && i.severity === "error")
        ?.message;
}

/**
 * Returns the first warning message for a specific field path if it exists.
 * Supports a fallback array of paths.
 */
export function getFieldWarning(
    issues: ValidationIssue[],
    path: string | string[],
): string | undefined {
    const paths = Array.isArray(path) ? path : [path];
    return issues.find((i) => paths.includes(i.path) && i.severity === "warning")
        ?.message;
}

/**
 * Checks if a specific step (or global bucket) has any errors.
 */
export function hasStepError(
    groupedIssues: GroupedIssues,
    stepId: string,
): boolean {
    return (groupedIssues[stepId]?.errors.length ?? 0) > 0;
}

/**
 * Checks if a specific step (or global bucket) has any warnings.
 */
export function hasStepWarning(
    groupedIssues: GroupedIssues,
    stepId: string,
): boolean {
    return (groupedIssues[stepId]?.warnings.length ?? 0) > 0;
}
