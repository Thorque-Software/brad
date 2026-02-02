#!/usr/bin/env node

import path from 'path';
import { z, ZodError } from "zod";
import { Command, Argument } from "commander"
import fs from "fs";
import { PgTable } from 'drizzle-orm/pg-core';
import { generateController, generateRouter, generateService, generateValidator } from './generators';

const ConfigSchema = z.object({
    dbImportPath: z.string().default("src/db.ts"),

    validatorDir: z.string().default("src/validators"),  
    schemaDir: z.string().default("src/schemas"),  
    serviceDir: z.string().default("src/services"),
    controllerDir: z.string().default("src/controllers"),
    routerDir: z.string().default("src/routes"),

    cwd: z.string().default(process.cwd()),
    maxColumns: z.number().default(80)
});

type BradConfig = z.infer<typeof ConfigSchema>;

const nodes = [
    "validator", "controller", "service", "schema", "router"
] as const;
type Node = typeof nodes[number];

// All exports are ${name}${export}
const requiredExports: Record<Node, string[]> = {
    validator: ["InsertSchema", "UpdateSchema", "FilterSchema", "PkSchema"],
    service: ["Service"],
    controller: ["Controller"],
    schema: ["Table"],
    router: ["Router"]
};

const dir = (cfg: any, n: Node): string => cfg[`${n}Dir`];

const dependOn: Record<Node, Node[]> = {
    router: ["controller"],
    controller: ["service", "validator"],
    service: ["schema"],
    validator: ["schema"],
    schema: []
};

type GeneratorFunc = (name: string, table: PgTable, imports: string[]) => string;

const generators: Record<Node, GeneratorFunc> = {
    router: generateRouter,
    controller: generateController,
    validator: generateValidator,
    service: generateService,
    schema: (name, table, imports) => { console.error(`${name}.schema.ts is missing`); return '' },
}

function pathTo(cfg: BradConfig, name: string, type: Node) {
    return path.resolve(cfg.cwd, dir(cfg, type), `${name}.${type}.ts`);
}

function removeExt(p: string) {
    const parsed = path.parse(p);
    return path.join(parsed.dir, parsed.name);
}

function buildRelativeImport(from: string, to: string) {
    return path.relative(from, removeExt(to));
}

function error(msg: string) {
    console.error(`\x1b[41m${msg}\x1b[0m`);
    process.exit(2);
}

function isDrizzleTable(obj: unknown) {
    return obj && 
        typeof obj === 'object' && 
        obj instanceof PgTable
}

export function loadConfig(customPath?: string): BradConfig {
    const configName = "brad.config.json";

    const filePath = path.resolve(process.cwd(), configName);

    try {
        const file = fs.readFileSync(filePath, 'utf8'); 
        return ConfigSchema.parse(JSON.parse(file));
    } catch (err) {
        if (err instanceof ZodError) {
            error(err.message); 
        } else if (err instanceof SyntaxError) {
            error("File is not a valid JSON");
        }

        error('No config found. Create brad.config.json');
        process.exit(2);
    }
}

const program = new Command();
program.name("brad").description("BRAD - Generator");

program
    .command("generate")
    .argument('<name>', 'name (singular) of entity')
    .addArgument(
        new Argument('<node>', 'Node to generate')
            .choices(nodes)
    )
    .description("generate controllers")
    .action(async (name: string, node: Node, options) => {
        const cfg = loadConfig(options.dir);
        
        // Check all of required external dependencies on the project
        checkExternalDep(cfg, [
            "drizzle-zod",
            "express",
            "bradb"
        ]);

        require('ts-node/register');

        cfg.dbImportPath = path.resolve(cfg.cwd, cfg.dbImportPath);
        try {
            const dbMod = require(cfg.dbImportPath);
            if (!dbMod["db"]) {
                // TODO: check if its a valid DB
                error(`missing db export on ${cfg.dbImportPath}`)
            }
        } catch (err) {
            console.error(err);
            error(`missing db: ${cfg.dbImportPath}`);
        }

        const schemaModule = checkModule(cfg, "schema", name);
        const table = schemaModule[`${name}Table`] as PgTable;
        if (!isDrizzleTable(table)) {
            error(`export ${name}Table is not a drizzle table`);
        }

        build(cfg, node, name, table);
    });

function checkExternalDep(cfg: BradConfig, deps: string[]) {
    const pack = require(path.join(cfg.cwd, "package.json"));
    const realDeps = pack["dependencies"];

    for (const dep of deps) {
        if (!realDeps[dep]) {
            error(`make sure that ${dep} is installed`);
        }
    }
}

function getMaxLengthLine(lines: string) {
    let maxLength = 0;
    for (const line of lines.split('\n')) {
        maxLength = Math.max(maxLength, line.length);
    }
    return maxLength;
}

function build(cfg: BradConfig, root: Node, name: string, table: PgTable) {
    console.log(root);
    let importLines = [];
    for (const dep of dependOn[root]) {
        const relativePath = buildRelativeImport(dir(cfg, root), pathTo(cfg, name, dep));

        let sep = ' ';
        let importLine: string = '';

        do {
            const importsNames = requiredExports[dep].map(dep => `${name}${dep}`);
            let imports = importsNames.join(`,${sep}`);
            importLine = `import {${sep}${imports}${sep}} from "${relativePath}"`;
            sep = '\n\t';
        } while(getMaxLengthLine(importLine) > cfg.maxColumns);

        importLines.push(importLine);

        // Add db inserted dependency
        if (root == 'service') {
            const relativeToDb = buildRelativeImport(dir(cfg, root), cfg.dbImportPath); 
            importLines.push(`import { db } from "${relativeToDb}"`);
        }

        build(cfg, dep, name, table);
    }

    try {
        checkModule(cfg, root, name);
    } catch (err: any) {
        console.log("Generating", root, "...");
        const code = generators[root](name, table, importLines);

        fs.writeFileSync(pathTo(cfg, name, root), code);
    }
}

function checkModule(cfg: BradConfig, root: Node, name: string) {
    const path = pathTo(cfg, name, root);
    // if (path.endsWith('.ts')) {
    //     require('ts-node/register');
    // }

    const module = require(path);

    for (const exp of requiredExports[root]) {
        if (!module[`${name}${exp}`]) {
            throw new Error(`[Missing export]: Cannot import ${name}${exp} from ${path}`);
        }
    }

    return module;
}

program.parseAsync(process.argv);
