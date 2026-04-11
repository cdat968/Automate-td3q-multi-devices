import { AutomationStep } from "../types/automation-step";
import { validateStep } from "../utils/step-validation";

/**
 * Runtime-specific validation adapter (Block B5).
 * Reuses core validation logic but specifically filters for fatal execution-blocking errors.
 */
export function validateStepForRuntime(step: AutomationStep): { valid: boolean; message?: string; code?: string } {
    const result = validateStep(step);
    
    // Runtime execution only blocks on "error" severity issues.
    // "warning" severity issues are logged or ignored in the runtime layer.
    const fatalIssue = result.issues.find(issue => issue.severity === "error");
    
    if (fatalIssue) {
        return {
            valid: false,
            message: fatalIssue.message,
            code: fatalIssue.code
        };
    }

    return { valid: true };
}
