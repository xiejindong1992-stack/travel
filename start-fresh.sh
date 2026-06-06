#!/bin/bash
# 1. Apply decodeURIComponent fix to app.js
cd /Users/don/Documents/✈️travel
sed -i '' 's/if (parts\[1\]) params.slug = parts\[1\];/if (parts[1]) params.slug = decodeURIComponent(parts[1]);/' js/app.js

# 2. Verify the fix is there
echo "=== Verify fix ==="
grep "decodeURIComponent" js/app.js

# 3. Start server
echo "=== Starting server on port 8955 ==="
python3 -m http.server 8955
