#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_FILE="$SCRIPT_DIR/../docs/CODEX_PROMPT_NEWTASK.md"
TARGET_DIR="$HOME/.codex/prompts"
TARGET_FILE="$TARGET_DIR/newtask.md"

mkdir -p "$TARGET_DIR"
cp "$SOURCE_FILE" "$TARGET_FILE"

echo "Prompt instalado em: $TARGET_FILE"
echo "Reinicie o Codex ou abra uma nova sessão para carregar /prompts:newtask."
