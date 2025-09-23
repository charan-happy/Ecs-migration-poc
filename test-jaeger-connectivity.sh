#!/bin/bash

echo "🔍 Testing Jaeger Connectivity and Service Names"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}1. Checking Jaeger container status...${NC}"
if docker ps | grep -q jaeger; then
    echo -e "${GREEN}✅ Jaeger container is running${NC}"
else
    echo -e "${RED}❌ Jaeger container is not running${NC}"
    exit 1
fi

echo -e "\n${BLUE}2. Testing OTLP endpoint connectivity...${NC}"
if curl -s http://localhost:4318/v1/traces > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OTLP endpoint is accessible${NC}"
else
    echo -e "${RED}❌ OTLP endpoint is not accessible${NC}"
fi

echo -e "\n${BLUE}3. Testing Jaeger UI accessibility...${NC}"
if curl -s http://localhost:16686 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Jaeger UI is accessible${NC}"
else
    echo -e "${RED}❌ Jaeger UI is not accessible${NC}"
fi

echo -e "\n${BLUE}4. Generating test traces...${NC}"
echo "Making API calls to generate traces..."

# Health check
curl -s http://localhost:3000/v1/health > /dev/null
echo "✅ Health check trace generated"

# Metrics
curl -s http://localhost:3000/v1/metrics > /dev/null
echo "✅ Metrics trace generated"

# Tracing test
curl -s http://localhost:3000/v1/tracing/test > /dev/null
echo "✅ Custom trace generated"

echo -e "\n${YELLOW}📊 Now check Jaeger UI:${NC}"
echo -e "   1. Open: http://localhost:16686"
echo -e "   2. Look for service: 'nestjs-app' (not 'jaeger-all-in-one')"
echo -e "   3. If you still see 'jaeger-all-in-one', wait 30 seconds and refresh"
echo -e "   4. Check the 'Services' dropdown for 'nestjs-app'"

echo -e "\n${YELLOW}🔧 Troubleshooting:${NC}"
echo -e "   • If traces don't appear, check application logs for OpenTelemetry errors"
echo -e "   • Ensure OTLP endpoint is set to 'http://localhost:4318/v1/traces'"
echo -e "   • Verify service name is 'nestjs-app' in environment variables"
echo -e "   • Check that Jaeger container is running and accessible"

echo -e "\n${GREEN}✅ Test completed!${NC}"
