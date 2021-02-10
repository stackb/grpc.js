#!/usr/bin/env bash

set -euo pipefail

for LABEL in $(bazel query 'kind(".*_run", //rules/proto/...)' --output label)
do
    bazel run "$LABEL"
done
