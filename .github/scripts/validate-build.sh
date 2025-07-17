#!/bin/bash

set -e

echo "Installing dependencies..."
pnpm i --frozen-lockfile
if [ $? -ne 0 ]; then
  echo 'Error: Lockfile is not up to date. Please run `pnpm install` and commit the updated lockfile.'
  exit 1
fi

echo "Running linting..."
pnpm run lint

echo "Running type checking..."
pnpm run type-check

echo "Running tests..."
pnpm run test:ci

echo "Building packages..."
pnpm run build

echo "All checks passed!"
