import path from 'path';
import fs from 'fs';
import { PgTable } from 'drizzle-orm/pg-core';
import { generateController, generateRouter, generateService, generateValidator } from './generators';
import { BradConfig } from './config';

export const nodeTypes = [
    "validator", "controller", "service", "schema", "router"
] as const;
export type NodeType = typeof nodeTypes[number];

type Node = {
    name: string;
    type: NodeType;
    adj: Node[];
    exports: string[];
};

type GeneratorFunc = (name: string, table: PgTable, imports: string[]) => string;

// Default and base dependecies for each node type
const dependOn: Record<NodeType, NodeType[]> = {
    router: ["controller"],
    controller: ["service", "validator"],
    service: ["schema"],
    validator: ["schema"],
    schema: []
};

// Default and base exports for each node type
// All exports are ${name}${export}
const requiredExports: Record<NodeType, string[]> = {
    validator: ["InsertSchema", "UpdateSchema", "FilterSchema", "PkSchema"],
    service: ["Service"],
    controller: ["Controller"],
    schema: ["Table"],
    router: ["Router"]
};

const generators: Record<NodeType, GeneratorFunc | null> = {
    router: generateRouter,
    controller: generateController,
    validator: generateValidator,
    service: generateService,
    schema: null
}

// Build the graph dependecies for a given name
export function buildRoot(name: string, type: NodeType): Node {
    const n: Node = {
        name: name,
        type: type,
        adj: [],
        exports: requiredExports[type].map(e => `${name}${e}`)
    };

    for (const depType of dependOn[type]) {
        const adj = buildRoot(n.name, depType);
        n.adj.push(adj);
    }

    return n;
}

type Export = Record<string, any>;

export function build(cfg: BradConfig, root: Node): Export {
    let importLines = [];
    let mods: Export = {};

    for (const dep of root.adj) {
        importLines.push(buildImportLine(cfg, root, dep));

        // TODO: Refactor
        // Add db inserted dependency
        if (root.type == 'service') {
            const relativeToDb = buildRelativeImport(dir(cfg, root), cfg.dbImportPath); 
            importLines.push(`import { db } from "${relativeToDb}"`);
        }

        const mod = build(cfg, dep);
        mods = { ...mods, ...mod };
    }

    try {
        // Check the current module (node)
        const mod = checkModule(cfg, root);
        console.log("Modules: ", Object.keys(mod));
        return { ...mods, ...mod };
    } catch (err: any) {
        console.log("Module fail because: ", err.message);
        const gen = generators[root.type];
        if (!gen) {
            throw err;
        }

        console.log(`Generating ${root.name}.${root.type} ...`);

        const table = mods[`${root.name}Table`];

        const code = gen(root.name, table, importLines);
        fs.writeFileSync(pathTo(cfg, root), code);
    }

    return mods;
}

export function destroy(cfg: BradConfig, root: Node) {
    for (const dep of root.adj) {
        destroy(cfg, dep);
    }

    // We only delete the nodes with dependencies
    // we are not going to delete schemas
    if (root.adj.length > 0) {
        const path = pathTo(cfg, root);
        try {
            console.log(`Deleting ${path}...`);
            fs.rmSync(path);
        } catch {
            console.error(path, "does not exists");
        }
    }
}

function checkModule(cfg: BradConfig, root: Node): Export {
    console.log(`Checking ${root.name}.${root.type}...`);
    const path = pathTo(cfg, root);
    // if (path.endsWith('.ts')) {
    //     require('ts-node/register');
    // }

    const module = require(path) as Export;

    for (const exp of root.exports) {
        if (!module[exp]) {
            throw new Error(`[Missing export]: Cannot import ${exp} from ${path}`);
        }
    }

    return module;
}

function buildImportLine(cfg: BradConfig, from: Node, to: Node) {
    const relativePath = buildRelativeImport(dir(cfg, from), pathTo(cfg, to));

    let sep = ' ';
    let importLine: string = '';

    let imports = to.exports.join(`,${sep}`);
    importLine = `import {${sep}${imports}${sep}} from "${relativePath}"`;

    if (importLine.length > cfg.maxColumns) {
        sep = '\n\t';
        imports = to.exports.join(`,${sep}`);
        importLine = `import {${sep}${imports}${sep}} from "${relativePath}"`;
    }
    return importLine;
}

function pathTo(cfg: BradConfig, n: Node) {
    return path.resolve(cfg.cwd, dir(cfg, n), `${n.name}.${n.type}.ts`);
}

function removeExt(p: string) {
    const parsed = path.parse(p);
    return path.join(parsed.dir, parsed.name);
}

function buildRelativeImport(from: string, to: string) {
    return path.relative(from, removeExt(to));
}

const dir = (cfg: any, n: Node): string => cfg[`${n.type}Dir`];
