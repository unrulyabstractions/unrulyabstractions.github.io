#!/bin/bash

# refresh-local.sh
# Development server with auto-reload for Unruly Abstractions website
#
# This script starts a local development server that automatically refreshes
# the browser when any HTML, JSON, CSS, or PDF files change.
#
# Usage:
#   ./refresh-local.sh
#
# Requirements:
#   - browser-sync (installed via: npm install -g browser-sync)
#
# Features:
#   - Auto-reload on file changes
#   - Watches: HTML, JSON (content.json, geometry.json), CSS, PDF files
#   - Opens browser automatically at http://localhost:3000
#   - No cache issues - always serves fresh content

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Unruly Abstractions development server...${NC}"
echo -e "${BLUE}Watching for changes in HTML, JSON, CSS, and PDF files${NC}"
echo ""

# Start browser-sync with file watching
# --server: Start a local web server
# --files: Watch these file patterns for changes
# --no-notify: Disable browser notification overlay
# --no-open: Don't automatically open browser (optional - remove if you want auto-open)
browser-sync start \
  --server \
  --files "**/*.html" "config/*.json" "**/*.css" "pdfs/*.pdf" \
  --no-notify

# Note: Press Ctrl+C to stop the server
