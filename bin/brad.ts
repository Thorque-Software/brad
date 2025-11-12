#!/usr/bin/env node

import commander from '../src/commands';
import path from 'path';
import fs from 'fs';

const args = process.argv.slice(2);

const main = async () => {
    // Load config file
    const configPath = path.resolve(process.cwd(), 'brad.config.mjs');
    let config = {};

    if (fs.existsSync(configPath)) {
        try {
            const loadedConfig = require(configPath);
            config = loadedConfig.default || loadedConfig;
            console.log(config);
            console.log("Loaded brad.config.js");
        } catch (e) {
            console.error("Error loading brad.config.js:", e);
            return;
        }
    } else {
        console.warn("Warning: brad.config.js not found. Using default settings.");
    }


    if (args.length === 0) {
        console.log("Brad CLI - Available commands: make:entity");
        return;
    }

    const command = args[0];

    if (command === 'make:entity') {
        const entityName = args[1];
        if (!entityName) {
            console.error("Error: Entity name is required. Usage: brad make:entity <EntityName>");
            return;
        }

        let basePath = 'src'; // Default path
        const pathArg = args.find(arg => arg.startsWith('--path='));
        if (pathArg) {
            basePath = pathArg.split('=')[1];
        }

        await commander.createEntity(entityName, basePath, config);
    } else {
        console.error(`Error: Unknown command '${command}'`);
    }
};

main();
