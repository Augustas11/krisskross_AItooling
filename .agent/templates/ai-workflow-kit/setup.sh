#!/bin/bash

# AI Workflow Kit Setup Script
# Purpose: Install AI context documents into any project
# Usage: bash setup.sh [target-directory]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${1:-.}"  # Default to current directory

echo -e "${BLUE}🚀 AI Workflow Kit Setup${NC}"
echo -e "${BLUE}========================${NC}"
echo ""
echo -e "Source: ${YELLOW}$SCRIPT_DIR${NC}"
echo -e "Target: ${YELLOW}$TARGET_DIR${NC}"
echo ""

# Confirm
read -p "Install AI Workflow Kit to $TARGET_DIR? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Aborted.${NC}"
    exit 1
fi

# Create directories
echo -e "${BLUE}Creating directories...${NC}"
mkdir -p "$TARGET_DIR/.agent/workflows"
mkdir -p "$TARGET_DIR/docs"
mkdir -p "$TARGET_DIR/scripts"

# Copy core files (only if they don't exist)
copy_if_missing() {
    local src="$1"
    local dest="$2"
    local name="$3"
    
    if [ -f "$dest" ]; then
        echo -e "  ${YELLOW}⏭️  Skipped${NC} $name (already exists)"
    else
        cp "$src" "$dest"
        echo -e "  ${GREEN}✅ Created${NC} $name"
    fi
}

echo -e "${BLUE}Installing core documents...${NC}"
copy_if_missing "$SCRIPT_DIR/AGENTS.md" "$TARGET_DIR/AGENTS.md" "AGENTS.md"
copy_if_missing "$SCRIPT_DIR/MAP.md" "$TARGET_DIR/MAP.md" "MAP.md"
copy_if_missing "$SCRIPT_DIR/STANDARDS.md" "$TARGET_DIR/STANDARDS.md" "STANDARDS.md"
copy_if_missing "$SCRIPT_DIR/VAULT.md" "$TARGET_DIR/VAULT.md" "VAULT.md"

echo -e "${BLUE}Installing workflows...${NC}"
copy_if_missing "$SCRIPT_DIR/workflows/session-handoff.md" "$TARGET_DIR/.agent/workflows/session-handoff.md" ".agent/workflows/session-handoff.md"
copy_if_missing "$SCRIPT_DIR/workflows/push.md" "$TARGET_DIR/.agent/workflows/push.md" ".agent/workflows/push.md"
copy_if_missing "$SCRIPT_DIR/workflows/token-management.md" "$TARGET_DIR/.agent/workflows/token-management.md" ".agent/workflows/token-management.md"

echo -e "${BLUE}Installing templates...${NC}"
copy_if_missing "$SCRIPT_DIR/scripts-README-template.md" "$TARGET_DIR/scripts/README.md" "scripts/README.md"
copy_if_missing "$SCRIPT_DIR/migrations-manifest-template.md" "$TARGET_DIR/docs/MIGRATIONS_MANIFEST.md" "docs/MIGRATIONS_MANIFEST.md"

echo ""
echo -e "${GREEN}✨ Installation complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Edit ${BLUE}AGENTS.md${NC} - Update project name and tech stack"
echo -e "  2. Edit ${BLUE}MAP.md${NC} - Map your file structure"
echo -e "  3. Edit ${BLUE}scripts/README.md${NC} - Inventory your scripts"
echo -e "  4. Edit ${BLUE}docs/MIGRATIONS_MANIFEST.md${NC} - Track your migrations"
echo ""
echo -e "${BLUE}See the README at:${NC}"
echo -e "  $SCRIPT_DIR/README.md"
echo ""
