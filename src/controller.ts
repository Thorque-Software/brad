import { Request, Response } from "express";
import { z, ZodObject } from "zod";
import { Filter } from "./types";

export const paginationSchema = z.object({
    page: z.coerce.number().default(1),
    pageSize: z.coerce.number().default(10)
});

export type Pagination = {
    page: number;
    pageSize: number;
    total?: number;
    count?: number;
};

export function newPagination(data: unknown) {
    const p = paginationSchema.parse(data);
    return p as Pagination;
}

export function findOneBuilder<PK extends ZodObject, Item>(
    findOne: (pk: z.output<PK>) => Promise<Item>,
    pkSchema: PK,
    hook?: (item: Item) => Promise<object>
) {
    return async (req: Request, res: Response) => {
        const pk = pkSchema.parse(req.params); 
        const item = await findOne(pk);
        if (hook !== undefined) {
            const i = await hook(item);
            return res.status(200).json(i);
        }
        res.status(200).json(item);
    }
}

export function findAllBuilder<FSchema extends ZodObject, Item>(
    findAll: (filters?: Filter<FSchema>, p?: Pagination) => Promise<Item[]>,
    filter: FSchema,
    hook?: (items: Item[], total: number) => Promise<object[]>,
) {
    return async (req: Request, res: Response) => {
        const filters = filter.parse({
            ...req.params,
            ...req.query
        });

        const pagination = newPagination(req.query);
        const items = await findAll(filters, pagination);

        let resItems: object[] = items as object[];
        if (hook != undefined) {
            if (!pagination.total) {
                resItems = await hook(items, items.length);
            } else {
                resItems = await hook(items, pagination.total);
            }
        }

        return res.status(200).json({
            pagination,
            items: resItems,
            total: pagination.total
        });
    }
}

export function createBuilder<CSchema extends ZodObject, Item>(
    create: (data: z.core.output<CSchema>) => Promise<Item>,
    schema: CSchema,
    hook?: (req: Request, res: Response, data: z.core.output<CSchema>, item: Item) => Promise<object>
) {
    return validate(schema, async (req, res, data) => {
        const item = await create(data);
        if (hook) {
            const i = await hook(req, res, data, item);
            return res.status(201).json(i);
        }
        return res.status(201).json(item);
    });
}

export function updateBuilder<
    PKSchema extends ZodObject, 
    USchema extends ZodObject, 
    Item
>(
    update: (pks: z.core.output<PKSchema>, data: z.core.output<USchema>) => Promise<Item>,
    pkSchema: PKSchema,
    schema: USchema
) {
    return validate(schema, async (req, res, data) => {
        const pk = pkSchema.parse(req.params); 
        const item = await update(pk, data);
        return res.status(200).json(item);
    });
}

export function deleteBuilder<
    PKSchema extends ZodObject
>(
    remove: (id: z.core.output<PKSchema>) => Promise<void>,
    pkSchema: PKSchema,
) {
    return async (req: Request, res: Response) => {
        const pk = pkSchema.parse(req.params); 
        await remove(pk);
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
