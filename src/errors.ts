import { DrizzleQueryError } from "drizzle-orm";
import { ZodError } from "zod";
import { Request, Response, NextFunction } from "express";

export class ServiceError extends Error {
    public statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFound extends ServiceError {
    constructor(message: string = "Not Found") {
        super(404, message);
    }
}

export class Duplicated extends ServiceError {
    constructor(message: string = "Duplicated") {
        super(409, message);
    }
}

export class BadRequest extends ServiceError {
    constructor(message: string = "Bad Request") {
        super(400, message);
    }
}

export class Forbidden extends ServiceError {
    constructor(message: string = "Forbidden") {
        super(403, message);
    }
}

export class Unauthorized extends ServiceError {
    constructor(message: string = "Unauthorized") {
        super(401, message);
    }
}

export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (err instanceof ServiceError) {
        return res.status(err.statusCode).json({ 
            success: false,
            code: err.statusCode,
            message: err.message 
        });
    }

    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            code: 400,
            message: "Validation failed",
            errors: err.issues
        });
    }

    next(err);
};

// Tiene que devolver never para que al hacer
// const [result] = ...catc(handleSqlError)
// infiera bien los tipos
export function handleSqlError(e: unknown): never {
    let err = e;
    if (instanceOf(e) && e.cause) {
        const cause = e.cause;

        if (/duplicate key/i.test(cause.message)) {
            if (isPgErrorWithDetail(cause)) {
                err = new Duplicated(cause.detail);
            } else {
                err = new Duplicated("object already exists");
            }
        } else if (/foreign key constraint/i.test(cause.message)) {
            if (isPgErrorWithDetail(cause)) {
                err = new NotFound(cause.detail);
            } else {
                err = new NotFound("foreign key object does not exists");
            }
        }
    }

    throw err;
}

// Safer version of instanceof that works on vitest too
function instanceOf(err: unknown): err is DrizzleQueryError {
    return typeof err === 'object' &&
        err !== null &&
        'constructor' in err &&
        'name' in err.constructor &&
        err.constructor.name === "DrizzleQueryError"
}

function isPgErrorWithDetail(err: unknown): err is Error & { detail: string } {
    return (
        typeof err === "object" &&
        err !== null &&
        "detail" in err &&
        typeof err.detail === "string"
    );
}
