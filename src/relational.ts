import { FilterMap, FindAllOptions } from "../src/types";
import { and, DBQueryConfig, isNull, TableRelationalConfig, TablesRelationalConfig } from "drizzle-orm";
import { RelationalQueryBuilder } from "drizzle-orm/pg-core/query-builders/query";
import { getPagination, buildFilters } from "./utils";
import { ZodObject } from "zod";
import { NotFound } from "./errors";

export function relationalBuilder<
    TSchema extends TablesRelationalConfig,
    TFields extends TableRelationalConfig,
    FSchema extends ZodObject,
    TTableConfig extends TableRelationalConfig = TableRelationalConfig,
>(
    q: RelationalQueryBuilder<TSchema, TFields>,
    filterMap: FilterMap<FSchema>, 
) {
    const baseWhere = (table: TFields) => isNull((table as any).deletedAt);

    return {
        findAll(config: DBQueryConfig<any, true, TSchema, TTableConfig>) {
            return async (options: FindAllOptions<any>) => {
                const { offset, limit } = getPagination(options);
                // const conditions = getConditions(options, filterMap);

                const items = q.findMany({
                    ...config,
                    where: (table) => and(
                        baseWhere(table as any),
                        buildFilters(options.filters, filterMap)
                    ),
                    limit,
                    offset
                });

                return items;
            }
        },

        findOne(config: DBQueryConfig<any, true, TSchema, TTableConfig>) {
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
                    const t = "record";
                    throw new NotFound(
                        `${t} with id ${id} not found`
                    );
                }

                return result;
            }
        }
    }
}
