import { PgTable } from "drizzle-orm/pg-core";
import { Request, Response } from "express";
import { z, ZodObject } from "zod";
import { PaginationParams, Filter } from "./types";
import { InferInsertModel } from "drizzle-orm";

export function findOneBuilder<TReturn>(
    service: {
        findOne: (id: any) => Promise<TReturn>
    },
    hook?: (item: TReturn) => Promise<object>
) {
    return async (req: Request, res: Response) => {
        const item = await service.findOne(req.params.id);
        if (hook !== undefined) {
            const i = await hook(item);
            return res.status(200).json(i);
        }
        res.status(200).json(item);
    }
}

export function findAllBuilder<FSchema extends ZodObject, TReturn>(
    service: {
        findAll: (filters?: Filter<FSchema>, page?: number, pageSize?: number) => Promise<TReturn[]>;
        count: (filters?: Filter<FSchema>) => Promise<number>
    },
    filter: FSchema,
    hook?: (items: TReturn[], total: number) => Promise<object[]>,
    hasPagination: boolean = true
) {
    return async (req: Request, res: Response) => {
        const filters = filter.parse({
            ...req.params,
            ...req.query
        });

        let pagination, itemsProm;
        if (hasPagination) {
            pagination = getPagination(req);
            itemsProm = service.findAll(filters, pagination.page, pagination.pageSize);
        } else {
            itemsProm = service.findAll(filters);
        }
        const totalProm = service.count(filters)

        const [items, total] = await Promise.all([itemsProm, totalProm]);

        let resItems: object[] = items as object[];

        if (hook != undefined) {
            resItems = await hook(items, total);
        }

        if (hasPagination) {
            return res.status(200).json({
                pagination,
                items: resItems,
                total
            });
        } else {
            return res.status(200).json({
                items: resItems,
                total
            });
        }
    }
}

export function createBuilder<CSchema extends ZodObject, TReturn>(
    service: {
        create: (data: z.core.output<CSchema>) => Promise<TReturn> 
    },
    schema: CSchema,
    hook?: (req: Request, res: Response, data: z.core.output<CSchema>, item: TReturn) => Promise<object>
) {
    return validate(schema, async (req, res, data) => {
        const item = await service.create(data);
        if (hook) {
            const i = await hook(req, res, data, item);
            return res.status(201).json(i);
        }
        return res.status(201).json(item);
    });
}

export function updateBuilder<USchema extends ZodObject, TReturn>(
    service: {
        update: (id: any, data: z.core.output<USchema>) => Promise<TReturn> 
    },
    schema: USchema
) {
    return validate(schema, async (req, res, data) => {
        const item = await service.update(req.params.id, data);
        return res.status(200).json(item);
    });
}

export function deleteBuilder(
    service: {
        delete: (id: any) => Promise<void> 
    },
) {
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

// -- OLD VERSION -- 
interface CRUDService<FSchema extends ZodObject> {
    findOne: (id: any) => Promise<any>; 
    findAll: (filters?: Filter<FSchema>, page?: number, pageSize?: number) => Promise<any[]>;
    count:  (filters: Filter<FSchema>) => Promise<number>;
    create: (data: any) => Promise<any>;
    update: (id: any, data: Partial<any>) => Promise<any>;
    delete: (id: any) => Promise<any>;
}

export class BaseController<
    T extends PgTable,
    FSchema extends z.ZodObject
> {
    protected service: CRUDService<FSchema>;

    private filterSchema: FSchema;
    private createSchema: z.ZodSchema<InferInsertModel<T>>;
    private updateSchema: z.ZodSchema<Partial<InferInsertModel<T>>>;

    constructor(
        service: CRUDService<FSchema>,
        base: z.ZodObject,
        filter: FSchema,
        createSchema?: z.ZodSchema<InferInsertModel<T>>,
        updateSchema?: Partial<InferInsertModel<T>>
    ) {
        this.service = service;
        // @ts-expect-error infer schema
        this.createSchema = createSchema || base.omit({
            id: true,
            deletedAt: true
        }) as z.ZodSchema<InferInsertModel<T>>;

        // @ts-expect-error infer schema
        this.updateSchema = updateSchema || base.partial() as z.ZodSchema<
            Partial<InferInsertModel<T>>
        >;
        this.filterSchema = filter;
    }

    getAll = async (req: Request, res: Response) => {
        const filters = getFilters(req, this.filterSchema);
        const pagination = getPagination(req);
        const [items, total] = await Promise.all([
            this.service.findAll(filters, pagination.page, pagination.pageSize),
            this.service.count(filters)
        ]);

        res.status(200).json({
            pagination,
            items,
            total
        });
    };

    getById = async (req: Request, res: Response) => {
        const item = await this.service.findOne(req.params.id);
        res.status(200).json(item);
    };

    create = async (req: Request, res: Response) => {
        const data = this.createSchema.parse(req.body);
        const item = await this.service.create(data);
        res.status(201).json(item);
    };

    update = async (req: Request, res: Response) => {
        const data = this.updateSchema.parse(req.body);
        const item = await this.service.update(req.params.id, data);
        res.status(200).json(item);
    };

    delete = async (req: Request, res: Response) => {
        await this.service.delete(req.params.id);
        res.status(204).send();
    };
}

/*
    * Extract the filters from the Request
*/
function getFilters<FSchema extends z.ZodObject>(
    req: Request,
    filter: FSchema
) {
    return filter.parse({
        ...req.params,
        ...req.query
    });
}
