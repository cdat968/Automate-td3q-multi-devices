/**
 * Static definition of a task parameter.
 * These are configured at the task/profile level.
 */
export interface TaskParameterDefinition {
    id: string;
    name: string;
    type: "string" | "number" | "boolean";
    description?: string;
    defaultValue?: string | number | boolean;
    required?: boolean;
}

/**
 * Immutable run-time inputs for a specific execution.
 * These are strictly read-only during the run.
 */
export type RunParameters = Record<string, string | number | boolean>;
