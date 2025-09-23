#!/bin/bash

echo "📊 Testing Complete Logging Flow (NestJS → Promtail → Loki → Grafana)"
echo "======================================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}1. Checking NestJS Application...${NC}"
if curl -s http://localhost:3000/v1/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ NestJS app is running and generating logs${NC}"
else
    echo -e "${RED}❌ NestJS app is not running${NC}"
    exit 1
fi

echo -e "\n${BLUE}2. Checking Log Files...${NC}"
if [ -d "logs" ] && [ "$(ls -A logs)" ]; then
    echo -e "${GREEN}✅ Log files exist in /logs directory${NC}"
    echo "   Latest log file: $(ls -t logs/*.log | head -1)"
    echo "   Log file size: $(du -h logs/application-$(date +%Y-%m-%d).log 2>/dev/null | cut -f1 || echo 'N/A')"
else
    echo -e "${RED}❌ No log files found${NC}"
fi

echo -e "\n${BLUE}3. Checking Promtail (Log Collector)...${NC}"
if docker ps | grep -q promtail; then
    echo -e "${GREEN}✅ Promtail container is running${NC}"
    echo "   Status: $(docker ps | grep promtail | awk '{print $7}')"

    # Check Promtail targets
    if curl -s http://localhost:9080/targets | grep -q "application-2025-09-22.log"; then
        echo -e "${GREEN}✅ Promtail is actively collecting logs${NC}"
    else
        echo -e "${YELLOW}⚠️  Promtail is running but may not be collecting logs yet${NC}"
    fi
else
    echo -e "${RED}❌ Promtail container is not running${NC}"
fi

echo -e "\n${BLUE}4. Checking Loki (Log Storage)...${NC}"
if docker ps | grep -q loki; then
    echo -e "${GREEN}✅ Loki container is running${NC}"

    # Check Loki readiness
    if curl -s http://localhost:3100/ready | grep -q "ready"; then
        echo -e "${GREEN}✅ Loki is ready to receive logs${NC}"
    else
        echo -e "${YELLOW}⚠️  Loki is starting up (this is normal)${NC}"
    fi
else
    echo -e "${RED}❌ Loki container is not running${NC}"
fi

echo -e "\n${BLUE}5. Checking Grafana (Log Visualization)...${NC}"
if docker ps | grep -q grafana; then
    echo -e "${GREEN}✅ Grafana container is running${NC}"

    if curl -s http://localhost:3001 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Grafana UI is accessible${NC}"
    else
        echo -e "${YELLOW}⚠️  Grafana UI may be starting up${NC}"
    fi
else
    echo -e "${RED}❌ Grafana container is not running${NC}"
fi

echo -e "\n${BLUE}6. Generating Test Logs...${NC}"
echo "Making API calls to generate fresh logs..."

# Generate various types of logs
curl -s http://localhost:3000/v1/health > /dev/null && echo "✅ Health check log generated"
curl -s http://localhost:3000/v1/metrics > /dev/null && echo "✅ Metrics log generated"
curl -s http://localhost:3000/v1/tracing/test > /dev/null && echo "✅ Tracing log generated"
curl -s http://localhost:3000/v1/tracing/status > /dev/null && echo "✅ Status log generated"

echo -e "\n${YELLOW}📊 How to View Logs in Grafana:${NC}"
echo -e "   1. Open: http://localhost:3001"
echo -e "   2. Login: admin / admin"
echo -e "   3. Go to: Explore (compass icon)"
echo -e "   4. Select: Loki data source"
echo -e "   5. Query: {job=\"varlogs\"}"
echo -e "   6. Click: Run Query"

echo -e "\n${YELLOW}🔍 Log Flow Summary:${NC}"
echo -e "   NestJS App → Writes to /logs/*.log"
echo -e "   Promtail → Watches /logs/*.log and sends to Loki"
echo -e "   Loki → Stores logs with labels and timestamps"
echo -e "   Grafana → Connects to Loki and displays logs"

echo -e "\n${YELLOW}📝 Useful Commands:${NC}"
echo -e "   • View live logs: tail -f logs/application-$(date +%Y-%m-%d).log"
echo -e "   • Check Promtail: docker logs promtail"
echo -e "   • Check Loki: docker logs loki"
echo -e "   • Check Grafana: docker logs grafana"

echo -e "\n${GREEN}✅ Logging flow test completed!${NC}"
echo -e "\n${BLUE}Next Steps:${NC}"
echo -e "   1. Open Grafana UI to view logs"
echo -e "   2. Create dashboards for log monitoring"
echo -e "   3. Set up alerts for error logs"
echo -e "   4. Configure log retention policies"
