#!/bin/bash

# Script to add SUPABASE_SERVICE_ROLE_KEY to Render using API
# You'll need to replace SERVICE_ID and API_KEY with your actual values

SERVICE_ID="your-render-service-id"
API_KEY="your-render-api-key"
ENV_VAR_KEY="SUPABASE_SERVICE_ROLE_KEY"
ENV_VAR_VALUE="${SUPABASE_SERVICE_ROLE_KEY}"

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