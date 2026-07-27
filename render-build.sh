#!/bin/bash

echo "=== Installing dependencies ==="
npm install

echo "=== Installing TypeScript packages ==="
npm install --save-dev typescript @types/react @types/node

echo "=== Running build ==="
npm run build

echo "=== Build complete ==="
