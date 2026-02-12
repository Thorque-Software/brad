import path from 'path';
import fs from 'fs';
import { PgTable } from 'drizzle-orm/pg-core';
import { generateController, generateFilter, generateRouter, generateService, generateValidator } from './generators';
import { BradConfig } from './config';

export const nodeTypes = [
    "validator", "controller", "service", "schema", "router", "filter", "db"
] as const;
export type NodeType = typeof nodeTypes[number];

// Each node represents a file
type Node = {
    name: string;
    type: NodeType;

    path: string;
    adj: Node[];
    exports: string[];
};

type GeneratorFunc = (name: string, table: PgTable, imports: string[]) => string;

// Default and base dependecies for each node type
const dependOn: Record<NodeType, NodeType[]> = {
    router: ["controller"],
    controller: ["service", "validator"],
    service: ["schema", "filter", "db"],
    validator: ["schema"],
    filter: ["schema", "validator"],
    schema: [],
    db: []
};

// Default and base exports for each node type
const requiredExports: Record<NodeType, (name: string) => string[]> = {
    validator: (name) => [`${name}Validator`],
    service: (name) => [`${name}Service`],
    controller: (name) => [`${name}Controller`],
    schema: (name) => [`${name}Table`],
    router: (name) => [`${name}Router`],
    filter: (name) => [`${name}FilterMap`],
    db: (name) => ["db"]
};

const generators: Record<NodeType, GeneratorFunc | null> = {
    router: generateRouter,
    controller: generateController,
    validator: generateValidator,
    service: generateService,
    filter: generateFilter,
    schema: null,
    db: null,
}

type Export = Record<string, any>;

const visited: Record<string, boolean> = {};
const checked: Record<string, boolean> = {};
export const valid: Record<string, boolean> = {};

export let mods: Export = {};

// Build the graph dependecies for a given name
export function buildGraph(cfg: BradConfig, name: string, type: NodeType): Node {
    const n: Node = {
        // TODO: refactor this
        path: type == "db" 
            ? path.resolve(cfg.cwd, cfg.dbImportPath) 
            : pathTo(cfg, name, type),
        name: name,
        type: type,
        adj: [],
        exports: requiredExports[type](name)
    };

    if (!checked[id(n)]) {
        checked[id(n)] = true;

        try {
            // If config is set to override = true we not check the modules and re-write anywise
            if (cfg.override) {
                valid[id(n)] = false;
            } else {
                const mod = checkNode(n);
                mods = { ...mods, ...mod };
                valid[id(n)] = true;
            }
        } catch(err: any) {
            console.error(err.message);
            console.log(cfg.override);

            // it's not necessary to set it to false
            valid[id(n)] = false;
        }
    }

    for (const depType of dependOn[type]) {
        const adj = buildGraph(cfg, n.name, depType);
        n.adj.push(adj);
    }

    return n;
}

// Creates a new node directed to <to> node
export function addNodeTo(cfg: BradConfig, name: string, type: NodeType, to: Node) {
    const n: Node = {
        path: type == "db" 
            ? path.resolve(cfg.cwd, cfg.dbImportPath) 
            : pathTo(cfg, name, type),
        name: name,
        type: type,
        adj: [to],
        exports: requiredExports[to.type](name)
    };
    return n;
}

export function build(root: Node) {
    if (visited[id(root)]) {
        return;
    }
    visited[id(root)] = true;
    const importLines = [];

    for (const dep of root.adj) {
        importLines.push(buildImportLine(root, dep));
        build(dep);
    }

    if (!valid[id(root)]) {
        const gen = generators[root.type];
        if (!gen) {
            throw Error(`Missing generator for ${root.type}`);
        }

        console.log(`Generating ${root.name}.${root.type} ...`);

        const table = mods[`${root.name}Table`];

        const code = gen(root.name, table, importLines);
        fs.writeFileSync(root.path, code);
    }
}

export function destroy(root: Node) {
    for (const n of root.adj) {
        destroy(n);
    }

    // We only delete the nodes with dependencies
    // we are not going to delete schemas or db
    if (root.adj.length > 0) {
        const path = root.path;
        try {
            console.log(`Deleting ${path}...`);
            fs.rmSync(path);
        } catch {
            console.error(path, "does not exists");
        }
    }
}

/* 
    * Check if a Node exists and has it's exports
    * @throws Error
*/
function checkNode(root: Node): Export {
    console.log(`Checking ${root.name}.${root.type}...`);

    // throw the require error
    const module = require(root.path);

    for (const exp of root.exports) {
        if (!module[exp]) {
            throw new Error(`[Missing export]: Cannot import ${exp} from ${root.path}`);
        }
    }

    return module;
}

function buildImportLine(from: Node, to: Node, maxColumns = 80) {
    const relativePath = buildRelativeImport(from.path, to.path);

    let sep = ' ';
    let importLine: string = '';

    let imports = to.exports.join(`,${sep}`);
    importLine = `import {${sep}${imports}${sep}} from "${relativePath}"`;

    if (importLine.length > maxColumns) {
        sep = '\n\t';
        imports = to.exports.join(`,${sep}`);
        importLine = `import {${sep}${imports}${sep}} from "${relativePath}"`;
    }
    return importLine;
}

function pathTo(cfg: BradConfig, name: string, type: NodeType) {
    return path.resolve(cfg.cwd, dir(cfg, type), `${name}.${type}.ts`);
}

function removeExt(p: string) {
    const parsed = path.parse(p);
    return path.join(parsed.dir, parsed.name);
}

function buildRelativeImport(from: string, to: string) {
    return path.relative(path.dirname(from), removeExt(to));
}

const dir = (cfg: any, type: NodeType): string => cfg[`${type}Dir`];
const id = (n: Node): string => `${n.name}.${n.type}`;
