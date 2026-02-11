import { getTableConfig, PgTable } from 'drizzle-orm/pg-core';

export function getFkNames(table: PgTable) {
    const { foreignKeys } = getTableConfig(table);
    return foreignKeys.map(fk => fk);
}

export function getPKs(table: PgTable) {
    const { columns, primaryKeys } = getTableConfig(table);

    if(primaryKeys.length > 0) {
        // TODO: for now we pick the first pk
        return primaryKeys[0].columns;
    }

    let pks = [];
    for (const col of columns) {
        if (col.primary) {
            pks.push(col);
        }
    }

    if (pks.length <= 0) {
        throw new Error("Service builder needs at least one primary key field");
    }

    return pks;
}
