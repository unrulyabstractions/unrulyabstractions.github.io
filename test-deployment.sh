#!/bin/bash
set -e

# Simple deployment test for static site
echo "🧪 Testing deployment..."

# Create test file
TEST_FILE="test-deployment.txt"
echo "Test deployment $(date)" > "${TEST_FILE}"

# Deploy
./deploy.sh

# Test accessibility (wait a moment for propagation)
echo "⏳ Waiting 30 seconds for GitHub Pages to update..."
sleep 30

LIVE_URL="https://unrulyabstractions.github.io/${TEST_FILE}"
echo "Testing: ${LIVE_URL}"

if curl -f -s "${LIVE_URL}" > /dev/null; then
    echo "✅ Deployment test passed! Site is accessible."
else
    echo "❌ Deployment test failed - Site not accessible yet (may need more time)"
fi

# Cleanup
rm -f "${TEST_FILE}"

echo "🏁 Test complete"