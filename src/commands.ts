#!/usr/bin/env node

import path from 'path';
import { Command, Argument } from "commander"
import { PgTable } from 'drizzle-orm/pg-core';
import { build, destroy, buildRoot, nodeTypes, NodeType } from './builder';
import { loadConfig } from './config';

function isDrizzleTable(obj: unknown) {
    console.log("obj", typeof obj === 'object', obj instanceof PgTable);
    return obj && 
        typeof obj === 'object' && 
        obj instanceof PgTable
}

const program = new Command();
program.name("brad").description("BRAD - Generator");

program
    .command("generate")
    .argument('<name>', 'name (singular) of entity')
    .addArgument(
        new Argument('<node-type>', 'Type of node to generate')
            .choices(nodeTypes)
            .default("router")
    )
    .description("generate entity recursively")
    .action(async (name: string, type: NodeType) => {
        const cfg = loadConfig();
        
        // Check all of required external dependencies on the project
        // checkExternalDep(cfg, [
        //     "bradb"
        // ]);

        require('ts-node/register');

        // cfg.dbImportPath = path.resolve(cfg.cwd, cfg.dbImportPath);
        // try {
        //     const dbMod = require(cfg.dbImportPath);
        //     if (!dbMod["db"]) {
        //         // TODO: check if its a valid DB
        //         error(`missing db export on ${cfg.dbImportPath}`)
        //     }
        // } catch (err) {
        //     console.error(err);
        //     error(`missing db: ${cfg.dbImportPath}`);
        // }

        // const schemaModule = checkModule(cfg, "schema", name);
        // const table = schemaModule[`${name}Table`] as PgTable;
        // if (!isDrizzleTable(table)) {
        //     error(`export ${name}Table is not a drizzle table`);
        // }
        //

        const root = buildRoot(name, type);
        // Aca tendríamos que ir desde (name, type) hasta la raiz (name, "router")
        // y desde ahi, ver si tenemos dependencias de otra entidad
        root.adj.push(buildRoot("event", "router"));
        root.adj.push(buildRoot("student", "router"));
        console.log(JSON.stringify(root, null, 4));
        build(cfg, root);
    });

program
    .command("destroy")
    .argument("<name>", "name of entity")
    .addArgument(
        new Argument('<node-type>', 'Type of Node to generate')
            .choices(nodeTypes)
            .default("router")
    )
    .description("destroy entity recursively")
    .action(async (name: string, type: NodeType) => {
        const cfg = loadConfig();

        const root = buildRoot(name, type);
        root.adj.push(buildRoot("event", "router"));
        root.adj.push(buildRoot("student", "router"));
        destroy(cfg, root);
    })
//
//
// function checkExternalDep(cfg: BradConfig, deps: string[]) {
//     const pack = require(path.join(cfg.cwd, "package.json"));
//     const realDeps = pack["dependencies"];
//
//     for (const dep of deps) {
//         if (!realDeps[dep]) {
//             error(`make sure that ${dep} is installed`);
//         }
//     }
// }


program.parseAsync(process.argv);
