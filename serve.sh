#!/bin/bash
# Start the travel site in your browser
cd "$(dirname "$0")"
echo "Opening travel site at http://localhost:8933"
python3 -m http.server 8933
