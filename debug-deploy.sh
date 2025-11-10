#!/bin/bash
# ResShare Deployment Debug Script
# Run this on your EC2 instance to diagnose and fix deployment issues

set -e

echo "=================================================="
echo "ResShare Deployment Debug & Fix Script"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on EC2
echo -e "${YELLOW}Checking environment...${NC}"
if [ -f /sys/hypervisor/uuid ] && [ `head -c 3 /sys/hypervisor/uuid` == "ec2" ]; then
    echo -e "${GREEN}✓ Running on EC2${NC}"
else
    echo -e "${YELLOW}⚠ Not detected as EC2 instance${NC}"
fi

# Check system resources
echo ""
echo -e "${YELLOW}System Resources:${NC}"
echo "Memory:"
free -h | grep -E "Mem|Swap"
echo ""
echo "Disk Space:"
df -h | grep -E "Filesystem|/$"
echo ""

# Check if Docker is running
echo -e "${YELLOW}Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker is not running or not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker is running${NC}"

# Check if docker-compose is available
if command -v docker-compose &> /dev/null; then
    COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    echo -e "${RED}✗ Docker Compose not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose available${NC}"

# Navigate to project directory
if [ ! -d "$HOME/ResShareDeployable" ]; then
    echo -e "${RED}✗ ResShareDeployable directory not found in $HOME${NC}"
    echo "Please ensure your project is at: $HOME/ResShareDeployable"
    exit 1
fi

cd $HOME/ResShareDeployable
echo -e "${GREEN}✓ Found project directory${NC}"

# Check for required files
echo ""
echo -e "${YELLOW}Checking required files...${NC}"
for file in docker-compose.yml Dockerfile entrypoint.sh .env; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file exists${NC}"
    else
        echo -e "${RED}✗ $file missing${NC}"
        exit 1
    fi
done

# Validate .env file
echo ""
echo -e "${YELLOW}Validating .env configuration...${NC}"
if grep -q "GOOGLE_API_KEY=" .env && ! grep -q 'GOOGLE_API_KEY=""' .env && ! grep -q 'GOOGLE_API_KEY=$' .env; then
    echo -e "${GREEN}✓ GOOGLE_API_KEY is set${NC}"
else
    echo -e "${RED}✗ GOOGLE_API_KEY is not set or empty${NC}"
    echo "Please set your Google Gemini API key in .env file"
fi

if grep -q "FLASK_SECRET_KEY=" .env && ! grep -q 'FLASK_SECRET_KEY=""' .env; then
    echo -e "${GREEN}✓ FLASK_SECRET_KEY is set${NC}"
else
    echo -e "${RED}✗ FLASK_SECRET_KEY is not set${NC}"
fi

if grep -q "FLASK_ENV=production" .env; then
    echo -e "${GREEN}✓ FLASK_ENV is set to production${NC}"
else
    echo -e "${YELLOW}⚠ FLASK_ENV is not set to production${NC}"
fi

# Check for port conflicts
echo ""
echo -e "${YELLOW}Checking for port conflicts...${NC}"
for port in 5000 8080 9094; do
    if sudo netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo -e "${YELLOW}⚠ Port $port is in use${NC}"
        sudo netstat -tuln | grep ":$port "
    else
        echo -e "${GREEN}✓ Port $port is available${NC}"
    fi
done

# Stop existing containers
echo ""
echo -e "${YELLOW}Stopping existing containers...${NC}"
$COMPOSE_CMD down -v
echo -e "${GREEN}✓ Containers stopped and volumes removed${NC}"

# Clean up old images (optional)
echo ""
read -p "Do you want to remove old Docker images to start fresh? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Removing old images...${NC}"
    docker system prune -af
    echo -e "${GREEN}✓ Old images removed${NC}"
fi

# Build new images
echo ""
echo -e "${YELLOW}Building Docker images (this may take 5-10 minutes)...${NC}"
$COMPOSE_CMD build --no-cache

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

# Start containers
echo ""
echo -e "${YELLOW}Starting containers...${NC}"
$COMPOSE_CMD up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Containers started${NC}"
else
    echo -e "${RED}✗ Failed to start containers${NC}"
    exit 1
fi

# Monitor startup
echo ""
echo -e "${YELLOW}Monitoring startup (this will take 2-3 minutes)...${NC}"
echo "Press Ctrl+C to stop monitoring and continue"
echo ""
timeout 180 $COMPOSE_CMD logs -f || true

echo ""
echo -e "${YELLOW}Checking container status...${NC}"
$COMPOSE_CMD ps

# Check if container is running
if docker ps | grep -q "resshare-backend"; then
    echo -e "${GREEN}✓ Container is running${NC}"

    # Wait a bit for services to initialize
    echo ""
    echo -e "${YELLOW}Waiting 30 seconds for services to initialize...${NC}"
    sleep 30

    # Test services
    echo ""
    echo -e "${YELLOW}Testing services...${NC}"

    # Test Flask
    echo -n "Flask API: "
    if curl -sf http://localhost:5000/ > /dev/null; then
        echo -e "${GREEN}✓ OK${NC}"
    else
        echo -e "${RED}✗ Failed${NC}"
    fi

    # Test IPFS
    echo -n "IPFS: "
    if docker exec resshare-backend ipfs id > /dev/null 2>&1; then
        echo -e "${GREEN}✓ OK${NC}"
    else
        echo -e "${RED}✗ Failed${NC}"
    fi

    # Test IPFS Cluster
    echo -n "IPFS Cluster: "
    if docker exec resshare-backend curl -sf http://localhost:9094/api/v0/id > /dev/null; then
        echo -e "${GREEN}✓ OK${NC}"
    else
        echo -e "${YELLOW}⚠ Warning (may still be initializing)${NC}"
    fi

    echo ""
    echo -e "${GREEN}=================================================="
    echo "Deployment appears successful!"
    echo "=================================================="
    echo -e "${NC}"
    echo "Your API is available at:"
    INSTANCE_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "YOUR_EC2_IP")
    echo "  http://$INSTANCE_IP:5000"
    echo ""
    echo "To view logs:"
    echo "  $COMPOSE_CMD logs -f"
    echo ""
    echo "To check detailed logs inside container:"
    echo "  docker exec resshare-backend cat /app/startup.log"
    echo "  docker exec resshare-backend cat /app/ipfs.log"
    echo "  docker exec resshare-backend cat /app/ipfs-cluster.log"

else
    echo -e "${RED}✗ Container is not running${NC}"
    echo ""
    echo "Recent logs:"
    $COMPOSE_CMD logs --tail=100
    echo ""
    echo "To continue debugging, check:"
    echo "  1. Full logs: $COMPOSE_CMD logs"
    echo "  2. Container status: docker ps -a"
    echo "  3. System resources: free -h && df -h"
fi
