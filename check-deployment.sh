#!/bin/bash

# Script to check GitHub Pages deployment
# Usage: ./check-deployment.sh

echo "🔍 Checking GitHub Pages Deployment..."
echo ""

# Check the deployed HTML
echo "📄 Checking deployed HTML at https://a-a-m-k.github.io/historical-europe-map/"
echo ""

echo "Script sources:"
curl -s https://a-a-m-k.github.io/historical-europe-map/ | grep -o 'src="[^"]*"' | head -5
echo ""

echo "Manifest and favicon links:"
curl -s https://a-a-m-k.github.io/historical-europe-map/ | grep -o 'href="[^"]*\(manifest\|favicon\)[^"]*"' | head -5
echo ""

echo "✅ If you see '/src/main.tsx' or paths without '/historical-europe-map/', the deployment is outdated."
echo "✅ If you see '/historical-europe-map/assets/...', the deployment is correct."
