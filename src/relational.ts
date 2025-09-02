import { FilterMap, FindAllOptions } from "../src/types";
import { and, DBQueryConfig, TableRelationalConfig, TablesRelationalConfig } from "drizzle-orm";
import { RelationalQueryBuilder } from "drizzle-orm/pg-core/query-builders/query";
import { getPagination, getConditions } from "./utils";

export function findAllRelational<
    TSchema extends TablesRelationalConfig,
    TFields extends TableRelationalConfig,
    TTableConfig extends TableRelationalConfig = TableRelationalConfig,
>(
    map: FilterMap<any>,
    q: RelationalQueryBuilder<TSchema, TFields>,
    config: DBQueryConfig<any, true, TSchema, TTableConfig>
) {
    return async (options: FindAllOptions<any>) => {
        const { offset, limit } = getPagination(options);
        const conditions = getConditions(options, map);

        const items = q.findMany({
            ...config,
            where: (table, { isNull }) => and(
                isNull((table as any).deletedAt),
                ...conditions
            ),
            limit: limit,
            offset: offset
        });

        return items;
    }
}

export function findOneRelational<
    TSchema extends TablesRelationalConfig,
    TFields extends TableRelationalConfig,
    TTableConfig extends TableRelationalConfig = TableRelationalConfig
>(
    q: RelationalQueryBuilder<TSchema, TFields>,
    config: DBQueryConfig<any, true, TSchema, TTableConfig>
) {
    return async (id: number) => {
        const result = await q.findFirst({
            ...config,
            // TODO: Validate table contains 'id' field
            where: (table, { eq, isNull }) => and(
                isNull((table as any).deletedAt),
                eq((table as any).id, id),
            )
        });

        if (!result) {
            // TODO: proper name
            const t = "tabla";
            throw new Error(
                `${t} with id ${id} not found`
            );
        }

        return result;
    }
}

