#!/bin/bash

npm run seed
npm run generate && npm run build && vitest
npm run generate:builder && npm run build && vitest
