#!/bin/bash

./clean.sh
npm run brad generate event router
npm run brad generate inscription router
npm run brad generate student router

## Check that the generated code compiles
npm run build

## Seeders
npm run seed

## Run tests
npx vitest
