#!/bin/bash

npm run seed
npm run generate && npm run build && npx vitest
npm run generate:builder && npm run build && npx vitest
