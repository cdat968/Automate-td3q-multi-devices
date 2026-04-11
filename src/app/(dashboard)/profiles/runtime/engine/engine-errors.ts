export class EngineAbortedError extends Error {
    constructor(message = "Execution aborted") {
        super(message);
        this.name = "EngineAbortedError";
    }
}

export class EngineIterationLimitError extends Error {
    constructor(message = "Execution iteration limit reached") {
        super(message);
        this.name = "EngineIterationLimitError";
    }
}

export class EngineIdleLimitError extends Error {
    constructor(message = "Execution idle limit reached") {
        super(message);
        this.name = "EngineIdleLimitError";
    }
}
