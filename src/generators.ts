import { getTableName } from 'drizzle-orm';
import { getTableConfig, PgColumn, PgTable } from 'drizzle-orm/pg-core';

export function generateRouter(name: string, table: PgTable, imports: string[]) {
    const pkColumns = getPKs(table);
    const pkParams = pkColumns.map(pk => `${pk.name}`).join("/:")

    return `import { Router } from "express";
${imports.join('\n')};
export const ${name}Router = Router();

// Get All
${name}Router.get("/", ${name}Controller.getAll);

// Create
${name}Router.post("/", ${name}Controller.create);

// Get one
${name}Router.get("/:${pkParams}", ${name}Controller.getOne);

// Update
${name}Router.put("/:${pkParams}", ${name}Controller.update);

// Delete
${name}Router.delete("/:${pkParams}", ${name}Controller.remove);`;
}

export function generateValidator(name: string, table: PgTable, imports: string[]) {
    const pkColumns = getPKs(table);
    const zodPkPicker = buildZodPkPicker(pkColumns);

    return `import { createInsertSchema, createSelectSchema } from "drizzle-zod";
${imports.join('\n')};

export const ${name}SelectSchema = createSelectSchema(${name}Table);
export const ${name}InsertSchema = createInsertSchema(${name}Table);
export const ${name}UpdateSchema = ${name}InsertSchema.partial();
export const ${name}FilterSchema = ${name}SelectSchema.partial();
export const ${name}PkSchema = ${name}SelectSchema.pick({
    ${zodPkPicker}
});`;
}

export function generateController(name: string, table: PgTable, imports: string[]) {
    return `import { Request, Response } from "express";
${imports.join('\n')};

async function getAll(req: Request, res: Response) {
    const filters = ${name}FilterSchema.parse(req.query);
    const items = await ${name}Service.findAll(filters);
    const total = await ${name}Service.count(filters);

    res.json({
        items,
        total
    });
}

async function getOne(req: Request, res: Response) {
    const pk = ${name}PkSchema.parse(req.params);
    const item = await ${name}Service.findOne(pk);
    res.json(item);
}

async function create(req: Request, res: Response) {
    const data = ${name}InsertSchema.parse(req.body);
    const item = await ${name}Service.create(data);
    res.status(201).json(item);
}

async function update(req: Request, res: Response) {
    const pk = ${name}PkSchema.parse(req.params);
    const data = ${name}UpdateSchema.parse(req.body);
    const item = await ${name}Service.update(pk, data);
    res.status(200).json(item);
}

async function remove(req: Request, res: Response) {
    const pk = ${name}PkSchema.parse(req.params);
    await ${name}Service.delete(pk);
    res.status(204).send();
}

export const ${name}Controller = {
    getAll,
    getOne,
    create,
    update,
    remove
};`;
}

export function generateService(name: string, table: PgTable, imports: string[]) {
    return `import { ServiceBuilder } from "bradb";
${imports.join('\n')};

const builder = new ServiceBuilder(db, ${name}Table, {});

export const ${name}Service = {
    create: builder.create(),
    update: builder.update(),
    count: builder.count(),
    delete: builder.delete(),
    findAll: builder.findAll(db.select().from(${name}Table).$dynamic()),
    findOne: builder.findOne(db.select().from(${name}Table).$dynamic())
};`
}

function buildArgs(columns: PgColumn[]) {
    let args = [];
    for (const col of columns) {
        args.push(`${col.name}: ${col.dataType}`);
    }
    return args.join(', ');
}

function getPKs(table: PgTable) {
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

function buildZodPkPicker(pks: PgColumn[]) {
    return pks.map(pk => `${pk.name}: true`).join(',\n\t')
}
