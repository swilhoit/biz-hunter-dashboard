#!/bin/bash

# Script to add SUPABASE_SERVICE_ROLE_KEY to Render using API
# You'll need to replace SERVICE_ID and API_KEY with your actual values

SERVICE_ID="your-render-service-id"
API_KEY="your-render-api-key"
ENV_VAR_KEY="SUPABASE_SERVICE_ROLE_KEY"
ENV_VAR_VALUE="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlZW10bm9oZ2tvdnd6b2R6eGRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDg2NzI5NSwiZXhwIjoyMDY2NDQzMjk1fQ.k5gHdYV7iBfQBfd31eVmk-LkfXKRY06RPiPVGAz2VM0"

curl --request PATCH \
  --url "https://api.render.com/v1/services/${SERVICE_ID}/env-vars" \
  --header "accept: application/json" \
  --header "authorization: Bearer ${API_KEY}" \
  --header "content-type: application/json" \
  --data '[
    {
      "key": "'${ENV_VAR_KEY}'",
      "value": "'${ENV_VAR_VALUE}'"
    }
  ]'

echo "Environment variable added. Service will redeploy automatically."