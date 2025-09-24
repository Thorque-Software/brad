import { Filter, FilterMap, PrimaryKeyData } from "../src/types";
import { and, BuildQueryResult, DBQueryConfig, eq, isNull, KnownKeysOnly, SQL, TableRelationalConfig, TablesRelationalConfig } from "drizzle-orm";
import { PgRelationalQuery, RelationalQueryBuilder } from "drizzle-orm/pg-core/query-builders/query";
import { buildFilters } from "./filters";
import { ZodObject } from "zod";
import { NotFound } from "./errors";
import { AnyPgTable, getTableConfig, PgColumn } from "drizzle-orm/pg-core";

export function RelationalBuilder<
    TSchema extends TablesRelationalConfig,
    TFields extends TableRelationalConfig,
    FSchema extends ZodObject,
>(
    q: RelationalQueryBuilder<TSchema, TFields>,
    filterMap: FilterMap<FSchema>, 
) {
    const baseWhere = (table: TFields) => isNull((table as any).deletedAt);

    return {
        findAll<
            TConfig extends DBQueryConfig<'many', true, TSchema, TFields>
        >(config?: TConfig) {
            return async (filters?: Filter<FSchema>, page: number = 1, pageSize: number = 10) => {
                const offset = (page - 1) * pageSize;

                const items = q.findMany({
                    ...config,
                    where: (table) => and(
                        baseWhere(table as any),
                        buildFilters(filterMap, filters)
                    ),
                    limit: pageSize,
                    offset
                });

                return items as PgRelationalQuery<BuildQueryResult<TSchema, TFields, TConfig>[]>;
            }
        },

        findOne<
            TSelection extends Omit<DBQueryConfig<'many', true, TSchema, TFields>, 'limit'>
        >(
            config?: KnownKeysOnly<TSelection, Omit<DBQueryConfig<'many', true, TSchema, TFields>, 'limit'>>
        ) {
            return async (id: number) => {
                const result = await q.findFirst({
                    ...config,
                    // TODO: Validate table contains 'id' field
                    where: (table, { eq }) => and(
                        baseWhere(table as any),
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

                return result as PgRelationalQuery<BuildQueryResult<TSchema, TFields, TSelection>>;
            }
        }
    }
}

function findByPkConditions<
    TTable extends AnyPgTable,
>
(table: TTable, data: PrimaryKeyData<TTable>) {
    const { primaryKeys } = getTableConfig(table)

    const conditions: SQL[] = [];
    for (const pk of primaryKeys) {
        for (const column of pk.columns) {
            const name = column.name as keyof PrimaryKeyData<TTable>;
            // if (data[name] === undefined || data[name] === null) {
            //     throw new Error(`Missing value for pk column: ${column.name}`);
            // }
            conditions.push(eq(table[name as keyof TTable] as PgColumn, data[name]));
        }
    }
    return conditions;
}
