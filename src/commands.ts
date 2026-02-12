#!/usr/bin/env node

import { Command, Argument } from "commander"
import { build, destroy, buildGraph, nodeTypes, NodeType, valid } from './builder';
import { loadConfig } from './config';

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
    .option('-o, --override', 'Generator will override the current code', false) 
    .description("generate entity recursively")
    .action(async (name: string, type: NodeType, options) => {
        const cfg = loadConfig();
        cfg.override = options.override || false; 

        require('ts-node/register');

        const root = buildGraph(cfg, name, type);
        // Aca tendríamos que ir desde (name, type) hasta la raiz (name, "router")
        // y desde ahi, ver si tenemos dependencias de otra entidad
        console.log(JSON.stringify(root, null, 4));
        console.log(valid);
        build(root);
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

        const root = buildGraph(cfg, name, type);
        destroy(root);
    })

program.parseAsync(process.argv);
