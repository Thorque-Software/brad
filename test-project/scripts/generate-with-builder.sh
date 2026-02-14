#!/bin/bash

## Re write controllers with builder
node ../dist/src/commands.js generate event router --controller-with-builder
node ../dist/src/commands.js generate inscription router --controller-with-builder
node ../dist/src/commands.js generate student router --controller-with-builder
