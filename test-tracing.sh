#!/bin/bash

echo "🧪 Testing Jaeger Tracing with NestJS Application"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}1. Testing Health Check API (will create traces)...${NC}"
curl -s http://localhost:3000/v1/health | jq '.data.status'

echo -e "\n${BLUE}2. Testing Metrics API (will create traces)...${NC}"
curl -s http://localhost:3000/v1/metrics | head -3

echo -e "\n${BLUE}3. Testing Tracing Status API...${NC}"
curl -s http://localhost:3000/v1/tracing/status | jq '.data'

echo -e "\n${BLUE}4. Testing Custom Trace Generation...${NC}"
curl -s http://localhost:3000/v1/tracing/test | jq '.data.traceId'

echo -e "\n${GREEN}✅ All API calls completed!${NC}"
echo -e "\n${YELLOW}📊 To view traces in Jaeger:${NC}"
echo -e "   1. Open: http://localhost:16686"
echo -e "   2. Select Service: 'nestjs-app'"
echo -e "   3. Click 'Find Traces'"
echo -e "   4. Click on any trace to see details"

echo -e "\n${YELLOW}🔍 What you'll see in Jaeger:${NC}"
echo -e "   • Request duration and timing"
echo -e "   • HTTP method and URL"
echo -e "   • Response status codes"
echo -e "   • User agent information"
echo -e "   • Custom span attributes"
echo -e "   • Error details (if any)"

echo -e "\n${YELLOW}💾 Jaeger Database Info:${NC}"
echo -e "   • Current: In-memory storage (development)"
echo -e "   • Production: Cassandra/Elasticsearch"
echo -e "   • OTLP Endpoint: http://jaeger:4318/v1/traces"
echo -e "   • UI Port: 16686"
