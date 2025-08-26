#!/bin/bash
set -e

# Simple deployment for static HTML site
echo "🚀 Deploying Unruly Abstractions (static HTML)..."

# Add all changes
git add .

# Commit changes
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
git commit -m "Update site - ${TIMESTAMP}" || echo "No changes to commit"

# Push to main branch (GitHub Pages will serve from main)
git push origin master

echo "
✅ Deployment complete!

The site is now live at: https://unrulyabstractions.github.io

Note: It may take a few minutes for GitHub Pages to update.
You can check the deployment status at:
https://github.com/unrulyabstractions/unrulyabstractions.github.io/actions
"