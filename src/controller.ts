import { PgTable } from "drizzle-orm/pg-core";
import { Request, Response } from "express";
import { z, ZodObject } from "zod";
import { CreateService, DeleteService, UpdateService, FindOneService, PaginationParams, RetrieverService } from "./types";

export function findOneBuilder<TTable extends PgTable>(
    service: FindOneService<TTable>,
    hook?: (item: TTable["$inferSelect"]) => Response
) {
    async (req: Request, res: Response) => {
        const item = await service.findOne(req.params.id);
        if (hook !== undefined) {
            return hook(item);
        } else {
            res.status(200).json(item);
        }
    }
}

export function findAllBuilder<FSchema extends ZodObject, TTable extends PgTable>(
    service: RetrieverService<FSchema, TTable>, 
    filter: FSchema,
    hook?: (items: TTable["$inferSelect"][], total: number) => Response
) {
    return async (req: Request, res: Response) => {
        const filters = filter.parse({
            ...req.params,
            ...req.query
        });
        const pagination = getPagination(req);
        const [items, total] = await Promise.all([
            service.findAll(filters, pagination.page, pagination.pageSize),
            service.count(filters)
        ]);

        if (hook !== undefined) {
            return hook(items, total);
        } else {
            return res.status(200).json({
                pagination,
                items,
                total
            });
        }
    }
}

export function createBuilder<TTable extends PgTable, Schema extends ZodObject>(
    service: CreateService<TTable>,
    schema: Schema
) {
    return validate(schema, async (req, res, data) => {
        const item = await service.create(data);
        return res.status(201).json(item);
    });
}

export function updateBuilder<TTable extends PgTable, Schema extends ZodObject>(
    service: UpdateService<TTable>,
    schema: Schema
) {
    return validate(schema, async (req, res, data) => {
        const item = await service.update(req.params.id, data);
        return res.status(200).json(item);
    });
}

export function deleteBuilder<TTable extends PgTable>(service: DeleteService<TTable>) {
    return async (req: Request, res: Response) => {
        await service.delete(req.params.id);
        return res.status(204).send();
    }
}

export function validate<T extends ZodObject>(
    schema: T,
    fn: (req: Request, res: Response, data: z.output<T>) => Promise<Response>
) {
    return async (req: Request, res: Response) => {
        const validated = schema.parse(req.body);
        return fn(req, res, validated);
    }
}

function getPagination(req: Request) {
    return {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        pageSize: req.query.pageSize
            ? parseInt(req.query.pageSize as string)
            : 10
    } as PaginationParams;
}
