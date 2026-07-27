#!/bin/bash

# Install dependencies
npm install

# Install TypeScript packages explicitly
npm install --save-dev typescript @types/react @types/node

# Build the project
npm run build
