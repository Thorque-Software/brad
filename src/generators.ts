import { getTableConfig, PgColumn, PgTable } from "drizzle-orm/pg-core";
import { getPKs } from "./pg";

export function generateRouter(name: string, table: PgTable, imports: string[]) {
    const pkColumns = getPKs(table);
    const route = pkColumns.map(pk => 
       `${getRelationName(pk.name)}/:${pk.name}`
    ).join("/")

    return `import { Router } from "express";
${imports.join('\n')};
export const ${name}Router = Router();

// Get All
${name}Router.get("/", ${name}Controller.getAll);

// Create
${name}Router.post("/", ${name}Controller.create);

// Get one
${name}Router.get("${route}", ${name}Controller.getOne);

// Update
${name}Router.put("${route}", ${name}Controller.update);

// Delete
${name}Router.delete("${route}", ${name}Controller.remove);`;
}

export function generateValidator(name: string, table: PgTable, imports: string[]) {
    const pkColumns = getPKs(table);
    const zodPkPicker = buildZodPkPicker(pkColumns);

    return `import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { createFilterSchema } from "bradb";
import { z } from "zod";
${imports.join('\n')};

const select = createSelectSchema(${name}Table);
const insert = createInsertSchema(${name}Table);
const update = insert.partial();
const filter = createFilterSchema(eventTable).partial();
const pk = select.pick({
    ${zodPkPicker}
});

type ${capitalize(name)} = z.infer<typeof select>;
type ${capitalize(name)}Insert = z.infer<typeof insert>;
type ${capitalize(name)}Update = z.infer<typeof update>;
type ${capitalize(name)}Filter = z.infer<typeof filter>;
type ${capitalize(name)}Pk = z.infer<typeof pk>;

export const ${name}Validator = {
    select,
    insert,
    update,
    filter,
    pk
};`;
}

export function generateController(name: string, table: PgTable, imports: string[]) {
    return `import { Request, Response } from "express";
${imports.join('\n')};

async function getAll(req: Request, res: Response) {
    const filters = ${name}Validator.filter.parse(req.query);
    const items = await ${name}Service.findAll(filters);
    const total = await ${name}Service.count(filters);

    res.json({
        items,
        total
    });
}

async function getOne(req: Request, res: Response) {
    const pk = ${name}Validator.pk.parse(req.params);
    const item = await ${name}Service.findOne(pk);
    res.json(item);
}

async function create(req: Request, res: Response) {
    const data = ${name}Validator.insert.parse(req.body);
    const item = await ${name}Service.create(data);
    res.status(201).json(item);
}

async function update(req: Request, res: Response) {
    const pk = ${name}Validator.pk.parse(req.params);
    const data = ${name}Validator.update.parse(req.body);
    const item = await ${name}Service.update(pk, data);
    res.status(200).json(item);
}

async function remove(req: Request, res: Response) {
    const pk = ${name}Validator.pk.parse(req.params);
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

const builder = new ServiceBuilder(db, ${name}Table, ${name}FilterMap);

const selection = db
    .select()
    .from(${name}Table)
    .$dynamic();

export const ${name}Service = {
    create: builder.create(),
    update: builder.update(),
    count: builder.count(),
    delete: builder.delete(),
    findAll: builder.findAll(selection),
    findOne: builder.findOne(selection)
};`
}

export function generateFilter(name: string, table: PgTable, imports: string[]) {
    const { columns } = getTableConfig(table);

    const filters = columns.map(c => `${c.name}: (val) => eq(${name}Table.${c.name}, val)`).join(',\n\t')

    return `import { FilterMap } from "bradb";
import { eq } from "drizzle-orm";
${imports.join('\n')};

export const ${name}FilterMap: FilterMap<typeof ${name}Validator.filter> = {
    ${filters}
}`
}

export function getRelationName(fkName: string) {
    const parts = fkName.split('id');
    if (parts.length < 2) {
        throw new Error("fkName must have name like 'id{Entity}'");
    }
    return parts[1].toLowerCase();
}

function buildArgs(columns: PgColumn[]) {
    let args = [];
    for (const col of columns) {
        args.push(`${col.name}: ${col.dataType}`);
    }
    return args.join(', ');
}

function buildZodPkPicker(pks: PgColumn[]) {
    return pks.map(pk => `${pk.name}: true`).join(',\n\t')
}

function capitalize(s: string) {
    if (typeof s !== 'string' || !s || s.length == 0) {
        return '';
    }

    return s[0].toUpperCase() + s.slice(1);
}
