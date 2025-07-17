#! /bin/sh

pnpm i --frozen-lockfile
if [ $? -ne 0 ]; then
  echo 'Error: Lockfile is not up to date. Please run `pnpm install` and commit the updated lockfile.'
  exit 1
fi
