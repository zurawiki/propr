#!/bin/bash

set -e
set -o pipefail

echo "Running propr fmt over all staged files"

# Loop over git files to be added
for FILE in $(git diff --name-only HEAD)
do
  echo " Formatting" ${FILE}
  node bin/propr.js fmt -d ${FILE}
  read -p "..."
done