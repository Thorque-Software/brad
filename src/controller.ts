import {
    InferInsertModel,
} from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { Request, Response } from "express";
import { z } from "zod";
import { CRUDService, PaginationParams } from "./types";

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
        filter: FSchema    
    ) {
        this.service = service;

        // @ts-expect-error infer schema
        this.createSchema = base.omit({
            id: true,
            deletedAt: true
        }) as z.ZodSchema<InferInsertModel<T>>;

        // @ts-expect-error infer schema
        this.updateSchema = base.partial() as z.ZodSchema<
            Partial<InferInsertModel<T>>
        >;
        this.filterSchema = filter;
    }

    getAll = async (req: Request, res: Response) => {
        const filters = getFilters(req, this.filterSchema);
        const pagination = getPagination(req);
        const [items, total] = await Promise.all([
            this.service.findAll({ pagination, filters }),
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

/*
    * Extract PaginationParams from the request
*/
function getPagination(req: Request) {
    return {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        pageSize: req.query.pageSize
            ? parseInt(req.query.pageSize as string)
            : 10
    } as PaginationParams;
}

