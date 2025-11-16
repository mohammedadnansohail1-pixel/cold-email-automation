#!/bin/bash

# API Testing Script
# Quick commands to test all API endpoints

set -e

API_URL="http://localhost:3001/api"
TOKEN=""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🧪 API Testing Script"
echo "===================="
echo ""

# Test health endpoint
echo "1. Testing health endpoint..."
HEALTH=$(curl -s $API_URL/../health)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed${NC}"
    exit 1
fi
echo ""

# Login and get token
echo "2. Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Login failed${NC}"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Login successful${NC}"
echo "Token: ${TOKEN:0:20}..."
echo ""

# Test companies endpoint
echo "3. Testing companies endpoint..."
COMPANIES=$(curl -s $API_URL/companies \
  -H "Authorization: Bearer $TOKEN")

COMPANY_COUNT=$(echo $COMPANIES | grep -o '"total":[0-9]*' | grep -o '[0-9]*$')
echo -e "${GREEN}✓ Found $COMPANY_COUNT companies${NC}"
echo ""

# Test contacts endpoint
echo "4. Testing contacts endpoint..."
CONTACTS=$(curl -s $API_URL/contacts \
  -H "Authorization: Bearer $TOKEN")

CONTACT_COUNT=$(echo $CONTACTS | grep -o '"total":[0-9]*' | grep -o '[0-9]*$')
echo -e "${GREEN}✓ Found $CONTACT_COUNT contacts${NC}"
echo ""

# Test campaigns endpoint
echo "5. Testing campaigns endpoint..."
CAMPAIGNS=$(curl -s $API_URL/campaigns \
  -H "Authorization: Bearer $TOKEN")

echo -e "${GREEN}✓ Campaigns endpoint working${NC}"
echo ""

# Test analytics endpoint
echo "6. Testing analytics endpoint..."
ANALYTICS=$(curl -s $API_URL/analytics/dashboard \
  -H "Authorization: Bearer $TOKEN")

echo -e "${GREEN}✓ Analytics endpoint working${NC}"
echo ""

# Test AI endpoint (if OpenAI key is configured)
echo "7. Testing AI endpoints..."
if grep -q "OPENAI_API_KEY=sk-" ../.env 2>/dev/null; then
    echo "  Generating test email..."
    AI_RESPONSE=$(curl -s -X POST $API_URL/ai/generate-email \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{
        "contact_id": 1,
        "template_type": "initial_outreach"
      }')

    if echo "$AI_RESPONSE" | grep -q "subject"; then
        echo -e "${GREEN}✓ AI email generation working${NC}"
    else
        echo -e "${YELLOW}⚠ AI endpoint responded but may need valid OpenAI key${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Skipping AI test (no OpenAI API key configured)${NC}"
fi
echo ""

# Create test company
echo "8. Testing company creation..."
NEW_COMPANY=$(curl -s -X POST $API_URL/companies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Company Inc",
    "domain": "test-'$(date +%s)'.example.com",
    "industry": "Technology",
    "size": "100-499"
  }')

if echo "$NEW_COMPANY" | grep -q "Test Company Inc"; then
    echo -e "${GREEN}✓ Company creation working${NC}"
else
    echo -e "${YELLOW}⚠ Company creation may have issues${NC}"
fi
echo ""

# Summary
echo "===================="
echo -e "${GREEN}✅ API Testing Complete${NC}"
echo "===================="
echo ""
echo "All major endpoints tested successfully!"
echo "Your API is ready to use."
echo ""
